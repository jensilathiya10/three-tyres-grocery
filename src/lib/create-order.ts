import "server-only";
import { db } from "./db";
import { money } from "./format";
import { deliveryFee, type AreaRule } from "./postcode";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/client";

/** A problem the person placing the order can fix (stock, minimum order…). The message is shown to them. */
export class OrderError extends Error {}

export type NewOrder = {
  /** product id → quantity */
  wanted: Map<string, number>;
  customer: { name: string; phone: string; email: string; street: string; apartment: string; postcode: string; note: string };
  paymentMethod: PaymentMethod;
  status?: OrderStatus;
  area: AreaRule;
  deliveryDate: Date;
  /** Customers must meet the minimum order; staff may override it for phone/WhatsApp orders. */
  enforceMinOrder: boolean;
  /** How to tell the person to fix a stock problem. */
  fixHint: string;
};

/**
 * Creates an order and reserves its stock in one transaction.
 * Packs reserve the products inside them; totals are worked out from current prices, never from the client.
 */
export async function createOrderWithStock(o: NewOrder): Promise<string> {
  const { wanted, area } = o;
  return db.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: [...wanted.keys()] }, active: true } });
    if (products.length !== wanted.size) throw new OrderError(`Some products are no longer sold. ${o.fixHint}`);

    // Work out the total units needed per product, so a pack plus a separate bag of the same dal
    // both count against that dal's stock.
    const partSlugs = [...new Set(products.flatMap((p) => p.contents))];
    const parts = partSlugs.length ? await tx.product.findMany({ where: { slug: { in: partSlugs }, active: true } }) : [];
    const partBySlug = new Map(parts.map((p) => [p.slug, p]));
    const bundleParts = new Map<string, string[]>(); // bundle id → part ids, one entry per unit in a pack
    for (const p of products.filter((x) => x.contents.length)) {
      const ids = p.contents.map((slug) => partBySlug.get(slug)?.id);
      if (ids.some((id) => !id)) throw new OrderError(`${p.name} isn't available right now because something inside it is no longer sold. ${o.fixHint}`);
      bundleParts.set(p.id, ids as string[]);
    }
    const need = new Map<string, number>();
    const add = (id: string, n: number) => need.set(id, (need.get(id) ?? 0) + n);
    for (const p of products) {
      const q = wanted.get(p.id)!;
      add(p.id, q); // a pack's own stock works as a cap on how many packs are sold
      for (const partId of bundleParts.get(p.id) ?? []) add(partId, q);
    }
    const byId = new Map([...products, ...parts].map((p) => [p.id, p]));

    const short = [...need].filter(([id, n]) => byId.get(id)!.stock < n).map(([id]) => byId.get(id)!);
    if (short.length) {
      throw new OrderError(`Not enough stock for: ${short.map((p) => (p.stock ? `${p.name} (only ${p.stock} left)` : `${p.name} (sold out)`)).join(", ")}. ${o.fixHint}`);
    }

    const subtotal = products.reduce((s, p) => s + p.priceCents * wanted.get(p.id)!, 0);
    if (o.enforceMinOrder && subtotal < area.minOrderCents) throw new OrderError(`The minimum order is ${money(area.minOrderCents)}.`);
    const fee = deliveryFee(subtotal, area);

    // Conditional decrement guards against two orders taking the last items at the same time
    for (const [id, n] of need) {
      const res = await tx.product.updateMany({ where: { id, stock: { gte: n } }, data: { stock: { decrement: n } } });
      if (res.count !== 1) throw new OrderError(`${byId.get(id)!.name} just sold out. ${o.fixHint}`);
    }

    const c = o.customer;
    const order = await tx.order.create({
      data: {
        customerName: c.name, phone: c.phone, email: c.email, street: c.street, apartment: c.apartment,
        postcode: c.postcode, note: c.note, paymentMethod: o.paymentMethod, status: o.status ?? "NEW",
        subtotalCents: subtotal, deliveryFeeCents: fee, totalCents: subtotal + fee,
        deliveryDate: o.deliveryDate,
        items: {
          create: products.map((p) => ({
            productId: p.id, name: p.name, size: p.size, priceCents: p.priceCents, quantity: wanted.get(p.id)!,
            bundlePartIds: bundleParts.get(p.id) ?? [],
          })),
        },
      },
    });
    return order.id;
  });
}
