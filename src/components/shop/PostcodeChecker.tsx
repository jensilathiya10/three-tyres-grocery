"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { findArea, type AreaRule } from "@/lib/postcode";
import { deliveryDate, formatDay } from "@/lib/format";

export function PostcodeChecker({ areas, label = "Do we deliver to you?", wide = false }: { areas: AreaRule[]; label?: string; wide?: boolean }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function check(e: React.FormEvent) {
    e.preventDefault();
    const r = findArea(value, areas);
    setResult(
      r.ok
        ? { ok: true, msg: `We deliver to ${value.trim()}. Order now and it arrives ${formatDay(deliveryDate(r.area))}.` }
        : { ok: false, msg: r.message },
    );
  }

  return (
    <form className="pc" onSubmit={check} style={wide ? { maxWidth: "none", marginTop: 22 } : undefined}>
      <label htmlFor="pc-input">{label}</label>
      <div className="pc-row">
        <input id="pc-input" inputMode="numeric" maxLength={5} placeholder="Your postcode, e.g. 10115" autoComplete="postal-code" value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn btn-primary">Check</button>
      </div>
      {result && (
        <p className={`pc-result ${result.ok ? "ok" : "bad"}`} role="status">
          <Icon name={result.ok ? "check" : "x"} /><span>{result.msg}</span>
        </p>
      )}
    </form>
  );
}
