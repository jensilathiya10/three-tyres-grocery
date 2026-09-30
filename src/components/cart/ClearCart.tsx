"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Empties the cart once, after the order page loads following a successful checkout. */
export function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (!ready) return;
    clear();
    // Drop ?new=1 so a refresh doesn't look like a fresh order
    window.history.replaceState(null, "", window.location.pathname);
  }, [ready, clear]);
  return null;
}
