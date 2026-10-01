"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getDeliveryAreas } from "@/lib/catalog";
import { findArea } from "@/lib/postcode";
import { deliveryDate } from "@/lib/format";
import { verifyBotCheck } from "@/lib/bot-check";
import { clientIp, hit, waitText } from "@/lib/rate-limit";
import { releaseStaleOrders } from "@/lib/orders";
import { notifyNewOrder } from "@/lib/notify";
import { createOrderWithStock, OrderError } from "@/lib/create-order";
import { siteBase } from "@/lib/site";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<CheckoutField, string>>;
  values?: Partial<Record<CheckoutField, string>>;
};

type CheckoutField = "name" | "phone" | "email" | "street" | "apartment" | "postcode" | "note" | "payment";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: z.string().trim().max(30).refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a phone number we can call, for example +49 151 2345 6789."),
  email: z.string().trim().max(200).email("Enter an email address like name@example.com."),
  street: z.string().trim().min(1, "Enter your street and house number.").max(200).refine((v) => /\d/.test(v), "Add your house number, for example Torstraße 12."),
  apartment: z.string().trim().max(200).default(""),
  postcode: z.string().trim(),
  note: z.string().trim().max(500).default(""),
  payment: z.enum(["ON_DELIVERY", "WHATSAPP"], { message: "Choose how you'd like to pay." }),
});

const itemsSchema = z
  .array(z.object({ id: z.string().min(1).max(40), qty: z.number().int().min(1).max(99) }))
  .min(1, "Your cart is empty.")
  .max(60);

// Generous for real customers (who may re-order after a mistake), tight enough to stop stock being locked up by spam
const ORDERS_PER_IP_PER_HOUR = 5;
const ORDERS_PER_PHONE = 4;
const ORDERS_PER_PHONE_WINDOW_SEC = 6 * 3600;

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const raw = Object.fromEntries(
    ["name", "phone", "email", "street", "apartment", "postcode", "note", "payment"].map((k) => [k, String(formData.get(k) ?? "")]),
  ) as Record<CheckoutField, string>;

  const fieldErrors: CheckoutState["fieldErrors"] = {};
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as CheckoutField;
      fieldErrors[key] ??= issue.message;
    }
  }
  const areas = await getDeliveryAreas();
  const pc = findArea(raw.postcode, areas);
  if (!pc.ok) fieldErrors.postcode = pc.message;
  if (!parsed.success || !pc.ok) return { fieldErrors, values: raw };

  let items: z.infer<typeof itemsSchema>;
  try {
    items = itemsSchema.parse(JSON.parse(String(formData.get("items") ?? "[]")));
  } catch {
    return { error: "Your cart couldn't be read. Refresh the page and try again.", values: raw };
  }
  // Merge duplicate lines
  const wanted = new Map<string, number>();
  for (const it of items) wanted.set(it.id, (wanted.get(it.id) ?? 0) + it.qty);

  const f = parsed.data;
  const area = pc.area;

  // Stop bots and fake orders before any stock is reserved
  const ip = await clientIp();
  if (!(await verifyBotCheck(String(formData.get("cf-turnstile-response") ?? ""), ip))) {
    return { error: "Please complete the \"I'm not a robot\" check, then place your order again.", values: raw };
  }
  const phoneDigits = f.phone.replace(/\D/g, "").replace(/^(00|0)/, "");
  for (const [key, max, windowSec] of [
    [`order:ip:${ip}`, ORDERS_PER_IP_PER_HOUR, 3600],
    [`order:phone:${phoneDigits}`, ORDERS_PER_PHONE, ORDERS_PER_PHONE_WINDOW_SEC],
  ] as const) {
    const limit = await hit(key, max, windowSec);
    if (!limit.ok) {
      return {
        error: `You've placed several orders in a short time. Please try again in ${waitText(limit.retryAfterSec)}, or message us on WhatsApp and we'll help.`,
        values: raw,
      };
    }
  }

  // Free stock held by orders nobody confirmed
  await releaseStaleOrders().catch((e) => console.error("releaseStaleOrders", e));

  let orderId: string;
  try {
    orderId = await createOrderWithStock({
      wanted, area,
      customer: { name: f.name, phone: f.phone, email: f.email, street: f.street, apartment: f.apartment, postcode: raw.postcode.trim(), note: f.note },
      paymentMethod: f.payment,
      deliveryDate: deliveryDate(area),
      enforceMinOrder: true,
      fixHint: "Update your cart and try again.",
    });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message, values: raw };
    console.error("placeOrder failed", e);
    return { error: "We couldn't place your order. Please try again, or order on WhatsApp.", values: raw };
  }

  revalidatePath("/", "layout");
  // Emails and alerts go out after the customer has been sent to their order page
  const base = await siteBase();
  const placedId = orderId;
  after(() => notifyNewOrder(placedId, base));
  redirect(`/order/${orderId}?new=1`);
}

