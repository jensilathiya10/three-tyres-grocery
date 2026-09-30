"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/lib/format";
import { waShopLink } from "@/lib/whatsapp";

type NavCategory = { slug: string; name: string };

export function Logo() {
  return (
    <>
      <span className="logo-mark"><Icon name="tyres" /></span>
      <span className="logo-text"><b>Three Tyres</b><small>Grocery</small></span>
    </>
  );
}

function CountBadge() {
  const { count, ready } = useCart();
  if (!ready || !count) return null;
  return <span className="badge-count">{count}</span>;
}

export function Header({ categories }: { categories: NavCategory[] }) {
  const path = usePathname();
  const params = useSearchParams();
  const { subtotalCents, count, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDeals = path === "/shop" && params.get("deals") === "1";

  // Close the menu whenever the page changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to navigation
    setMenuOpen(false);
  }, [path, params]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const current = (on: boolean) => (on ? ("page" as const) : undefined);

  return (
    <>
      <header className="site-header">
        <div className="wrap hbar">
          <button className="iconbtn only-mobile" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <Link className="logo" href="/" aria-label="Three Tyres Grocery home"><Logo /></Link>
          <nav className="mainnav" aria-label="Main">
            <Link href="/shop" aria-current={current(path.startsWith("/shop") && !isDeals)}>Shop</Link>
            <Link href="/#categories">Categories</Link>
            <Link href="/shop?deals=1" aria-current={current(isDeals)}>Deals</Link>

          </nav>
          <form className="hsearch" action="/shop" role="search">
            <Icon name="search" />
            <input name="q" type="search" placeholder="Search rice, dal, masala…" aria-label="Search products" defaultValue={path === "/shop" ? params.get("q") ?? "" : ""} key={path} />
          </form>
          <div className="hicons">
            <Link className="iconbtn only-mobile" href="/shop?focus=1" aria-label="Search"><Icon name="search" /></Link>
            <Link className="iconbtn only-mobile" href="/cart" aria-label="Cart"><Icon name="cart" /><CountBadge /></Link>
            <Link className="cartbtn" href="/cart">
              <Icon name="cart" />
              <span className="num">{ready && count ? money(subtotalCents) : "Cart"}</span>
              <CountBadge />
            </Link>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="sheet" onClick={(e) => e.target === e.currentTarget && setMenuOpen(false)}>
          <div className="sheet-panel" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="head">
              <span className="logo-text"><b>Three Tyres</b><small>Grocery</small></span>
              <button className="iconbtn" onClick={() => setMenuOpen(false)} aria-label="Close menu" autoFocus><Icon name="x" /></button>
            </div>
            <Link className="item" href="/">Home</Link>
            <Link className="item" href="/shop">All products</Link>
            <Link className="item" href="/shop?deals=1">Deals</Link>
            <h4>Categories</h4>
            {categories.map((c) => <Link key={c.slug} className="item" href={`/shop?cat=${c.slug}`}>{c.name}</Link>)}
            <h4>Help</h4>
            <Link className="item" href="/info">How it works</Link>
            <Link className="item" href="/info#delivery">Delivery information</Link>
            <Link className="item" href="/info#contact">Contact</Link>
          </div>
        </div>
      )}

      <nav className="tabbar" aria-label="Quick">
        <Link href="/" aria-current={current(path === "/")}><Icon name="home" />Home</Link>
        <Link href="/shop?focus=1" aria-current={current(path === "/shop")}><Icon name="search" />Search</Link>
        <Link href="/cart" aria-current={current(path === "/cart")}><Icon name="cart" />Cart<CountBadge /></Link>
        <a href={waShopLink()} target="_blank" rel="noopener"><Icon name="chat" />WhatsApp</a>
        <button onClick={() => setMenuOpen(true)}><Icon name="menu" />Menu</button>
      </nav>

      <a className="fab" href={waShopLink()} target="_blank" rel="noopener"><Icon name="chat" />WhatsApp</a>
      <Toast />
    </>
  );
}

function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <span>{toast}</span>
      <Link href="/cart">View cart</Link>
    </div>
  );
}
