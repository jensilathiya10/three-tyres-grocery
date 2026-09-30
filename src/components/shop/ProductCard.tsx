import Link from "next/link";
import type { CSSProperties } from "react";
import type { ProductView } from "@/lib/catalog";
import { money, savePct } from "@/lib/format";
import { PackArt } from "@/components/PackArt";
import { BuyControl } from "@/components/cart/BuyControl";

export function StockTag({ p }: { p: ProductView }) {
  if (p.stock <= 0) return <span className="tag tag-oos">Out of stock</span>;
  if (p.wasCents) return <span className="tag tag-deal">Save {savePct(p.priceCents, p.wasCents)}%</span>;
  if (p.stock <= 5) return <span className="tag tag-low">Only {p.stock} left</span>;
  return null;
}

export function ProductCard({ p }: { p: ProductView }) {
  const href = `/product/${p.slug}`;
  return (
    <article className="card" style={{ "--pb": p.packBg } as CSSProperties}>
      <Link className="media" href={href} aria-label={`View ${p.name}`}>
        <StockTag p={p} />
        <PackArt p={p} />
      </Link>
      <div className="body">
        <span className="brand">{p.brand}</span>
        <Link className="pname" href={href}>{p.name}</Link>
        <span className="size">{p.size}</span>
        <div className="buy">
          <div className="price">
            {money(p.priceCents)}
            {p.wasCents && <span className="was">{money(p.wasCents)}</span>}
          </div>
          <BuyControl p={p} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductView[] }) {
  return <div className="grid">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}
