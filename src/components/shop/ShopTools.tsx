"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

/** Search box and sort menu for /shop. Both update the URL so results are shareable and server-rendered. */
export function ShopTools() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("focus") === "1") input.current?.focus();
  }, [params]);

  function push(next: Record<string, string>) {
    const sp = new URLSearchParams(params);
    sp.delete("focus");
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.replace(`${path}?${sp}`, { scroll: false });
  }

  // Debounce typing so we don't query on every keystroke
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => push({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="shop-tools">
      <label className="searchbox">
        <Icon name="search" />
        <input ref={input} type="search" placeholder="Search Indian groceries…" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <select className="select" aria-label="Sort products" value={params.get("sort") ?? "popular"} onChange={(e) => push({ sort: e.target.value === "popular" ? "" : e.target.value })}>
        <option value="popular">Popular</option>
        <option value="low">Price: low to high</option>
        <option value="high">Price: high to low</option>
        <option value="new">Newest</option>
      </select>
    </div>
  );
}
