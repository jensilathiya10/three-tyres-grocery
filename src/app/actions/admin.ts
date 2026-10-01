"use server";

import { timingSafeEqual, createHash } from "node:crypto";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import type { OrderStatus } from "@/generated/prisma/client";
import { cancelAndRestock, expireSession } from "@/lib/orders";
import { stripe } from "@/lib/stripe";
import { clientIp, hit, peek, reset, waitText } from "@/lib/rate-limit";
import { NET_UNITS } from "@/lib/unit-price";
import { berlinToday } from "@/lib/format";

/* ---------- Session ---------- */

const hash = (s: string) => createHash("sha256").update(s).digest();

const LOGIN_MAX_FAILS = 5;
const LOGIN_WINDOW_SEC = 15 * 60;
const WEAK_PASSWORDS = new Set(["change-me", "password", "admin", "123456"]);

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { error: "ADMIN_PASSWORD is not set on the server." };
  if (process.env.NODE_ENV === "production" && (expected.length < 12 || WEAK_PASSWORDS.has(expected))) {
    return { error: "Admin sign-in is disabled until ADMIN_PASSWORD is changed to a strong password (12+ characters)." };
  }
  const key = `login:${await clientIp()}`;
  const blocked = await peek(key, LOGIN_MAX_FAILS);
  if (!blocked.ok) return { error: `Too many wrong passwords. Try again in ${waitText(blocked.retryAfterSec)}.` };

  const given = String(formData.get("password") ?? "");
  // Compare fixed-length hashes so timing doesn't leak the password length
  if (!timingSafeEqual(hash(given), hash(expected))) {
    const after = await hit(key, LOGIN_MAX_FAILS, LOGIN_WINDOW_SEC);
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    const left = LOGIN_MAX_FAILS - after.count;
    return { error: left > 0 ? `That password isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : `Too many wrong passwords. Try again in ${waitText(after.retryAfterSec)}.` };
  }
  await reset(key);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ---------- Orders ---------- */

const STATUSES = ["NEW", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;

export type StatusResult = { error?: string; ok?: string };

export async function updateOrderStatus(_prev: StatusResult, formData: FormData): Promise<StatusResult> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = z.enum(STATUSES).safeParse(formData.get("status"));
  if (!parsed.success) return { error: "Choose a status." };
  const next = parsed.data as OrderStatus;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return { error: "Order not found." };
  if (order.status === next) return {};
  if (order.status === "CANCELLED") return { error: "A cancelled order can't be reopened. Ask the customer to order again." };
  if (order.status === "AWAITING_PAYMENT" && next !== "CANCELLED") {
    return { error: "This order isn't paid yet. It moves to New by itself once Stripe confirms the payment." };
  }

  if (next === "CANCELLED") {
    let refunded = false;
    if (order.status === "AWAITING_PAYMENT") await expireSession(order.stripeSessionId);
    // Paid online: give the money back through Stripe before releasing the order
    if (order.paymentMethod === "ONLINE" && order.paymentStatus === "PAID" && order.stripePaymentId) {
      try {
        await stripe().refunds.create({ payment_intent: order.stripePaymentId }, { idempotencyKey: `cancel-${order.id}` });
        refunded = true;
      } catch (e) {
        console.error("Refund failed", e);
        return { error: "Stripe couldn't refund this payment, so the order was not cancelled. Check the payment in your Stripe Dashboard." };
      }
    }
    await cancelAndRestock(order.id);
    if (refunded) await db.order.update({ where: { id }, data: { paymentStatus: "REFUNDED" } });
    revalidatePath("/", "layout");
    return { ok: refunded ? "Cancelled and refunded. Items are back in stock." : "Cancelled. Items are back in stock." };
  }

  await db.order.update({
    where: { id },
    data: { status: next, ...(next === "DELIVERED" && order.paymentMethod === "ON_DELIVERY" ? { paymentStatus: "PAID", paidAt: new Date() } : {}) },
  });
  revalidatePath("/admin", "layout");
  return { ok: "Status updated." };
}

/** Manual paid/unpaid switch for cash, card-on-delivery and WhatsApp orders. Online payments are tracked by Stripe. */
export async function setPaymentStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = z.enum(["PAID", "UNPAID"]).parse(formData.get("paymentStatus"));
  await db.order.updateMany({ where: { id, paymentMethod: { not: "ONLINE" } }, data: { paymentStatus: status, paidAt: status === "PAID" ? new Date() : null } });
  revalidatePath("/admin", "layout");
}

/* ---------- Products ---------- */

const euros = z.string().trim().transform((v, ctx) => {
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) { ctx.addIssue({ code: "custom", message: "Enter a price like 4.99" }); return z.NEVER; }
  return Math.round(n * 100);
});

const productSchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  brand: z.string().trim().min(1, "Required").max(60),
  label: z.string().trim().max(30),
  size: z.string().trim().min(1, "Required").max(30),
  slug: z.string().trim().max(100).regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and dashes only"),
  categoryId: z.string().min(1, "Choose a category"),
  price: euros,
  was: z.string().trim().transform((v) => (v ? Math.round(Number(v.replace(",", ".")) * 100) : null))
    .refine((v) => v === null || Number.isFinite(v), "Enter a price like 5.99"),
  stock: z.coerce.number().int("Whole numbers only").min(0).max(100000),
  description: z.string().trim().max(2000),
  allergens: z.string().trim().max(500),
  origin: z.string().trim().max(60),
  imageUrl: z.string().trim().max(500).refine((v) => !v || /^https:\/\//.test(v), "Use an https:// image link"),
  packBg: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  packFg: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  packShape: z.enum(["sack", "box", "pouch", "jar"]),
  popular: z.boolean(),
  active: z.boolean(),
  netQuantity: z.string().trim().transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) { ctx.addIssue({ code: "custom", message: "Enter the net quantity as a number, e.g. 500" }); return z.NEVER; }
    return n;
  }),
  netUnit: z.enum(NET_UNITS),
  ingredients: z.string().trim().max(3000),
  nutrition: z.string().trim().max(1500),
  storage: z.string().trim().max(300),
  foodOperator: z.string().trim().max(300),
});

export type ProductFormState = { errors?: Record<string, string>; error?: string };

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const get = (k: string) => String(formData.get(k) ?? "");
  const parsed = productSchema.safeParse({
    ...Object.fromEntries(["name", "brand", "label", "size", "slug", "categoryId", "price", "was", "stock", "description", "allergens", "origin", "imageUrl", "packBg", "packFg", "packShape",
      "netQuantity", "netUnit", "ingredients", "nutrition", "storage", "foodOperator"].map((k) => [k, get(k)])),
    popular: formData.get("popular") === "on",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors };
  }
  const d = parsed.data;
  if (d.was !== null && d.was <= d.price) return { errors: { was: "The original price must be higher than the price, or leave it empty." } };

  const data = {
    name: d.name, brand: d.brand, label: d.label || d.name.split(" ").slice(0, 2).join(" "), size: d.size,
    slug: d.slug || slugify(`${d.brand} ${d.name} ${d.size}`), categoryId: d.categoryId,
    priceCents: d.price, wasCents: d.was, stock: d.stock, description: d.description, allergens: d.allergens,
    origin: d.origin || "India", imageUrl: d.imageUrl || null, packBg: d.packBg, packFg: d.packFg, packShape: d.packShape,
    popular: d.popular, active: d.active,
    netQuantity: d.netQuantity, netUnit: d.netQuantity ? d.netUnit : null,
    ingredients: d.ingredients, nutrition: d.nutrition, storage: d.storage, foodOperator: d.foodOperator,
  };
  const clash = await db.product.findFirst({ where: { slug: data.slug, NOT: id ? { id } : undefined } });
  if (clash) return { errors: { slug: "Another product already uses this web address." } };

  if (id) await db.product.update({ where: { id }, data });
  else await db.product.create({ data });
  revalidatePath("/", "layout");
  redirect("/admin/products?saved=1");
}

export async function setStock(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const stock = z.coerce.number().int().min(0).max(100000).safeParse(formData.get("stock"));
  if (!stock.success) return;
  await db.product.update({ where: { id }, data: { stock: stock.data } });
  revalidatePath("/", "layout");
}

export async function toggleActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const p = await db.product.findUniqueOrThrow({ where: { id }, select: { active: true } });
  await db.product.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/", "layout");
}

/* ---------- Delivery areas ---------- */

const areaSchema = z.object({
  name: z.string().trim().min(1).max(60),
  postcodeFrom: z.coerce.number().int().min(1000).max(99999),
  postcodeTo: z.coerce.number().int().min(1000).max(99999),
  fee: euros,
  freeOver: euros,
  minOrder: euros,
  estimatedDays: z.coerce.number().int().min(1).max(14),
  cutoffHour: z.coerce.number().int().min(0, "Cut-off must be an hour from 0 to 23.").max(23, "Cut-off must be an hour from 0 to 23."),
  excludedPostcodes: z.string().default("").transform((v) => [...new Set(v.split(/[\s,;]+/).filter(Boolean))])
    .refine((l) => l.every((pc) => /^\d{5}$/.test(pc)), "Excluded postcodes must be 5 digits each, e.g. 12529."),
}).refine((a) => a.postcodeFrom <= a.postcodeTo, { message: "The first postcode must be lower than the last.", path: ["postcodeTo"] });

export async function saveArea(_prev: { error?: string; ok?: boolean }, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = areaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const a = parsed.data;
  const data = {
    name: a.name, postcodeFrom: a.postcodeFrom, postcodeTo: a.postcodeTo, feeCents: a.fee, freeOverCents: a.freeOver,
    minOrderCents: a.minOrder, estimatedDays: a.estimatedDays, cutoffHour: a.cutoffHour, excludedPostcodes: a.excludedPostcodes, active: formData.get("active") === "on",
  };
  if (id) await db.deliveryArea.update({ where: { id }, data });
  else await db.deliveryArea.create({ data });
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------- Days off ---------- */

const closedDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  reason: z.string().trim().max(80).default(""),
});

export async function addClosedDay(_prev: { error?: string; ok?: boolean }, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  await requireAdmin();
  const parsed = closedDaySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const date = new Date(parsed.data.date + "T00:00:00Z");
  if (date < berlinToday()) return { error: "That date is in the past." };
  await db.closedDay.upsert({ where: { date }, create: { date, reason: parsed.data.reason }, update: { reason: parsed.data.reason } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeClosedDay(formData: FormData) {
  await requireAdmin();
  const v = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
  await db.closedDay.deleteMany({ where: { date: new Date(v + "T00:00:00Z") } });
  revalidatePath("/", "layout");
}
