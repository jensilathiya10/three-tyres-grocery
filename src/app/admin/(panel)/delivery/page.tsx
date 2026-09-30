import type { Metadata } from "next";
import { AreaForm } from "@/components/admin/AreaForm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Delivery areas" };

export default async function DeliveryPage() {
  await requireAdmin();
  const areas = await db.deliveryArea.findMany({ orderBy: { postcodeFrom: "asc" } });
  return (
    <>
      <div className="admin-head"><h1>Delivery areas</h1></div>
      <p className="muted" style={{ marginBottom: 20, maxWidth: "60ch" }}>
        Customers can only check out with a postcode inside an active area. The first area&apos;s fee and free-delivery threshold appear in the shop banner.
      </p>
      <div style={{ display: "grid", gap: 16, maxWidth: 820 }}>
        {areas.map((a) => (
          <AreaForm key={a.id} area={{
            id: a.id, name: a.name, postcodeFrom: String(a.postcodeFrom), postcodeTo: String(a.postcodeTo),
            fee: (a.feeCents / 100).toFixed(2), freeOver: (a.freeOverCents / 100).toFixed(2), minOrder: (a.minOrderCents / 100).toFixed(2),
            estimatedDays: String(a.estimatedDays), cutoffHour: String(a.cutoffHour), excludedPostcodes: a.excludedPostcodes.join(", "), active: a.active,
          }} />
        ))}
        <AreaForm area={null} />
      </div>
    </>
  );
}
