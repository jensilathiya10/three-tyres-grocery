"use client";

import { useActionState, useState, type CSSProperties } from "react";
import { saveProduct, type ProductFormState } from "@/app/actions/admin";
import { PackArt } from "@/components/PackArt";

export type ProductFormValues = {
  id: string; name: string; brand: string; label: string; size: string; slug: string; categoryId: string;
  price: string; was: string; stock: string; description: string; allergens: string; origin: string;
  imageUrl: string; packBg: string; packFg: string; packShape: string; popular: boolean; active: boolean;
};

const BLANK: ProductFormValues = {
  id: "", name: "", brand: "", label: "", size: "", slug: "", categoryId: "", price: "", was: "", stock: "0",
  description: "", allergens: "", origin: "India", imageUrl: "", packBg: "#176B45", packFg: "#FFFDF8", packShape: "box", popular: false, active: true,
};

export function ProductForm({ product, categories }: { product: ProductFormValues | null; categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [v, setV] = useState<ProductFormValues>(product ?? BLANK);
  const set = (k: keyof ProductFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((cur) => ({ ...cur, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  const err = (k: string) => state.errors?.[k] && <p className="err">{state.errors[k]}</p>;

  const text = (k: keyof ProductFormValues, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <div className="field">
      <label htmlFor={`p-${k}`}>{label}</label>
      <input className="input" id={`p-${k}`} name={k} value={v[k] as string} onChange={set(k)} aria-invalid={state.errors?.[k] ? true : undefined} {...extra} />
      {hint && !state.errors?.[k] && <p className="hint">{hint}</p>}
      {err(k)}
    </div>
  );

  const preview = {
    name: v.name || "Product", brand: v.brand || "Brand", label: v.label || v.name.split(" ").slice(0, 2).join(" ") || "Label",
    size: v.size || "1 kg", stock: Number(v.stock) || 0, imageUrl: /^https:\/\//.test(v.imageUrl) ? v.imageUrl : null,
    packBg: v.packBg, packFg: v.packFg, packShape: v.packShape,
  };

  return (
    <form action={action} className="admin-grid">
      <input type="hidden" name="id" value={v.id} />
      <div style={{ display: "grid", gap: 20 }}>
        {state.error && <p className="alert">{state.error}</p>}
        <section className="card-panel">
          <h2>Basics</h2>
          <div className="fields">
            {text("name", "Product name", { required: true, placeholder: "Toor Dal" })}
            {text("brand", "Brand", { required: true, placeholder: "TRS" })}
            {text("size", "Pack size", { required: true, placeholder: "1 kg" })}
            <div className="field">
              <label htmlFor="p-categoryId">Category</label>
              <select className="input" id="p-categoryId" name="categoryId" value={v.categoryId} onChange={set("categoryId")} required>
                <option value="">Choose…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {err("categoryId")}
            </div>
            <div className="field span2">
              <label htmlFor="p-description">Description <span className="opt">(optional)</span></label>
              <textarea className="input" id="p-description" name="description" rows={3} value={v.description} onChange={set("description")} />
            </div>
          </div>
        </section>
        <section className="card-panel">
          <h2>Price and stock</h2>
          <div className="fields">
            {text("price", "Price (€)", { required: true, inputMode: "decimal", placeholder: "3.99" })}
            {text("was", "Original price (€)", { inputMode: "decimal", placeholder: "Leave empty unless discounted" }, "Only for a real discount. Shows as a crossed-out price.")}
            {text("stock", "Stock", { type: "number", min: 0, required: true }, "At 0 the product shows as out of stock.")}
            <div className="field" style={{ alignContent: "center", gap: 10 }}>
              <label className="check"><input type="checkbox" name="active" checked={v.active} onChange={set("active")} />On sale in the shop</label>
              <label className="check"><input type="checkbox" name="popular" checked={v.popular} onChange={set("popular")} />Show under Popular</label>
            </div>
          </div>
        </section>
        <section className="card-panel">
          <h2>Label information</h2>
          <p className="hint" style={{ marginBottom: 12 }}>Copy these from the real pack. Food law requires accurate allergen information.</p>
          <div className="fields">
            {text("allergens", "Allergens", { placeholder: "Contains wheat (gluten)." })}
            {text("origin", "Country of origin")}
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <section className="card-panel">
          <h2>Picture</h2>
          <div style={{ background: `color-mix(in srgb, ${v.packBg} 12%, var(--sunk))`, borderRadius: 14, maxWidth: 220, margin: "0 auto 14px", "--pb": v.packBg } as CSSProperties}>
            <PackArt p={preview} />
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {text("imageUrl", "Photo link", { placeholder: "https://…" }, "Optional. Without a photo, a drawn pack is shown using the settings below.")}
            {text("label", "Text on drawn pack", { maxLength: 30 })}
            <div className="fields">
              <div className="field"><label htmlFor="p-packBg">Pack colour</label><input className="input" id="p-packBg" type="color" name="packBg" value={v.packBg} onChange={set("packBg")} style={{ height: 44, padding: 4 }} /></div>
              <div className="field"><label htmlFor="p-packFg">Text colour</label><input className="input" id="p-packFg" type="color" name="packFg" value={v.packFg} onChange={set("packFg")} style={{ height: 44, padding: 4 }} /></div>
            </div>
            <div className="field">
              <label htmlFor="p-packShape">Pack shape</label>
              <select className="input" id="p-packShape" name="packShape" value={v.packShape} onChange={set("packShape")}>
                <option value="sack">Sack (rice, atta)</option>
                <option value="pouch">Pouch (dal, snacks)</option>
                <option value="box">Box (masala, tea)</option>
                <option value="jar">Jar or tin (pickles, sweets)</option>
              </select>
            </div>
            {text("slug", "Web address", {}, v.slug ? `/product/${v.slug}` : "Leave empty to create one from the name.")}
          </div>
        </section>
        <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save product"}</button>
      </div>
    </form>
  );
}
