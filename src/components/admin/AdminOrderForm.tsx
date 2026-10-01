"use client";

import { useActionState, useMemo, useState } from "react";
import { createAdminOrder, type AdminOrderState } from "@/app/actions/admin-orders";
import { Stepper } from "@/components/cart/BuyControl";
import { Icon } from "@/components/Icon";
import { money, noDeliveryReason } from "@/lib/format";
import { deliveryFee, findArea, type AreaRule } from "@/lib/postcode";

export type PickableProduct = { id: string; name: string; brand: string; size: string; priceCents: number; stock: number };

export function AdminOrderForm({ products, areas, defaultDate }: { products: PickableProduct[]; areas: AreaRule[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<AdminOrderState, FormData>(createAdminOrder, {});
  const [lines, setLines] = useState<{ id: string; qty: number }[]>([]);
  const [search, setSearch] = useState("");
  const [postcode, setPostcode] = useState("");
  const [date, setDate] = useState(defaultDate);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const q = search.trim().toLowerCase();
  const matches = q
    ? products.filter((p) => `${p.brand} ${p.name} ${p.size}`.toLowerCase().includes(q) && !lines.some((l) => l.id === p.id)).slice(0, 8)
    : [];

  const addProduct = (id: string) => {
    setLines((cur) => (cur.some((l) => l.id === id) ? cur : [...cur, { id, qty: 1 }]));
    setSearch("");
  };
  const setQty = (id: string, qty: number) => setLines((cur) => cur.flatMap((l) => (l.id !== id ? [l] : qty <= 0 ? [] : [{ ...l, qty }])));

  const sub = lines.reduce((s, l) => s + (byId.get(l.id)?.priceCents ?? 0) * l.qty, 0);
  const pc = postcode.length === 5 ? findArea(postcode, areas) : null;
  const area = pc?.ok ? pc.area : null;
  const fee = area ? deliveryFee(sub, area) : 0;
  const fe = state.fieldErrors ?? {};
  const dayOff = /^\d{4}-\d{2}-\d{2}$/.test(date) ? noDeliveryReason(new Date(date + "T00:00:00Z"), areas[0]?.closedDays) : null;

  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field">
      <label htmlFor={`ao-${name}`}>{label}</label>
      <input className="input" id={`ao-${name}`} name={name} aria-invalid={fe[name] ? true : undefined} {...props} />
      {fe[name] && <p className="err">{fe[name]}</p>}
    </div>
  );

  return (
    <form action={action} className="admin-grid">
      <input type="hidden" name="items" value={JSON.stringify(lines)} />
      <div style={{ display: "grid", gap: 20 }}>
        {state.error && <p className="alert" role="alert">{state.error}</p>}

        <section className="card-panel">
          <h2>Products</h2>
          <div className="searchbox" style={{ marginBottom: 10 }}>
            <Icon name="search" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products to add…" aria-label="Search products"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (matches[0]) addProduct(matches[0].id); } }} />
          </div>
          {matches.length > 0 && (
            <div className="table-wrap" style={{ marginBottom: 12 }}>
              <table className="table">
                <tbody>
                  {matches.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name} <span className="muted">{p.brand} · {p.size}</span></td>
                      <td className="r">{money(p.priceCents)}</td>
                      <td className="r muted">{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</td>
                      <td className="r"><button type="button" className="btn btn-ghost btn-sm" disabled={p.stock <= 0} onClick={() => addProduct(p.id)}>Add</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {lines.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Product</th><th>Quantity</th><th className="r">Price</th><th className="r">Line total</th></tr></thead>
                <tbody>
                  {lines.map((l) => {
                    const p = byId.get(l.id)!;
                    return (
                      <tr key={l.id}>
                        <td>{p.name} <span className="muted">{p.size}</span>{l.qty > p.stock && <div className="err">Only {p.stock} in stock</div>}</td>
                        <td><Stepper p={p} qty={l.qty} onChange={(n) => setQty(l.id, n)} /></td>
                        <td className="r">{money(p.priceCents)}</td>
                        <td className="r">{money(p.priceCents * l.qty)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Search above and add the products the customer asked for.</p>
          )}
          {fe.items && <p className="err" style={{ marginTop: 8 }}>{fe.items}</p>}
        </section>

        <section className="card-panel">
          <h2>Customer</h2>
          <div className="fields">
            {field("name", "Name", { autoComplete: "off" })}
            {field("phone", "Phone / WhatsApp number", { type: "tel" })}
            {field("email", "Email (optional)", { type: "email" })}
            {field("street", "Street and house number")}
            {field("apartment", "Apartment, floor, doorbell (optional)")}
            <div className="field">
              <label htmlFor="ao-postcode">Postcode</label>
              <input className="input" id="ao-postcode" name="postcode" inputMode="numeric" maxLength={5} value={postcode} onChange={(e) => setPostcode(e.target.value)} aria-invalid={fe.postcode ? true : undefined} />
              {fe.postcode && !pc ? <p className="err">{fe.postcode}</p> : pc && <p className={`hint ${pc.ok ? "ok" : "bad"}`}>{pc.ok ? `${pc.area.name} delivery area` : pc.message}</p>}
            </div>
            <div className="field span2">
              <label htmlFor="ao-note">Note for the driver (optional)</label>
              <textarea className="input" id="ao-note" name="note" rows={2} />
            </div>
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <section className="card-panel" style={{ display: "grid", gap: 12 }}>
          <h2>Delivery and payment</h2>
          {field("deliveryDate", "Delivery date", { type: "date", defaultValue: defaultDate, min: new Date().toISOString().slice(0, 10), onChange: (e) => setDate(e.target.value) })}
          {dayOff && <p className="warn">That day is a day without delivery ({dayOff}). You can still save it if you&apos;ve agreed it with the customer.</p>}
          <div className="pay">
            <label style={{ padding: "8px 12px" }}><input type="radio" name="payment" value="ON_DELIVERY" defaultChecked /><b>Pay on delivery</b><small>Card or cash to the driver</small></label>
            <label style={{ padding: "8px 12px" }}><input type="radio" name="payment" value="WHATSAPP" /><b>Arranged on WhatsApp</b><small>E.g. bank transfer agreed in chat</small></label>
          </div>
          <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}><span>Subtotal</span><span>{money(sub)}</span></div>
          <div className="row"><span>Delivery</span><span>{area ? (fee ? money(fee) : "Free") : "—"}</span></div>
          <div className="row total"><span>Total</span><span>{money(sub + fee)}</span></div>
          {area && sub > 0 && sub < area.minOrderCents && <p className="warn">Below the {money(area.minOrderCents)} minimum order.</p>}
          <label className="check"><input type="checkbox" name="ignoreMinOrder" />Allow below the minimum order</label>
          <label className="check"><input type="checkbox" name="emailCustomer" defaultChecked />Email the customer a confirmation (if email given)</label>
          <button className="btn btn-primary" disabled={pending || !lines.length}>{pending ? "Saving…" : "Create order"}</button>
          <p className="hint">The order starts as Confirmed and reserves the stock straight away.</p>
        </section>
      </div>
    </form>
  );
}
