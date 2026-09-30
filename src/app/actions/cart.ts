"use server";

import { z } from "zod";
import { getProductsByIds, toView, type ProductView } from "@/lib/catalog";

/** Current price and stock for the products in a visitor's saved cart. */
export async function refreshCart(ids: unknown): Promise<ProductView[]> {
  const parsed = z.array(z.string().max(40)).max(100).safeParse(ids);
  if (!parsed.success) return [];
  const products = await getProductsByIds(parsed.data);
  return products.filter((p) => p.active).map(toView);
}
