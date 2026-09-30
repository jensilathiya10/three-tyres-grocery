import "server-only";
import type Stripe from "stripe";
import { db } from "./db";
import { stripe } from "./stripe";

// How long an unfinished online payment keeps its stock reserved. Stripe's minimum session life is 30 minutes.
export const PAYMENT_WINDOW_MIN = 30;

/** Cancels an order and puts its items back on the shelf. Safe to call twice. */
export async function cancelAndRestock(orderId: string, onlyIfAwaitingPayment = false) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status === "CANCELLED") return false;
    if (onlyIfAwaitingPayment && order.status !== "AWAITING_PAYMENT") return false;
    // Claim the cancellation first so a concurrent call can't restock twice
    const claimed = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: "CANCELLED" } });
    if (claimed.count !== 1) return false;
    for (const it of order.items) {
      // A pack gives back its own count plus every product that was reserved inside it
      for (const productId of [it.productId, ...it.bundlePartIds]) {
        await tx.product.update({ where: { id: productId }, data: { stock: { increment: it.quantity } } });
      }
    }
    return true;
  });
}

const paymentIntentId = (s: Stripe.Checkout.Session) =>
  typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;

/** Records a completed Stripe payment. Called from the webhook and from the return page, whichever comes first. */
export async function recordPayment(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return;
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus !== "UNPAID") return;

  const pi = paymentIntentId(session);
  if (order.status === "CANCELLED") {
    // Paid after the reservation ran out and the stock was released: give the money back
    if (pi) await stripe().refunds.create({ payment_intent: pi }, { idempotencyKey: `late-${order.id}` });
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: "REFUNDED", stripePaymentId: pi } });
    console.warn(`Order ${order.id} was paid after it expired; refunded automatically.`);
    return;
  }
  await db.order.updateMany({
    where: { id: order.id, paymentStatus: "UNPAID" },
    data: { paymentStatus: "PAID", paidAt: new Date(), stripePaymentId: pi, ...(order.status === "AWAITING_PAYMENT" ? { status: "NEW" } : {}) },
  });
}

/** Look the session up at Stripe and record it. Used when the customer lands back on the order page. */
export async function syncPayment(sessionId: string) {
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    await recordPayment(session);
    return session;
  } catch (e) {
    console.error("syncPayment failed", e);
    return null;
  }
}

/** Stops an unpaid Stripe session so it can't be paid after we release the stock. */
export async function expireSession(sessionId: string | null) {
  if (!sessionId) return;
  try {
    const s = await stripe().checkout.sessions.retrieve(sessionId);
    if (s.status === "open") await stripe().checkout.sessions.expire(sessionId);
  } catch (e) {
    console.error("expireSession failed", e);
  }
}

/** Fallback for missed webhooks: release stock held by abandoned online payments. */
export async function releaseAbandonedPayments() {
  const cutoff = new Date(Date.now() - (PAYMENT_WINDOW_MIN + 5) * 60_000);
  const stale = await db.order.findMany({ where: { status: "AWAITING_PAYMENT", createdAt: { lt: cutoff } }, select: { id: true, stripeSessionId: true } });
  for (const o of stale) {
    // Check Stripe first: the customer may have paid and the webhook just hasn't arrived
    if (o.stripeSessionId) {
      const s = await syncPayment(o.stripeSessionId);
      // "complete" but unpaid means a bank payment (SEPA, Klarna) is still processing; its webhook settles it
      if (s && (s.payment_status === "paid" || s.status === "complete")) continue;
    }
    await cancelAndRestock(o.id, true);
  }
}
