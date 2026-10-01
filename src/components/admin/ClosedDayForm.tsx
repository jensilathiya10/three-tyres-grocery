"use client";

import { useActionState } from "react";
import { addClosedDay } from "@/app/actions/admin";

export function ClosedDayForm({ min }: { min: string }) {
  const [state, action, pending] = useActionState(addClosedDay, {});
  return (
    <form action={action} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginTop: 16 }}>
      <div className="field">
        <label htmlFor="closed-date">Date</label>
        <input className="input" id="closed-date" name="date" type="date" min={min} required />
      </div>
      <div className="field" style={{ flex: "1 1 220px" }}>
        <label htmlFor="closed-reason">Reason <span className="opt">(optional, staff only)</span></label>
        <input className="input" id="closed-reason" name="reason" maxLength={80} placeholder="e.g. Diwali, stock-taking" />
      </div>
      <button className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Adding…" : "Add day off"}</button>
      {state.error && <span className="err">{state.error}</span>}
      {state.ok && <span className="hint ok">Added.</span>}
    </form>
  );
}
