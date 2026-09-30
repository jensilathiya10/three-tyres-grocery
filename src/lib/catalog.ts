import "server-only";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";
import type { AreaRule } from "./postcode";

/** The product fields the storefront needs. Plain data, safe to pass to client components. */
export type ProductView = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  label: string;
  size: string;
  priceCents: number;
  wasCents: number | null;
  stock: number;
  imageUrl: string | null;
  packBg: string;
  packFg: string;
  packShape: string;
};

const productSelect = {
  id: true, slug: true, name: true, brand: true, label: true, size: true, priceCents: true, wasCents: true,
  stock: true, imageUrl: true, packBg: true, packFg: true, packShape: true,
} satisfies Prisma.ProductSelect;

const withContents = { ...productSelect, contents: true } satisfies Prisma.ProductSelect;

/**
 * A bundle (e.g. the Student Starter Pack) can only be sold while every product inside it is on sale and in stock,
 * so its stock is the lowest of its own stock and its parts' stock.
 */
async function applyBundleStock<T extends { stock: number; contents: string[] }>(list: T[]): Promise<T[]> {
  const slugs = [...new Set(list.flatMap((p) => p.contents))];
  if (!slugs.length) return list;
  const parts = await db.product.findMany({ where: { slug: { in: slugs }, active: true }, select: { slug: true, stock: true } });
  const stockOf = new Map(parts.map((p) => [p.slug, p.stock]));
  // A slug listed twice means two units per pack
  const perPack = (contents: string[]) => contents.reduce((m, s) => m.set(s, (m.get(s) ?? 0) + 1), new Map<string, number>());
  return list.map((p) => {
    if (!p.contents.length) return p;
    let stock = p.stock;
    for (const [slug, n] of perPack(p.contents)) stock = Math.min(stock, Math.floor((stockOf.get(slug) ?? 0) / n));
    return { ...p, stock };
  });
}

export type SortKey = "popular" | "low" | "high" | "new";

export async function getCategories() {
  return db.category.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { products: { where: { active: true } } } } } });
}

export async function getProducts(opts: { cat?: string; q?: string; sort?: SortKey; deals?: boolean; popular?: boolean; take?: number } = {}) {
  const q = opts.q?.trim();
  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(opts.cat ? { category: { slug: opts.cat } } : {}),
    ...(opts.deals ? { wasCents: { not: null } } : {}),
    ...(opts.popular ? { popular: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { label: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    opts.sort === "low" ? [{ priceCents: "asc" }]
    : opts.sort === "high" ? [{ priceCents: "desc" }]
    : opts.sort === "new" ? [{ createdAt: "desc" }]
    : [{ popular: "desc" }, { category: { sort: "asc" } }, { name: "asc" }];
  const list = await applyBundleStock(await db.product.findMany({ where, orderBy, select: withContents, take: opts.take }));
  // In-stock first; Array.sort is stable so the chosen order is kept within each group
  return list.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0)).map(toView);
}

export async function getProduct(slug: string) {
  const p = await db.product.findUnique({ where: { slug }, include: { category: true } });
  if (!p || !p.active) return null;
  const contents = p.contents.length
    ? await db.product.findMany({ where: { slug: { in: p.contents } }, select: productSelect })
    : [];
  const [withStock] = await applyBundleStock([p]);
  return { ...p, stock: withStock.stock, contents };
}

export async function getProductsByIds(ids: string[]) {
  return applyBundleStock(await db.product.findMany({ where: { id: { in: ids } }, select: { ...withContents, active: true } }));
}

export async function getDeliveryAreas(): Promise<AreaRule[]> {
  return db.deliveryArea.findMany({
    where: { active: true },
    orderBy: { postcodeFrom: "asc" },
    select: { id: true, name: true, postcodeFrom: true, postcodeTo: true, feeCents: true, freeOverCents: true, minOrderCents: true, estimatedDays: true, cutoffHour: true, excludedPostcodes: true },
  });
}

/** The main area drives site-wide copy like "free delivery over €49". */
export async function getMainArea() {
  const areas = await getDeliveryAreas();
  return { areas, main: areas[0] ?? null };
}

/** Strip a full product row down to the fields client components need. */
export function toView(p: ProductView): ProductView {
  const { id, slug, name, brand, label, size, priceCents, wasCents, stock, imageUrl, packBg, packFg, packShape } = p;
  return { id, slug, name, brand, label, size, priceCents, wasCents, stock, imageUrl, packBg, packFg, packShape };
}
