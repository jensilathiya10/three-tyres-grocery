"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ProductView } from "@/lib/catalog";
import { refreshCart } from "@/app/actions/cart";

export type CartLine = ProductView & { qty: number };

type CartCtx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotalCents: number;
  qty: (id: string) => number;
  add: (p: ProductView, n?: number) => number;
  setQty: (id: string, n: number) => void;
  clear: () => void;
  toast: string | null;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "threetyres-cart-v1";

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]).filter((l) => l && l.id && l.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Load the saved cart, then refresh prices and stock from the server so nothing stale reaches checkout
  useEffect(() => {
    const saved = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage after mount
    setLines(saved);
    setReady(true);
    if (!saved.length) return;
    refreshCart(saved.map((l) => l.id)).then((fresh) => {
      const byId = new Map(fresh.map((p) => [p.id, p]));
      setLines((cur) =>
        cur.flatMap((l) => {
          const p = byId.get(l.id);
          if (!p) return []; // product removed from the shop
          // Keep sold-out lines so the cart can say so; otherwise clamp to what's in stock
          return [{ ...p, qty: p.stock > 0 ? Math.min(l.qty, p.stock) : l.qty }];
        }),
      );
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const qty = useCallback((id: string) => lines.find((l) => l.id === id)?.qty ?? 0, [lines]);

  const add = useCallback((p: ProductView, n = 1) => {
    const before = lines.find((l) => l.id === p.id)?.qty ?? 0;
    const next = Math.min(before + n, p.stock);
    const added = Math.max(0, next - before);
    if (added) {
      setLines((cur) => {
        const exists = cur.some((l) => l.id === p.id);
        return exists ? cur.map((l) => (l.id === p.id ? { ...l, ...p, qty: next } : l)) : [...cur, { ...p, qty: next }];
      });
      setToast(`Added ${added > 1 ? `${added} × ` : ""}${p.name}`);
    } else {
      setToast(`No more ${p.name} in stock`);
    }
    return added;
  }, [lines]);

  const setQty = useCallback((id: string, n: number) => {
    setLines((cur) =>
      cur.flatMap((l) => (l.id !== id ? [l] : n <= 0 ? [] : [{ ...l, qty: Math.min(n, l.stock) }])),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(() => ({
    lines,
    ready,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotalCents: lines.reduce((s, l) => s + l.qty * l.priceCents, 0),
    qty, add, setQty, clear, toast,
  }), [lines, ready, qty, add, setQty, clear, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const noSubscribe = () => () => {};
// What the server renders: an empty cart that hasn't loaded yet
const SERVER_VIEW = { ready: false, lines: [] as CartLine[], count: 0, subtotalCents: 0, qty: () => 0 };

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  // False while this component hydrates. A Suspense boundary (like the header) can hydrate after the cart
  // has loaded; without this it would render the saved cart where the server sent an empty one.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated ? ctx : { ...ctx, ...SERVER_VIEW };
}
