import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { cancelAndRestock, expireSession } from "@/lib/orders";

// Stripe sends customers here when they press "back" on the payment page.
// The order id is an unguessable cuid, so only the customer who started the payment has this link.
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order") ?? "";
  const order = orderId ? await db.order.findUnique({ where: { id: orderId }, select: { status: true, stripeSessionId: true } }) : null;
  if (order?.status === "AWAITING_PAYMENT") {
    // Close the Stripe session before releasing stock, so it can't be paid afterwards
    await expireSession(order.stripeSessionId);
    await cancelAndRestock(orderId, true);
  }
  return NextResponse.redirect(new URL("/cart?payment=cancelled", request.url), 303);
}
