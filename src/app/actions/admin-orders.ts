"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDeliveryAreas } from "@/lib/catalog";
import { createOrderWithStock, OrderError } from "@/lib/create-order";
import { berlinToday } from "@/lib/format";
import { notifyNewOrder } from "@/lib/notify";
import { findArea } from "@/lib/postcode";
import { siteBase } from "@/lib/site";

export type AdminOrderState = { error?: string; fieldErrors?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(2, "Enter the customer's name.").max(100),
  phone: z.string().trim().max(30).refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a phone number."),
  email: z.string().trim().max(200).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email or leave it empty."),
  street: z.string().trim().min(1, "Enter the street and house number.").max(200),
  apartment: z.string().trim().max(200),
  postcode: z.string().trim(),
  note: z.string().trim().max(500),
  payment: z.enum(["ON_DELIVERY", "WHATSAPP"]),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a delivery date."),
});

const itemsSchema = z.array(z.object({ id: z.string().min(1).max(40), qty: z.number().int().min(1).max(999) })).min(1, "Add at least one product.").max(100);

/** Staff enter an order taken by WhatsApp or phone. It reserves stock like a website order and starts as Confirmed. */
export async function createAdminOrder(_prev: AdminOrderState, formData: FormData): Promise<AdminOrderState> {
  await requireAdmin();
  const raw = Object.fromEntries(["name", "phone", "email", "street", "apartment", "postcode", "note", "payment", "deliveryDate"].map((k) => [k, String(formData.get(k) ?? "")]));
  const fieldErrors: Record<string, string> = {};
  const parsed = schema.safeParse(raw);
  if (!parsed.success) for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;

  const pc = findArea(raw.postcode, await getDeliveryAreas());
  if (!pc.ok) fieldErrors.postcode = pc.message;

  let items: z.infer<typeof itemsSchema> = [];
  try {
    items = itemsSchema.parse(JSON.parse(String(formData.get("items") ?? "[]")));
  } catch {
    fieldErrors.items = "Add at least one product.";
  }
  if (parsed.success && new Date(parsed.data.deliveryDate + "T00:00:00Z") < berlinToday()) fieldErrors.deliveryDate = "The delivery date can't be in the past.";
  if (!parsed.success || !pc.ok || Object.keys(fieldErrors).length) return { fieldErrors };

  const f = parsed.data;
  const wanted = new Map<string, number>();
  for (const it of items) wanted.set(it.id, (wanted.get(it.id) ?? 0) + it.qty);

  let orderId: string;
  try {
    orderId = await createOrderWithStock({
      wanted, area: pc.area,
      customer: { name: f.name, phone: f.phone, email: f.email, street: f.street, apartment: f.apartment, postcode: f.postcode, note: f.note },
      paymentMethod: f.payment,
      status: "CONFIRMED",
      deliveryDate: new Date(f.deliveryDate + "T00:00:00Z"),
      enforceMinOrder: formData.get("ignoreMinOrder") !== "on",
      fixHint: "Change the quantities and try again.",
    });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    console.error("createAdminOrder failed", e);
    return { error: "The order couldn't be saved. Please try again." };
  }

  revalidatePath("/", "layout");
  if (f.email && formData.get("emailCustomer") === "on") {
    const base = await siteBase();
    const id = orderId;
    after(() => notifyNewOrder(id, base, { alertShop: false }));
  }
  redirect(`/admin/orders/${orderId}?created=1`);
}
