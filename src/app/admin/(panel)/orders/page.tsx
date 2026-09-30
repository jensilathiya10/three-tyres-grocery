import Link from "next/link";
import type { Metadata } from "next";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { STATUS_LABEL, STATUS_TABS } from "@/components/admin/StatusPill";
import { requireAdmin } from "@/lib/auth";
import { releaseStaleOrders } from "@/lib/orders";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  // Cancel orders nobody confirmed, so the numbers below are current
  await releaseStaleOrders().catch((e) => console.error("releaseStaleOrders", e));
  const sp = await searchParams;
  const status = STATUS_TABS.find((s) => s === sp.status) as OrderStatus | undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const num = Number(q.replace(/^(TTG|IGB)-/i, "")) - 1000;

  const [orders, counts] = await Promise.all([
    db.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q ? { OR: [{ customerName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, ...(Number.isInteger(num) && num > 0 ? [{ number: num }] : [])] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { _count: { select: { items: true } } },
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <div className="admin-head">
        <h1>Orders</h1>
        <form className="inline-form">
          {status && <input type="hidden" name="status" value={status} />}
          <input className="input" style={{ width: 240 }} name="q" defaultValue={q} placeholder="Name, phone or TTG-1001" aria-label="Search orders" />
          <button className="btn btn-ghost btn-sm">Search</button>
        </form>
      </div>
      <div className="tabs">
        <Link href="/admin/orders" aria-current={!status ? "page" : undefined}>All</Link>
        {STATUS_TABS.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} aria-current={status === s ? "page" : undefined}>{STATUS_LABEL[s]} · {countOf(s)}</Link>
        ))}
      </div>
      <OrdersTable orders={orders} />
    </>
  );
}
