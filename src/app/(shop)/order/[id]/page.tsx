import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { ClearCart } from "@/components/cart/ClearCart";
import { AutoRefresh } from "@/components/shop/AutoRefresh";
import { db } from "@/lib/db";
import { syncPayment } from "@/lib/orders";
import { formatDay, money, orderNo } from "@/lib/format";
import { waShopLink } from "@/lib/whatsapp";
import { siteBase } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const STATUS_TEXT: Record<string, string> = {
  AWAITING_PAYMENT: "Waiting for payment",
  NEW: "Received", CONFIRMED: "Confirmed", PREPARING: "Being packed", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

// The order id in the URL is an unguessable cuid, so this page works as a private receipt link
export default async function OrderPage({ params, searchParams }: PageProps<"/order/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const returnedFromPayment = sp.paid === "1";
  const isNew = sp.new === "1" || returnedFromPayment;
  let o = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!o) notFound();
  // Back from Stripe: confirm the payment now instead of waiting for the webhook
  if (o.status === "AWAITING_PAYMENT" && o.stripeSessionId && typeof sp.session_id === "string" && sp.session_id === o.stripeSessionId) {
    await syncPayment(o.stripeSessionId);
    o = (await db.order.findUnique({ where: { id }, include: { items: true } }))!;
  }
  const paidOnline = o.paymentMethod === "ONLINE" && o.paymentStatus === "PAID";
  const processing = o.paymentMethod === "ONLINE" && o.status === "AWAITING_PAYMENT";

  const no = orderNo(o.number);
  const address = `${o.street}${o.apartment ? ", " + o.apartment : ""}, ${o.postcode} ${o.city}`;
  const payByWhatsApp = o.paymentMethod === "WHATSAPP";
  // Free alternative to sending WhatsApp messages ourselves: the customer sends their order to the shop,
  // which leaves a copy in their own WhatsApp
  const wa = [
    `Hi! I just placed order ${no} with Three Tyres Grocery.`,
    "",
    ...o.items.map((i) => `${i.quantity} × ${i.name} (${i.size})`),
    "",
    `Total: ${money(o.totalCents)} · ${payByWhatsApp ? "payment via WhatsApp" : "pay on delivery"}`,
    `Delivery: ${formatDay(o.deliveryDate)}, 16:00–21:00`,
    `Name: ${o.customerName}`,
    `Address: ${address}`,
    `Phone: ${o.phone}`,
    `Order: ${await siteBase()}/order/${o.id}`,
    ...(payByWhatsApp ? ["", "How would you like me to pay?"] : []),
  ].join("\n");
  const showWa = ["NEW", "CONFIRMED", "PREPARING"].includes(o.status);

  return (
    <div className="wrap">
      {isNew && o.status !== "CANCELLED" && <ClearCart />}
      {processing && <AutoRefresh />}
      <div className="confirm">
        <div className="top">
          <span className="tick"><Icon name={o.status === "CANCELLED" ? "x" : "check"} /></span>
          <h1>{processing ? "Payment processing" : isNew && o.status !== "CANCELLED" ? "Order confirmed" : `Order ${STATUS_TEXT[o.status].toLowerCase()}`}</h1>
          <p className="muted">
            {processing
              ? "Your bank is confirming the payment. This page updates once it goes through, usually within minutes."
              : `Thank you, ${o.customerName.split(" ")[0]}. ${paidOnline ? "Your payment went through. " : ""}Keep this page to check your order.`}
          </p>
        </div>
        {showWa && (
          <div className="wa-copy">
            <a className="btn btn-primary btn-block" href={waShopLink(wa)} target="_blank" rel="noopener">
              <Icon name="chat" />{payByWhatsApp ? "Arrange payment on WhatsApp" : "Get my order on WhatsApp"}
            </a>
            <p className="muted">
              {payByWhatsApp
                ? "Opens WhatsApp with your order written out. Press send and we'll sort out payment with you there."
                : "Opens WhatsApp with your order written out. Press send to keep a copy in your chat with us."}
            </p>
          </div>
        )}
        <div className="receipt">
          <div className="row">
            <span className="ono">ORDER {no}</span>
            <span className="pill" style={{ fontSize: 12 }}>{STATUS_TEXT[o.status]}</span>
          </div>
          <hr />
          {o.items.map((i) => (
            <div className="row" key={i.id}>
              <span>{i.quantity} × {i.name} <span className="muted">{i.size}</span></span>
              <span>{money(i.priceCents * i.quantity)}</span>
            </div>
          ))}
          <hr />
          <div className="row"><span>Subtotal</span><span>{money(o.subtotalCents)}</span></div>
          <div className="row"><span>Delivery</span><span>{o.deliveryFeeCents ? money(o.deliveryFeeCents) : "Free"}</span></div>
          <div className="row total"><span>Total</span><span>{money(o.totalCents)}</span></div>
          <p className="muted" style={{ fontSize: 14 }}>
            {o.paymentStatus === "REFUNDED" ? "Refunded to your original payment method."
              : paidOnline ? "Paid online."
              : processing ? "Payment in progress."
              : o.paymentMethod === "ON_DELIVERY" ? "Pay the driver by card or cash."
              : "Pay as arranged with us on WhatsApp."}
          </p>
        </div>
        <div className="facts">
          <div><Icon name="truck" />Expected delivery<b>{formatDay(o.deliveryDate)}, 16:00–21:00</b></div>
          <div><Icon name="pin" />Delivering to<b>{address}</b></div>
        </div>
        <p className="muted" style={{ marginTop: 18, textAlign: "center" }}>We&apos;ll call {o.phone} if we need anything about your order.</p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
          <Link className="btn btn-ghost" href="/shop">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
