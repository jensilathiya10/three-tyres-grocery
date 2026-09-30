"use client";

import type { ProductView } from "@/lib/catalog";
import { Icon } from "@/components/Icon";
import { useCart } from "@/components/cart/CartProvider";

export function StudentPackButton({ p }: { p: ProductView }) {
  const cart = useCart();
  if (p.stock <= 0) return <span className="btn btn-saffron" aria-disabled="true">Sold out</span>;
  return (
    <button type="button" className="btn btn-saffron" onClick={() => cart.add(p)}>
      <Icon name="plus" />Add pack to cart
    </button>
  );
}
