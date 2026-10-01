import Link from "next/link";
import type { Metadata } from "next";
import { AdminOrderForm } from "@/components/admin/AdminOrderForm";
import { requireAdmin } from "@/lib/auth";
import { getDeliveryAreas, getProducts } from "@/lib/catalog";
import { deliveryDate } from "@/lib/format";

export const metadata: Metadata = { title: "New order" };

export default async function NewOrderPage() {
  await requireAdmin();
  const [products, areas] = await Promise.all([getProducts({ sort: "popular" }), getDeliveryAreas()]);
  const pickable = products.map(({ id, name, brand, size, priceCents, stock }) => ({ id, name, brand, size, priceCents, stock }));
  const defaultDate = deliveryDate(areas[0] ?? undefined).toISOString().slice(0, 10);
  return (
    <>
      <p className="crumbs" style={{ paddingTop: 0 }}><Link href="/admin/orders">Orders</Link><span>/</span><span>New order</span></p>
      <div className="admin-head"><h1>New order</h1><span className="muted">For orders taken on WhatsApp or by phone</span></div>
      <AdminOrderForm products={pickable} areas={areas} defaultDate={defaultDate} />
    </>
  );
}
