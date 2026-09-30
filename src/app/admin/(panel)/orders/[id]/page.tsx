import Link from "next/link";
import { notFound } from "next/navigation";
import { setPaymentStatus } from "@/app/actions/admin";
import { StatusForm } from "@/components/admin/StatusForm";
import { StatusPill } from "@/components/admin/StatusPill";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatDay, money, orderNo } from "@/lib/format";
import { waCustomerLink } from "@/lib/whatsapp";

export default async function OrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id }, include: { items: { include: { product: { select: { slug: true, id: true } } } } } });
  if (!o) notFound();
  const no = orderNo(o.number);
  const first = o.customerName.split(" ")[0];
  const waText = `Hi ${first}, this is Three Tyres Grocery about your order ${no} (${money(o.totalCents)}).`;
  const cancelled = o.status === "CANCELLED";
  const stripeTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;

  return (
    <>
      <p className="crumbs" style={{ paddingTop: 0 }}><Link href="/admin/orders">Orders</Link><span>/</span><span>{no}</span></p>
      <div className="admin-head">
        <h1>Order {no} <StatusPill status={o.status} /></h1>
        <span className="muted">Placed {formatDateTime(o.createdAt)}</span>
      </div>
      <div className="admin-grid">
        <div style={{ display: "grid", gap: 20 }}>
          <section className="card-panel">
            <h2>Products to pack</h2>
            <table className="table">
              <thead><tr><th>Product</th><th className="r">Qty</th><th className="r">Price</th><th className="r">Line total</th></tr></thead>
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.id}>
                    <td><Link href={`/admin/products/${i.product.id}`}>{i.name}</Link> <span className="muted">{i.size}</span></td>
                    <td className="r"><b>× {i.quantity}</b></td>
                    <td className="r">{money(i.priceCents)}</td>
                    <td className="r">{money(i.priceCents * i.quantity)}</td>
                  </tr>
                ))}
                <tr><td colSpan={3} className="r muted">Subtotal</td><td className="r">{money(o.subtotalCents)}</td></tr>
                <tr><td colSpan={3} className="r muted">Delivery</td><td className="r">{o.deliveryFeeCents ? money(o.deliveryFeeCents) : "Free"}</td></tr>
                <tr><td colSpan={3} className="r"><b>Total</b></td><td className="r"><b>{money(o.totalCents)}</b></td></tr>
              </tbody>
            </table>
          </section>
          <section className="card-panel">
            <h2>Delivery</h2>
            <p><b>{formatDay(o.deliveryDate)}</b>, 16:00–21:00</p>
            <p style={{ marginTop: 8 }}>{o.street}{o.apartment && <>, {o.apartment}</>}<br />{o.postcode} {o.city}</p>
            {o.note && <p className="warn" style={{ marginTop: 12 }}>Note: {o.note}</p>}
          </section>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <section className="card-panel">
            <h2>Status</h2>
            {cancelled ? (
              <p className="muted">This order was cancelled and its items were put back in stock.</p>
            ) : (
              <StatusForm id={o.id} status={o.status} refundOnCancel={o.paymentMethod === "ONLINE" && o.paymentStatus === "PAID"} />
            )}
          </section>
          <section className="card-panel">
            <h2>Customer</h2>
            <p><b>{o.customerName}</b></p>
            <p className="num" style={{ userSelect: "all" }}>{o.phone}</p>
            <p style={{ userSelect: "all" }}>{o.email}</p>
            <a className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} href={waCustomerLink(o.phone, waText)} target="_blank" rel="noopener"><Icon name="chat" />Message on WhatsApp</a>
          </section>
          <section className="card-panel">
            <h2>Payment</h2>
            {o.paymentMethod === "ONLINE" ? (
              <>
                <p>Paid online through Stripe</p>
                <p style={{ marginTop: 8 }}>
                  <span className={`pill ${o.paymentStatus === "PAID" ? "pill-DELIVERED" : o.paymentStatus === "REFUNDED" ? "pill-REFUNDED" : "pill-NEW"}`}>
                    {o.paymentStatus === "PAID" ? "Paid" : o.paymentStatus === "REFUNDED" ? "Refunded" : "Not paid yet"}
                  </span>
                  {o.paidAt && <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>{formatDateTime(o.paidAt)}</span>}
                </p>
                {o.stripePaymentId && (
                  <a className="link" style={{ marginTop: 10 }} href={`https://dashboard.stripe.com/${stripeTestMode ? "test/" : ""}payments/${o.stripePaymentId}`} target="_blank" rel="noopener">
                    Open in Stripe <Icon name="arrow" />
                  </a>
                )}
              </>
            ) : (
              <>
                <p>{o.paymentMethod === "WHATSAPP" ? "Arranged on WhatsApp" : "Pay on delivery (card or cash)"}</p>
                <form action={setPaymentStatus} className="inline-form" style={{ marginTop: 10 }}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="paymentStatus" value={o.paymentStatus === "PAID" ? "UNPAID" : "PAID"} />
                  <span className={`pill ${o.paymentStatus === "PAID" ? "pill-DELIVERED" : "pill-NEW"}`}>{o.paymentStatus === "PAID" ? "Paid" : "Unpaid"}</span>
                  <button className="link">{o.paymentStatus === "PAID" ? "Mark unpaid" : "Mark paid"}</button>
                </form>
              </>
            )}
          </section>
          <Link className="link" href={`/order/${o.id}`} target="_blank">Customer&apos;s receipt page <Icon name="arrow" /></Link>
        </div>
      </div>
    </>
  );
}
