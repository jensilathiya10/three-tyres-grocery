import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseSize } from "../src/lib/unit-price";
import { pgConfig } from "../src/lib/database-url";

const db = new PrismaClient({ adapter: new PrismaPg(pgConfig("direct")) });

// Sample catalogue. Replace names, prices, stock and label info with your real products.
const CATEGORIES = [
  { slug: "rice", name: "Rice & Grains", short: "Rice", color: "#C9A227", blurb: "Long-grain and everyday rice for biryani, pulao and dal-chawal." },
  { slug: "atta", name: "Atta & Flour", short: "Atta", color: "#B8862B", blurb: "Flours for rotis, parathas, pakoras and halwa." },
  { slug: "dal", name: "Dal & Pulses", short: "Dal", color: "#D9822B", blurb: "Everyday lentils and pulses for dal, sambar and khichdi." },
  { slug: "masala", name: "Spices & Masala", short: "Masala", color: "#C0392B", blurb: "Ground spices and blends for everyday cooking." },
  { slug: "snacks", name: "Snacks", short: "Snacks", color: "#E0A030", blurb: "Namkeen, noodles and biscuits for chai time." },
  { slug: "pickles", name: "Pickles & Chutneys", short: "Pickles", color: "#7A9A2A", blurb: "Achar to go with rice, parathas and thali." },
  { slug: "tea", name: "Tea & Drinks", short: "Tea", color: "#8E4A2B", blurb: "Strong tea for masala chai, plus drinks and syrups." },
  { slug: "frozen", name: "Frozen", short: "Frozen", color: "#3A86B8", blurb: "Ready-to-heat breads and snacks. Kept frozen until delivery." },
  { slug: "sweets", name: "Sweets", short: "Sweets", color: "#C2477A", blurb: "Mithai for festivals, guests and late-night cravings." },
  { slug: "packs", name: "Grocery packs", short: "Packs", color: "#176B45", blurb: "A ready-made kitchen restock at a bundle price." },
];

const GLUTEN = "Contains wheat (gluten).";
type P = {
  slug: string; brand: string; name: string; label: string; size: string; cat: string;
  price: number; was?: number; stock: number; popular?: boolean; allergens?: string;
  pack: [string, string, string]; contents?: string[];
};

const PRODUCTS: P[] = [
  { slug: "india-gate-basmati-5kg", brand: "India Gate", name: "Basmati Rice Classic", label: "Basmati", size: "5 kg", cat: "rice", price: 14.99, stock: 18, popular: true, pack: ["#1F4E8C", "#F6E7B8", "sack"] },
  { slug: "daawat-rozana-5kg", brand: "Daawat", name: "Rozana Basmati Rice", label: "Rozana", size: "5 kg", cat: "rice", price: 10.49, was: 11.99, stock: 22, pack: ["#B3202A", "#FFF3D6", "sack"] },
  { slug: "sona-masoori-5kg", brand: "Laxmi", name: "Sona Masoori Rice", label: "Sona Masoori", size: "5 kg", cat: "rice", price: 11.99, stock: 9, pack: ["#2E7D4F", "#FFFFFF", "sack"] },
  { slug: "poha-thick-500g", brand: "Laxmi", name: "Poha (Thick)", label: "Poha", size: "500 g", cat: "rice", price: 1.99, stock: 40, pack: ["#E9C46A", "#3B2A10", "pouch"] },
  { slug: "aashirvaad-atta-5kg", brand: "Aashirvaad", name: "Shudh Chakki Atta", label: "Chakki Atta", size: "5 kg", cat: "atta", price: 9.99, stock: 27, popular: true, allergens: GLUTEN, pack: ["#C8102E", "#FFE9A8", "sack"] },
  { slug: "pillsbury-atta-5kg", brand: "Pillsbury", name: "Chakki Fresh Atta", label: "Atta", size: "5 kg", cat: "atta", price: 8.99, was: 9.99, stock: 12, allergens: GLUTEN, pack: ["#1D4F91", "#FFFFFF", "sack"] },
  { slug: "besan-1kg", brand: "TRS", name: "Gram Flour (Besan)", label: "Besan", size: "1 kg", cat: "atta", price: 3.49, stock: 30, pack: ["#F2C14E", "#5A3A00", "pouch"] },
  { slug: "sooji-1kg", brand: "TRS", name: "Semolina (Sooji)", label: "Sooji", size: "1 kg", cat: "atta", price: 2.29, stock: 25, allergens: GLUTEN, pack: ["#F4EBD0", "#6B4E16", "pouch"] },
  { slug: "toor-dal-1kg", brand: "TRS", name: "Toor Dal", label: "Toor Dal", size: "1 kg", cat: "dal", price: 3.99, stock: 4, popular: true, pack: ["#E3A018", "#3B2400", "pouch"] },
  { slug: "moong-dal-1kg", brand: "TRS", name: "Moong Dal (Yellow)", label: "Moong Dal", size: "1 kg", cat: "dal", price: 3.79, stock: 20, pack: ["#8DB33A", "#1E2B05", "pouch"] },
  { slug: "chana-dal-1kg", brand: "TRS", name: "Chana Dal", label: "Chana Dal", size: "1 kg", cat: "dal", price: 3.29, stock: 16, pack: ["#D98F2B", "#2E1A00", "pouch"] },
  { slug: "urad-dal-1kg", brand: "TRS", name: "Urad Dal (White)", label: "Urad Dal", size: "1 kg", cat: "dal", price: 3.99, stock: 0, pack: ["#EDE6D6", "#4A4030", "pouch"] },
  { slug: "mdh-chana-masala", brand: "MDH", name: "Chana Masala", label: "Chana Masala", size: "100 g", cat: "masala", price: 2.49, stock: 2, popular: true, pack: ["#B71C1C", "#FFD54F", "box"] },
  { slug: "everest-garam-masala", brand: "Everest", name: "Garam Masala", label: "Garam Masala", size: "100 g", cat: "masala", price: 2.49, stock: 34, pack: ["#5D1F7A", "#FFE082", "box"] },
  { slug: "everest-haldi-200g", brand: "Everest", name: "Turmeric Powder (Haldi)", label: "Haldi", size: "200 g", cat: "masala", price: 1.99, stock: 28, pack: ["#F9A825", "#3E2700", "box"] },
  { slug: "everest-kitchen-king", brand: "Everest", name: "Kitchen King Masala", label: "Kitchen King", size: "100 g", cat: "masala", price: 2.29, was: 2.79, stock: 19, pack: ["#0D47A1", "#FFEB3B", "box"] },
  { slug: "aloo-bhujia-400g", brand: "Haldiram's", name: "Aloo Bhujia", label: "Aloo Bhujia", size: "400 g", cat: "snacks", price: 3.49, was: 3.99, stock: 26, popular: true, pack: ["#D32F2F", "#FFF59D", "pouch"] },
  { slug: "maggi-masala-12", brand: "Maggi", name: "Masala Noodles, 12 pack", label: "Masala Noodles", size: "12 × 70 g", cat: "snacks", price: 6.49, stock: 52, popular: true, allergens: GLUTEN, pack: ["#FFD600", "#C62828", "box"] },
  { slug: "parle-g-800g", brand: "Parle", name: "Parle-G Biscuits", label: "Parle-G", size: "800 g", cat: "snacks", price: 2.49, stock: 44, allergens: GLUTEN, pack: ["#F5D76E", "#C62828", "box"] },
  { slug: "moong-dal-namkeen", brand: "Haldiram's", name: "Moong Dal Namkeen", label: "Moong Dal", size: "200 g", cat: "snacks", price: 1.99, stock: 31, pack: ["#2E7D32", "#FFF8E1", "pouch"] },
  { slug: "mango-pickle-500g", brand: "Mother's Recipe", name: "Mango Pickle", label: "Mango Pickle", size: "500 g", cat: "pickles", price: 3.99, stock: 15, popular: true, pack: ["#E65100", "#FFF3E0", "jar"] },
  { slug: "lime-pickle-300g", brand: "Priya", name: "Lime Pickle", label: "Lime Pickle", size: "300 g", cat: "pickles", price: 2.99, stock: 11, pack: ["#9E9D24", "#FFFDE7", "jar"] },
  { slug: "tata-tea-500g", brand: "Tata Tea", name: "Premium Tea", label: "Premium", size: "500 g", cat: "tea", price: 5.49, stock: 23, popular: true, pack: ["#8E1B1B", "#F3D9A4", "box"] },
  { slug: "red-label-500g", brand: "Brooke Bond", name: "Red Label Tea", label: "Red Label", size: "500 g", cat: "tea", price: 5.29, was: 5.99, stock: 17, pack: ["#C62828", "#FFFFFF", "box"] },
  { slug: "rooh-afza-750ml", brand: "Hamdard", name: "Rooh Afza Syrup", label: "Rooh Afza", size: "750 ml", cat: "tea", price: 4.49, stock: 8, pack: ["#AD1457", "#FCE4EC", "jar"] },
  { slug: "malabar-paratha-5", brand: "Haldiram's", name: "Malabar Paratha (frozen)", label: "Paratha", size: "5 pcs", cat: "frozen", price: 3.49, stock: 14, allergens: GLUTEN, pack: ["#1565C0", "#E3F2FD", "box"] },
  { slug: "punjabi-samosa-20", brand: "Haldiram's", name: "Punjabi Samosa (frozen)", label: "Samosa", size: "20 pcs", cat: "frozen", price: 5.99, stock: 0, allergens: GLUTEN, pack: ["#00695C", "#E0F2F1", "box"] },
  { slug: "gulab-jamun-1kg", brand: "Haldiram's", name: "Gulab Jamun", label: "Gulab Jamun", size: "1 kg tin", cat: "sweets", price: 4.99, stock: 13, popular: true, pack: ["#6D2E1F", "#FFE0B2", "jar"] },
  { slug: "soan-papdi-250g", brand: "Haldiram's", name: "Soan Papdi", label: "Soan Papdi", size: "250 g", cat: "sweets", price: 2.99, stock: 21, pack: ["#F57F17", "#FFFDE7", "box"] },
  { slug: "rasgulla-1kg", brand: "Haldiram's", name: "Rasgulla", label: "Rasgulla", size: "1 kg tin", cat: "sweets", price: 4.99, stock: 9, pack: ["#ECEFF1", "#37474F", "jar"] },
];

const PACK = ["daawat-rozana-5kg", "aashirvaad-atta-5kg", "toor-dal-1kg", "everest-garam-masala", "maggi-masala-12", "aloo-bhujia-400g"];
const packWas = PACK.reduce((s, slug) => s + PRODUCTS.find((p) => p.slug === slug)!.price, 0);
PRODUCTS.push({
  slug: "student-starter-pack", brand: "Three Tyres", name: "Student Starter Pack", label: "Starter Pack", size: "6 items",
  cat: "packs", price: 34.99, was: +packWas.toFixed(2), stock: 15, allergens: GLUTEN, pack: ["#176B45", "#FFFDF8", "box"], contents: PACK,
});

const cents = (n: number) => Math.round(n * 100);

async function main() {
  // Only fill an empty shop: re-running would overwrite real prices and stock with these samples.
  // Runs on every Vercel deploy, so this guard is what keeps live data safe. SEED_FORCE=1 overrides it.
  const existing = await db.product.count();
  if (existing > 0 && process.env.SEED_FORCE !== "1") {
    console.log(`Seed skipped: the shop already has ${existing} products.`);
    return;
  }
  for (const [i, c] of CATEGORIES.entries()) {
    await db.category.upsert({ where: { slug: c.slug }, update: { ...c, sort: i }, create: { ...c, sort: i } });
  }
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));
  for (const p of PRODUCTS) {
    const data = {
      name: p.name, brand: p.brand, label: p.label, size: p.size, allergens: p.allergens ?? "",
      priceCents: cents(p.price), wasCents: p.was ? cents(p.was) : null, stock: p.stock, popular: !!p.popular,
      packBg: p.pack[0], packFg: p.pack[1], packShape: p.pack[2], contents: p.contents ?? [], categoryId: cats[p.cat],
      ...(parseSize(p.size) ?? {}),
    };
    await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
  }
  if ((await db.deliveryArea.count()) === 0) {
    await db.deliveryArea.create({
      data: { name: "Berlin", postcodeFrom: 10115, postcodeTo: 14199, feeCents: 399, freeOverCents: 4900, minOrderCents: 2000, estimatedDays: 1 },
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products.`);
}

main().finally(() => db.$disconnect());
