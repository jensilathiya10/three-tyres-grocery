import Link from "next/link";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { releaseStaleOrders } from "@/lib/orders";
import { db } from "@/lib/db";
import { money } from "@/lib/format";

const LOW_STOCK = 5;

function startOfBerlinDay() {
  const now = new Date();
  const berlin = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const offsetMs = berlin.getTime() - now.getTime();
  berlin.setHours(0, 0, 0, 0);
  return new Date(berlin.getTime() - offsetMs);
}

export default async function Dashboard() {
  await requireAdmin();
  // Cancel orders nobody confirmed, so the numbers below are current
  await releaseStaleOrders().catch((e) => console.error("releaseStaleOrders", e));
  const since = startOfBerlinDay();
  const [today, open, activeProducts, lowStock, recent] = await Promise.all([
    db.order.aggregate({ where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "AWAITING_PAYMENT"] } }, _count: true, _sum: { totalCents: true } }),
    db.order.count({ where: { status: { in: ["NEW", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] } } }),
    db.product.count({ where: { active: true } }),
    db.product.findMany({ where: { active: true, stock: { lte: LOW_STOCK } }, orderBy: { stock: "asc" }, select: { id: true, name: true, size: true, stock: true } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { _count: { select: { items: true } } } }),
  ]);

  return (
    <>
      <div className="admin-head"><h1>Dashboard</h1></div>
      <div className="tiles">
        <div className="tile"><span>Today&apos;s orders</span><b>{today._count}</b></div>
        <div className="tile"><span>Today&apos;s revenue</span><b>{money(today._sum.totalCents ?? 0)}</b></div>
        <div className="tile"><span>Open orders</span><b>{open}</b></div>
        <div className={`tile${lowStock.length ? " alerting" : ""}`}><span>Low or out of stock</span><b>{lowStock.length}</b></div>
      </div>
      <div className="admin-grid">
        <section>
          <div className="admin-head" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 18 }}>Recent orders</h2>
            <Link className="link" href="/admin/orders">All orders <Icon name="arrow" /></Link>
          </div>
          <OrdersTable orders={recent} />
        </section>
        <section className="card-panel">
          <h2>Restock soon</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 10 }}>{activeProducts} products on sale. These have {LOW_STOCK} or fewer left.</p>
          {lowStock.length ? (
            <table className="table">
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/admin/products/${p.id}`}>{p.name} <span className="muted">{p.size}</span></Link></td>
                    <td className="r">{p.stock === 0 ? <span className="pill pill-low">Out</span> : <b className="num">{p.stock}</b>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>Everything is well stocked.</p>}
        </section>
      </div>
    </>
  );
}
