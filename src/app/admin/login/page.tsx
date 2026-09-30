"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/admin";
import { Logo } from "@/components/shop/Chrome";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <div className="login">
      <form action={action}>
        <div className="logo"><Logo /></div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Shop admin</h1>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" autoFocus required />
        </div>
        {state.error && <p className="err" role="alert">{state.error}</p>}
        <button className="btn btn-primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
