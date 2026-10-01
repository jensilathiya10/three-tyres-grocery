import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { getCategories } from "@/lib/catalog";
import { waShopLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** Shown for unknown addresses, removed products and unknown order links, inside the shop's header and footer. */
export default async function NotFound() {
  const categories = (await getCategories().catch(() => [])).filter((c) => c._count.products > 0);
  return (
    <div className="wrap not-found">
      <p className="eyebrow">Error 404</p>
      <h1 className="page-h">We couldn&apos;t find that page</h1>
      <p className="muted">
        The link may be old, or the product may no longer be in our shop. Search for what you need, or pick a category below.
      </p>

      <form action="/shop" className="searchbox nf-search" role="search">
        <Icon name="search" />
        <input type="search" name="q" placeholder="Search rice, dal, masala…" aria-label="Search products" />
      </form>

      {categories.length > 0 && (
        <nav className="nf-cats" aria-label="Categories">
          {categories.map((c) => <Link key={c.slug} href={`/shop?cat=${c.slug}`}>{c.name}</Link>)}
        </nav>
      )}

      <div className="nf-actions">
        <Link className="btn btn-primary" href="/shop"><Icon name="cart" />Browse the shop</Link>
        <Link className="btn btn-ghost" href="/">Go to the homepage</Link>
      </div>
      <p className="muted nf-help">
        Looking for something we don&apos;t list? <a className="link" href={waShopLink("Hi! I couldn't find a product on your website. Do you have …?")} target="_blank" rel="noopener">Ask us on WhatsApp</a>
      </p>
    </div>
  );
}
