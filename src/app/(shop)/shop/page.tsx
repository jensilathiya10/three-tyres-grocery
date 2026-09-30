import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { ProductGrid } from "@/components/shop/ProductCard";
import { ShopTools } from "@/components/shop/ShopTools";
import { getCategories, getProducts, type SortKey } from "@/lib/catalog";
import { waShopLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop" };

const SORTS: SortKey[] = ["popular", "low", "high", "new"];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const cat = one(sp.cat);
  const q = one(sp.q).slice(0, 80);
  const deals = one(sp.deals) === "1";
  const sortRaw = one(sp.sort) as SortKey;
  const sort = SORTS.includes(sortRaw) ? sortRaw : "popular";

  const categories = await getCategories();
  const category = categories.find((c) => c.slug === cat);
  const products = await getProducts({ cat: category?.slug, q, sort, deals });
  const dealCount = (await getProducts({ deals: true })).length;
  const total = categories.reduce((s, c) => s + c._count.products, 0);

  const title = deals ? "This week's deals" : category ? category.name : "All products";
  // Keep search and sort when switching category
  const href = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(sort !== "popular" ? { sort } : {}), ...extra });
    const s = p.toString();
    return s ? `/shop?${s}` : "/shop";
  };
  const entries = [
    { key: "all", label: "All products", short: "All", n: total, href: href({}), on: !deals && !category },
    { key: "deals", label: "Deals", short: "Deals", n: dealCount, href: href({ deals: "1" }), on: deals },
    ...categories.filter((c) => c._count.products > 0).map((c) => ({
      key: c.slug, label: c.name, short: c.short, n: c._count.products, href: href({ cat: c.slug }), on: !deals && category?.slug === c.slug,
    })),
  ];

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        {deals || category ? <><Link href="/shop">Shop</Link><span aria-hidden="true">/</span><span>{title}</span></> : <span>Shop</span>}
      </nav>
      <h1 className="page-h">{title}</h1>
      <div className="shop-layout">
        <aside className="filters" aria-label="Categories">
          <h3>Categories</h3>
          {entries.map((e) => (
            <Link key={e.key} href={e.href} aria-current={e.on ? "page" : undefined}>{e.label}<span>{e.n}</span></Link>
          ))}
        </aside>
        <div className="min0">
          <ShopTools />
          <div className="chips" aria-label="Categories">
            {entries.map((e) => <Link key={e.key} href={e.href} aria-current={e.on ? "page" : undefined}>{e.short}</Link>)}
          </div>
          {category?.blurb && !deals && <p className="count" style={{ color: "var(--fg)" }}>{category.blurb}</p>}
          <p className="count">
            {products.length} product{products.length === 1 ? "" : "s"}{q ? ` for “${q}”` : ""} · Prices incl. VAT, plus <Link className="link" href="/info#delivery" style={{ fontWeight: 600 }}>delivery</Link>
          </p>
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <div className="empty">
              <h3>{q ? `No products match “${q}”` : "Nothing here yet"}</h3>
              <p>Try a different word, like “rice” or “masala”. Can&apos;t find a product you need? Send us a message and we&apos;ll try to stock it.</p>
              <a className="btn btn-primary" href={waShopLink(q ? `Hi! Do you have ${q}? I'd like to order it in Berlin.` : undefined)} target="_blank" rel="noopener">
                <Icon name="chat" />Ask on WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
