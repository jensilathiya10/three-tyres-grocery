import Link from "next/link";
import type { Metadata } from "next";
import { setStock, toggleActive } from "@/app/actions/admin";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const low = sp.low === "1";
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { brand: { contains: q, mode: "insensitive" } }] } : {}),
        ...(cat ? { category: { slug: cat } } : {}),
        ...(low ? { stock: { lte: 5 } } : {}),
      },
      include: { category: { select: { name: true } } },
      orderBy: [{ category: { sort: "asc" } }, { name: "asc" }],
    }),
    db.category.findMany({ orderBy: { sort: "asc" } }),
  ]);

  return (
    <>
      <div className="admin-head">
        <h1>Products</h1>
        <Link className="btn btn-primary btn-sm" href="/admin/products/new"><Icon name="plus" />Add product</Link>
      </div>
      {sp.saved === "1" && <p className="flash">Product saved.</p>}
      <form className="inline-form" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <input className="input" style={{ width: 220 }} name="q" defaultValue={q} placeholder="Search name or brand" aria-label="Search products" />
        <select className="select" name="cat" defaultValue={cat} aria-label="Category" style={{ padding: "6px 10px" }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <label className="check"><input type="checkbox" name="low" value="1" defaultChecked={low} />Low stock only</label>
        <button className="btn btn-ghost btn-sm">Filter</button>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Product</th><th>Category</th><th className="r">Price</th><th>Stock</th><th>On sale</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={p.active ? undefined : { opacity: 0.55 }}>
                <td>
                  <Link className="rowlink" href={`/admin/products/${p.id}`}>{p.name}</Link>
                  <div className="muted" style={{ fontSize: 13 }}>{p.brand} · {p.size}{p.popular ? " · Popular" : ""}</div>
                </td>
                <td className="muted">{p.category.name}</td>
                <td className="r">
                  {money(p.priceCents)}
                  {p.wasCents && <div className="muted" style={{ fontSize: 12, textDecoration: "line-through" }}>{money(p.wasCents)}</div>}
                </td>
                <td>
                  <form action={setStock} className="inline-form">
                    <input type="hidden" name="id" value={p.id} />
                    <input className="input num" name="stock" type="number" min={0} defaultValue={p.stock} aria-label={`Stock for ${p.name}`} key={p.stock} />
                    <button className="btn btn-ghost btn-sm">Save</button>
                    {p.stock === 0 ? <span className="pill pill-low">Out</span> : p.stock <= 5 ? <span className="pill pill-NEW">Low</span> : null}
                  </form>
                </td>
                <td>
                  <form action={toggleActive}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="link" style={p.active ? undefined : { color: "var(--muted)" }}>{p.active ? "On sale · hide" : "Hidden · show"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!products.length && <p className="muted" style={{ marginTop: 16 }}>No products match.</p>}
    </>
  );
}
