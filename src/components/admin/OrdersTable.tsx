import Link from "next/link";
import { formatDateTime, formatDay, money, orderNo } from "@/lib/format";
import { PAYMENT_LABEL, StatusPill } from "./StatusPill";

type Row = {
  id: string; number: number; customerName: string; postcode: string; totalCents: number; status: string;
  paymentMethod: string; paymentStatus: string; createdAt: Date; deliveryDate: Date; _count: { items: number };
};

export function OrdersTable({ orders }: { orders: Row[] }) {
  if (!orders.length) return <div className="empty"><h3>No orders yet</h3><p>New orders from the shop appear here.</p></div>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Order</th><th>Placed</th><th>Customer</th><th>Postcode</th><th>Delivery</th><th className="r">Items</th><th className="r">Total</th><th>Payment</th><th>Status</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><Link className="rowlink" href={`/admin/orders/${o.id}`}>{orderNo(o.number)}</Link></td>
              <td className="muted">{formatDateTime(o.createdAt)}</td>
              <td>{o.customerName}</td>
              <td className="num">{o.postcode}</td>
              <td>{formatDay(o.deliveryDate).replace(/^(\w{3})\w*/, "$1")}</td>
              <td className="r">{o._count.items}</td>
              <td className="r">{money(o.totalCents)}</td>
              <td className="muted">{PAYMENT_LABEL[o.paymentMethod]}{o.paymentStatus === "PAID" ? " · paid" : o.paymentStatus === "REFUNDED" ? " · refunded" : ""}</td>
              <td><StatusPill status={o.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
