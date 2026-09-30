"use client";

import { useActionState } from "react";
import { updateOrderStatus, type StatusResult } from "@/app/actions/admin";
import { STATUS_LABEL, STATUS_ORDER } from "./StatusPill";

export function StatusForm({ id, status, refundOnCancel }: { id: string; status: string; refundOnCancel: boolean }) {
  const [state, action, pending] = useActionState<StatusResult, FormData>(updateOrderStatus, {});
  const awaiting = status === "AWAITING_PAYMENT";
  return (
    <form action={action} style={{ display: "grid", gap: 10 }}>
      <input type="hidden" name="id" value={id} />
      {awaiting && <p className="hint">The customer hasn&apos;t finished paying. This order moves to New once Stripe confirms the payment. You can still cancel it.</p>}
      <div className="pay">
        {STATUS_ORDER.filter((s) => !awaiting || s === "CANCELLED").map((s) => (
          <label key={s} style={{ padding: "8px 12px" }}>
            <input type="radio" name="status" value={s} defaultChecked={status === s} />
            <b>{STATUS_LABEL[s]}</b>
            {s === "CANCELLED" && <small>{refundOnCancel ? "Refunds the online payment and puts the items back in stock." : "Puts the items back in stock."}</small>}
          </label>
        ))}
      </div>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      {state.ok && <p className="hint ok" role="status">{state.ok}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Update status"}</button>
    </form>
  );
}
