"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { PackArt } from "@/components/PackArt";
import { money } from "@/lib/format";
import { deliveryFee, type AreaRule } from "@/lib/postcode";
import { waShopLink } from "@/lib/whatsapp";
import { Stepper } from "./BuyControl";
import { useCart, type CartLine } from "./CartProvider";

export function FreeDeliveryProgress({ sub, area }: { sub: number; area: AreaRule }) {
  if (sub >= area.freeOverCents) {
    return <p className="free" style={{ color: "var(--green)", fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}><Icon name="check" />You get free delivery</p>;
  }
  return (
    <div className="free">
      Add <b className="num">{money(area.freeOverCents - sub)}</b> more for free delivery
      <div className="bar"><i style={{ width: `${Math.min(100, (sub / area.freeOverCents) * 100)}%` }} /></div>
    </div>
  );
}

export const lineProblem = (l: CartLine) =>
  l.stock <= 0 ? "Sold out. Remove it to check out." : l.qty > l.stock ? `Only ${l.stock} left.` : null;

export function cartWaText(lines: CartLine[], sub: number) {
  return `Hi! I'd like to order Indian groceries in Berlin.\n\n${lines.map((l) => `${l.qty} × ${l.brand} ${l.name} (${l.size})`).join("\n")}\n\nCart total: ${money(sub)}`;
}

export function CartView({ area }: { area: AreaRule | null }) {
  const { lines, ready, count, subtotalCents: sub, setQty, add } = useCart();

  if (!ready) return <div style={{ minHeight: 320 }} />;
  if (!lines.length) {
    return (
      <div className="empty" style={{ marginBottom: 56 }}>
        <h3>Your cart is empty</h3>
        <p>Start with the staples: rice, atta and dal. Or try the Student Starter Pack.</p>
        <Link className="btn btn-primary" href="/shop">Shop groceries</Link>
      </div>
    );
  }

  const fee = area ? deliveryFee(sub, area) : 0;
  const short = area ? area.minOrderCents - sub : 0;
  const blocked = short > 0 || lines.some((l) => lineProblem(l));

  return (
    <>
      <p className="muted" style={{ marginTop: -14, marginBottom: 18 }}>{count} item{count === 1 ? "" : "s"}</p>
      <div className="two-col">
        <div className="min0">
          <div className="lines">
            {lines.map((l) => {
              const problem = lineProblem(l);
              return (
                <div className="line" key={l.id}>
                  <Link className="thumb" href={`/product/${l.slug}`} style={{ "--pb": l.packBg } as CSSProperties} aria-label={`View ${l.name}`}><PackArt p={l} /></Link>
                  <div className="min0">
                    <span className="brand">{l.brand}</span>
                    <div className="pname">{l.name}</div>
                    <span className="size">{l.size} · {money(l.priceCents)} each</span>
                    {problem && <p className="line-warn">{problem}</p>}
                    <div><button className="remove" onClick={() => setQty(l.id, 0)}>Remove</button></div>
                  </div>
                  <div className="ctrl">
                    <Stepper p={l} qty={l.qty} onChange={(n) => (n > l.qty ? add(l, n - l.qty) : setQty(l.id, n))} />
                    <span className="lt">{money(l.priceCents * l.qty)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Link className="link" href="/shop" style={{ marginTop: 18 }}>← Continue shopping</Link>
        </div>
        <aside className="summary">
          <h2>Order summary</h2>
          <div className="row"><span>Subtotal</span><span>{money(sub)}</span></div>
          <div className="row"><span>Delivery</span><span>{fee ? money(fee) : "Free"}</span></div>
          {area && <FreeDeliveryProgress sub={sub} area={area} />}
          <div className="row total"><span>Total</span><span>{money(sub + fee)}</span></div>
          {short > 0 && <p className="warn">The minimum order is {money(area!.minOrderCents)}. Add <b className="num">{money(short)}</b> more to check out.</p>}
          <Link className="btn btn-primary btn-block" href="/checkout" aria-disabled={blocked} tabIndex={blocked ? -1 : undefined}>
            Checkout <Icon name="arrow" />
          </Link>
          <p className="or">or</p>
          <a className="btn btn-ghost btn-block" href={waShopLink(cartWaText(lines, sub))} target="_blank" rel="noopener"><Icon name="chat" />Send this cart on WhatsApp</a>
        </aside>
      </div>
    </>
  );
}
