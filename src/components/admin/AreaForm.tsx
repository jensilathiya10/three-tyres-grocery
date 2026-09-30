"use client";

import { useActionState } from "react";
import { saveArea } from "@/app/actions/admin";

type Area = {
  id: string; name: string; postcodeFrom: string; postcodeTo: string; fee: string; freeOver: string; minOrder: string; estimatedDays: string; active: boolean;
};

export function AreaForm({ area }: { area: Area | null }) {
  const [state, action, pending] = useActionState(saveArea, {});
  const a = area ?? { id: "", name: "", postcodeFrom: "", postcodeTo: "", fee: "3.99", freeOver: "49.00", minOrder: "20.00", estimatedDays: "1", active: true };
  const p = a.id || "new";
  const f = (k: keyof Area, label: string, mode: "numeric" | "decimal" | "text" = "text") => (
    <div className="field">
      <label htmlFor={`${p}-${k}`}>{label}</label>
      <input className="input" id={`${p}-${k}`} name={k} defaultValue={a[k] as string} inputMode={mode} required />
    </div>
  );
  return (
    <form action={action} className="card-panel">
      <h2>{area ? area.name : "Add an area"}</h2>
      <input type="hidden" name="id" value={a.id} />
      <div className="fields" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {f("name", "Name")}
        {f("postcodeFrom", "Postcodes from", "numeric")}
        {f("postcodeTo", "Postcodes to", "numeric")}
        {f("estimatedDays", "Delivery in (days)", "numeric")}
        {f("fee", "Delivery fee (€)", "decimal")}
        {f("freeOver", "Free delivery over (€)", "decimal")}
        {f("minOrder", "Minimum order (€)", "decimal")}
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
        <label className="check"><input type="checkbox" name="active" defaultChecked={a.active} />Active</label>
        <button className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Saving…" : area ? "Save" : "Add area"}</button>
        {state.error && <span className="err">{state.error}</span>}
        {state.ok && <span className="hint ok">Saved.</span>}
      </div>
    </form>
  );
}
