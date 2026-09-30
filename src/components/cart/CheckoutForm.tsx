"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type CSSProperties } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/order";
import { Icon } from "@/components/Icon";
import { PackArt } from "@/components/PackArt";
import { deliveryDate, formatDay, money } from "@/lib/format";
import { deliveryFee, findArea, type AreaRule } from "@/lib/postcode";
import { useCart } from "./CartProvider";
import { lineProblem } from "./CartView";

type FieldProps = {
  id: string; label: string; state: CheckoutState; type?: string; autoComplete?: string; inputMode?: "tel" | "email" | "numeric" | "text";
  placeholder?: string; optional?: boolean; span?: boolean; hint?: string;
};

function Field({ id, label, state, type = "text", autoComplete, inputMode, placeholder, optional, span, hint }: FieldProps) {
  const err = state.fieldErrors?.[id as keyof NonNullable<CheckoutState["fieldErrors"]>];
  return (
    <div className={`field${span ? " span2" : ""}`}>
      <label htmlFor={`co-${id}`}>{label}{optional && <span className="opt"> (optional)</span>}</label>
      <input
        className="input" id={`co-${id}`} name={id} type={type} autoComplete={autoComplete} inputMode={inputMode} placeholder={placeholder}
        defaultValue={state.values?.[id as keyof NonNullable<CheckoutState["values"]>] ?? ""} aria-invalid={err ? true : undefined}
        aria-describedby={err ? `co-${id}-err` : hint ? `co-${id}-hint` : undefined}
      />
      {hint && !err && <p className="hint" id={`co-${id}-hint`}>{hint}</p>}
      {err && <p className="err" id={`co-${id}-err`}>{err}</p>}
    </div>
  );
}

const DRAFT_KEY = "threetyres-checkout-draft";

export function CheckoutForm({ areas }: { areas: AreaRule[] }) {
  const { lines, ready, subtotalCents: sub } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [postcode, setPostcode] = useState(state.values?.postcode ?? "");
  const [draft, setDraft] = useState<CheckoutState["values"]>();

  // Prefill from the last checkout on this device so returning customers don't retype their address
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage after mount
        setDraft(saved);
        setPostcode(saved.postcode ?? "");
      }
    } catch {}
  }, []);

  if (!ready) return <div style={{ minHeight: 400 }} />;

  const pc = postcode.length === 5 ? findArea(postcode, areas) : null;
  const area = pc?.ok ? pc.area : areas[0];
  const fee = area ? deliveryFee(sub, area) : 0;
  const problems = lines.filter((l) => lineProblem(l));

  if (!lines.length || (area && sub < area.minOrderCents) || problems.length) {
    return (
      <div className="empty" style={{ marginBottom: 56 }}>
        <h3>{!lines.length ? "Your cart is empty" : "Your cart needs a change before checkout"}</h3>
        <p>{!lines.length ? "Add some groceries first." : problems.length ? "Some products are sold out or low on stock." : `The minimum order is ${money(area!.minOrderCents)}.`}</p>
        <Link className="btn btn-primary" href={lines.length ? "/cart" : "/shop"}>{lines.length ? "Back to cart" : "Shop groceries"}</Link>
      </div>
    );
  }

  const values = { ...draft, ...state.values };
  const shown: CheckoutState = { ...state, values };

  function saveDraft(form: HTMLFormElement) {
    const fd = new FormData(form);
    const keep = ["name", "phone", "email", "street", "apartment", "postcode"];
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(Object.fromEntries(keep.map((k) => [k, String(fd.get(k) ?? "")])))); } catch {}
  }

  return (
    <div className="two-col">
      <form className="co min0" action={action} onSubmit={(e) => saveDraft(e.currentTarget)} noValidate key={draft ? "draft" : "blank"}>
        <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ id: l.id, qty: l.qty })))} />
        {state.error && <p className="alert" role="alert" style={{ marginBottom: 20 }}>{state.error}</p>}

        <fieldset>
          <legend><span className="n">1</span>Your details</legend>
          <div className="fields">
            <Field id="name" label="Full name" state={shown} autoComplete="name" span />
            <Field id="phone" label="Phone number" state={shown} type="tel" autoComplete="tel" inputMode="tel" placeholder="+49 151 …" hint="Our driver calls this number if they can't find you." />
            <Field id="email" label="Email" state={shown} type="email" autoComplete="email" inputMode="email" hint="For your order confirmation." />
          </div>
        </fieldset>

        <fieldset>
          <legend><span className="n">2</span>Delivery address</legend>
          <div className="fields">
            <Field id="street" label="Street and house number" state={shown} autoComplete="address-line1" placeholder="Torstraße 12" span />
            <Field id="apartment" label="Apartment, floor, name on doorbell" state={shown} autoComplete="address-line2" optional span />
            <div className="field">
              <label htmlFor="co-postcode">Postcode</label>
              <input className="input" id="co-postcode" name="postcode" inputMode="numeric" maxLength={5} autoComplete="postal-code"
                value={postcode} onChange={(e) => setPostcode(e.target.value)} aria-invalid={state.fieldErrors?.postcode ? true : undefined} />
              {state.fieldErrors?.postcode && !pc ? (
                <p className="err">{state.fieldErrors.postcode}</p>
              ) : (
                <p className={`hint ${pc ? (pc.ok ? "ok" : "bad") : ""}`} role="status">
                  {pc ? (pc.ok ? `We deliver to ${postcode}.` : pc.message) : `We deliver to ${areas.map((a) => `${a.postcodeFrom}–${a.postcodeTo}`).join(", ")}.`}
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="co-city">City</label>
              <input className="input" id="co-city" value="Berlin" readOnly />
            </div>
            <div className="field span2">
              <label htmlFor="co-note">Note for the driver <span className="opt">(optional)</span></label>
              <textarea className="input" id="co-note" name="note" rows={2} placeholder="Back building, 3rd floor, no lift" defaultValue={values.note ?? ""} />
            </div>
          </div>
          {area && (
            <div className="slot">
              <Icon name="truck" />
              <div>
                <b>{area.name} delivery · {formatDay(deliveryDate(area.estimatedDays))}</b>
                <span className="muted" style={{ fontSize: 14 }}>Between 16:00 and 21:00. {fee ? `Delivery fee ${money(fee)}.` : "Free delivery on this order."}</span>
              </div>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend><span className="n">3</span>Payment</legend>
          <div className="pay">
            <label>
              <input type="radio" name="payment" value="ON_DELIVERY" defaultChecked={values.payment !== "WHATSAPP"} />
              <b>Pay on delivery</b>
              <small>Pay the driver by card or cash when your groceries arrive.</small>
            </label>
            <label>
              <input type="radio" name="payment" value="WHATSAPP" defaultChecked={values.payment === "WHATSAPP"} />
              <b>Confirm on WhatsApp</b>
              <small>We message you to confirm the order and how you&apos;d like to pay.</small>
            </label>
          </div>
          {state.fieldErrors?.payment && <p className="err" style={{ marginTop: 8 }}>{state.fieldErrors.payment}</p>}
        </fieldset>

        <button className="btn btn-primary btn-block" type="submit" disabled={pending} style={{ paddingBlock: 16, fontSize: 16 }}>
          {pending ? "Placing your order…" : <>Place order · <span className="num">{money(sub + fee)}</span></>}
        </button>
        <p className="muted" style={{ fontSize: 13, marginTop: 10, textAlign: "center" }}>By placing your order you agree to our terms of sale.</p>
      </form>

      <aside className="summary">
        <div className="row"><h2>Your order</h2><Link className="link" href="/cart">Edit</Link></div>
        <div className="mini-lines">
          {lines.map((l) => (
            <div className="mini" key={l.id} style={{ "--pb": l.packBg } as CSSProperties}>
              <PackArt p={l} />
              <div className="min0"><b>{l.name}</b><span className="muted">{l.qty} × {money(l.priceCents)}</span></div>
              <span className="num">{money(l.priceCents * l.qty)}</span>
            </div>
          ))}
        </div>
        <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}><span>Subtotal</span><span>{money(sub)}</span></div>
        <div className="row"><span>Delivery</span><span>{fee ? money(fee) : "Free"}</span></div>
        <div className="row total"><span>Total</span><span>{money(sub + fee)}</span></div>
      </aside>
    </div>
  );
}
