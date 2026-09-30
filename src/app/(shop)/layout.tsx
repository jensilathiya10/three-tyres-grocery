import Link from "next/link";
import { Suspense } from "react";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header, Logo } from "@/components/shop/Chrome";
import { getCategories, getMainArea } from "@/lib/catalog";
import { money } from "@/lib/format";
import { waShopLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, { main }] = await Promise.all([getCategories(), getMainArea()]);
  const navCats = categories.filter((c) => c._count.products > 0).map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <CartProvider>
      <div className="shop-body">
        {main && (
          <div className="strip">
            Next-day delivery across {main.name} · <b>Free delivery over {money(main.freeOverCents)}</b>
          </div>
        )}
        <Suspense fallback={<div className="site-header" style={{ height: 67 }} />}>
          <Header categories={navCats} />
        </Suspense>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <div className="fgrid">
              <div>
                <div className="logo"><Logo /></div>
                <span className="logo-sub">Indian &amp; South Asian Groceries · Berlin</span>
                <p>Rice, atta, dal, spices, snacks and sweets, delivered to your door across Berlin.</p>
              </div>
              <div>
                <h4>Shop</h4>
                <ul>
                  {navCats.slice(0, 6).map((c) => <li key={c.slug}><Link href={`/shop?cat=${c.slug}`}>{c.name}</Link></li>)}
                  <li><Link href="/shop">All products</Link></li>
                </ul>
              </div>
              <div>
                <h4>Help</h4>
                <ul>
                  <li><Link href="/info">How it works</Link></li>
                  <li><Link href="/info#delivery">Delivery information</Link></li>
                  <li><Link href="/info#contact">Contact</Link></li>
                  <li><Link href="/shop?deals=1">Deals</Link></li>
                </ul>
              </div>
              <div>
                <h4>Order by chat</h4>
                <ul><li><a className="link" href={waShopLink()} target="_blank" rel="noopener">Order on WhatsApp</a></li></ul>
                <p>Send us your list and we&apos;ll put the order together for you.</p>
              </div>
            </div>
            <div className="legal">
              <span>© {new Date().getFullYear()} Three Tyres Grocery, Berlin</span>
              <span>Impressum · Datenschutz · AGB (add before launch)</span>
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
