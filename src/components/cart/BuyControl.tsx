"use client";

import { useState } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import type { ProductView } from "@/lib/catalog";
import { Icon } from "@/components/Icon";
import { useCart } from "./CartProvider";

export function Stepper({ p, qty, onChange, label }: { p: { name: string; stock: number }; qty: number; onChange: (n: number) => void; label?: string }) {
  return (
    <div className="stepper" role="group" aria-label={label ?? `Quantity of ${p.name}`}>
      <button type="button" onClick={() => onChange(qty - 1)} aria-label="Remove one"><Icon name="minus" /></button>
      <output className="num">{qty}</output>
      <button type="button" onClick={() => onChange(qty + 1)} aria-label="Add one" disabled={qty >= p.stock}><Icon name="plus" /></button>
    </div>
  );
}

/** "Add" button that turns into a quantity stepper once the product is in the cart. */
export function BuyControl({ p }: { p: ProductView }) {
  const cart = useCart();
  if (p.stock <= 0) return <span className="oos-note">Out of stock</span>;
  const q = cart.qty(p.id);
  if (q) return <Stepper p={p} qty={q} onChange={(n) => (n > q ? cart.add(p, n - q) : cart.setQty(p.id, n))} />;
  return (
    <button type="button" className="add" onClick={() => cart.add(p)} aria-label={`Add ${p.name} to cart`}>
      <Icon name="plus" />Add
    </button>
  );
}

/** Big add-to-cart block for the product page. */
export function AddToCartBox({ p }: { p: ProductView }) {
  const cart = useCart();
  const inCart = cart.qty(p.id);
  const left = p.stock - inCart;
  return <AddToCartInner key={left} p={p} inCart={inCart} left={left} onAdd={(n) => cart.add(p, n)} />;
}

function AddToCartInner({ p, inCart, left, onAdd }: { p: ProductView; inCart: number; left: number; onAdd: (n: number) => void }) {
  const [n, setN] = useState(1);
  const clamp = (v: number) => Math.max(1, Math.min(v, Math.max(left, 1)));
  return (
    <>
      <div className="buybox">
        <Stepper p={{ name: p.name, stock: left }} qty={n} onChange={(v) => setN(clamp(v))} label="Quantity" />
        <button type="button" className="btn btn-primary" disabled={left <= 0} onClick={() => { onAdd(n); setN(1); }}>
          <Icon name="cart" />{left <= 0 ? "All in your cart" : `Add to cart · ${money(p.priceCents * n)}`}
        </button>
      </div>
      {inCart > 0 && (
        <p className="incart">{inCart} already in your cart. <Link className="link" href="/cart">View cart</Link></p>
      )}
    </>
  );
}
