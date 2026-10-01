import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseSize } from "../src/lib/unit-price";
import { pgConfig } from "../src/lib/database-url";
import { MARKUP_EUR, MONTHLY_ROWS, NEW_CATEGORIES, START_STOCK } from "./catalogue-monthly";

// Adds the monthly-list categories and products that are missing. It never changes or removes
// anything that exists, so admin edits survive; it runs on every Vercel deploy (see vercel.json).

const db = new PrismaClient({ adapter: new PrismaPg(pgConfig("direct")) });

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, " ").replace(/×/g, "x").trim().replace(/[\s_-]+/g, "-");

async function main() {
  const existingCats = await db.category.findMany();
  if (!existingCats.length) {
    console.log("Catalogue skipped: run the seed first so the base categories exist.");
    return;
  }
  let sort = Math.max(...existingCats.map((c) => c.sort)) + 1;
  let newCats = 0;
  for (const c of NEW_CATEGORIES) {
    if (existingCats.some((e) => e.slug === c.slug)) continue;
    await db.category.create({ data: { ...c, sort: sort++ } });
    newCats++;
  }
  const cats = new Map((await db.category.findMany()).map((c) => [c.slug, c]));

  const data = MONTHLY_ROWS.map(([name, label, size, catSlug, estimate, shape]) => {
    const cat = cats.get(catSlug);
    if (!cat) throw new Error(`Unknown category "${catSlug}" for ${name}`);
    return {
      slug: `${slugify(name)}-${slugify(size)}`,
      name, brand: "", label, size,
      priceCents: Math.round((estimate + MARKUP_EUR) * 100),
      stock: START_STOCK,
      packBg: cat.color, packFg: "#FFFFFF", packShape: shape,
      categoryId: cat.id,
      ...(parseSize(size) ?? {}),
    };
  });
  const dupes = data.map((d) => d.slug).filter((s, i, all) => all.indexOf(s) !== i);
  if (dupes.length) throw new Error(`Duplicate product slugs: ${dupes.join(", ")}`);

  const { count } = await db.product.createMany({ data, skipDuplicates: true });
  console.log(`Catalogue: ${newCats} new categories, ${count} new products (${data.length - count} already there).`);
}

main().finally(() => db.$disconnect());
