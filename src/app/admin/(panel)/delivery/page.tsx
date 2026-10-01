import type { Metadata } from "next";
import { AreaForm } from "@/components/admin/AreaForm";
import { ClosedDayForm } from "@/components/admin/ClosedDayForm";
import { removeClosedDay } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getClosedDays } from "@/lib/catalog";
import { db } from "@/lib/db";
import { berlinToday, formatDay } from "@/lib/format";
import { berlinHoliday, isoDay } from "@/lib/holidays";

const LOOKAHEAD_DAYS = 120;

export const metadata: Metadata = { title: "Delivery" };

export default async function DeliveryPage() {
  await requireAdmin();
  const [areas, closed] = await Promise.all([db.deliveryArea.findMany({ orderBy: { postcodeFrom: "asc" } }), getClosedDays()]);

  // Upcoming public holidays and days off, in date order (Sundays are left out: they're always off)
  const today = berlinToday();
  const reasonByDay = new Map(closed.map((c) => [isoDay(c.date), c.reason]));
  const offDays: { iso: string; date: Date; label: string; removable: boolean }[] = [];
  for (let i = 0; i <= LOOKAHEAD_DAYS; i++) {
    const d = new Date(today.getTime() + i * 86_400_000);
    const iso = isoDay(d);
    const holiday = berlinHoliday(d);
    if (reasonByDay.has(iso)) offDays.push({ iso, date: d, label: reasonByDay.get(iso) || "Shop closed", removable: true });
    else if (holiday) offDays.push({ iso, date: d, label: `${holiday} (public holiday)`, removable: false });
  }
  for (const c of closed) if (c.date.getTime() > today.getTime() + LOOKAHEAD_DAYS * 86_400_000) {
    offDays.push({ iso: isoDay(c.date), date: c.date, label: c.reason || "Shop closed", removable: true });
  }
  return (
    <>
      <div className="admin-head"><h1>Delivery</h1></div>
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

        <section className="card-panel">
          <h2>Days without delivery</h2>
          <p className="muted" style={{ maxWidth: "60ch" }}>
            There&apos;s no delivery on Sundays or Berlin public holidays; these are added automatically. Add your own days off here.
            Customers who order before a day off get the next delivery day instead.
          </p>
          {offDays.length ? (
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="table">
                <tbody>
                  {offDays.map((o) => (
                    <tr key={o.iso}>
                      <td style={{ whiteSpace: "nowrap" }}><b>{formatDay(o.date)}</b> {o.date.getUTCFullYear() !== today.getUTCFullYear() && o.date.getUTCFullYear()}</td>
                      <td>{o.label}</td>
                      <td className="r">
                        {o.removable && (
                          <form action={removeClosedDay}>
                            <input type="hidden" name="date" value={o.iso} />
                            <button className="btn btn-ghost btn-sm">Remove</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 14 }}>No holidays or days off in the next {LOOKAHEAD_DAYS} days.</p>
          )}
          <ClosedDayForm min={isoDay(today)} />
        </section>
      </div>
    </>
  );
}
