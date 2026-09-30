// One-off: fill netQuantity/netUnit from each product's size label, only where they're still empty.
// Run with: npx tsx scripts/backfill-net-quantity.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseSize } from "../src/lib/unit-price";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const products = await db.product.findMany({ where: { netQuantity: null }, select: { id: true, name: true, size: true } });
  const unknown: string[] = [];
  for (const p of products) {
    const parsed = parseSize(p.size);
    if (!parsed) { unknown.push(`${p.name} (${p.size})`); continue; }
    await db.product.update({ where: { id: p.id }, data: parsed });
  }
  console.log(`Filled ${products.length - unknown.length} of ${products.length} products.`);
  if (unknown.length) console.log("Set these by hand in the admin:", unknown.join(", "));
}

main().finally(() => db.$disconnect());
