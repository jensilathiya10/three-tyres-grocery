import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

// Built from the database on each request, so new or hidden products are picked up straight away
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicUrl();
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { products: { some: { active: true } } }, select: { slug: true } }),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/info`, changeFrequency: "monthly", priority: 0.5 },
    ...categories.map((c) => ({ url: `${base}/shop?cat=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...["impressum", "datenschutz", "agb", "widerruf"].map((p) => ({ url: `${base}/${p}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
