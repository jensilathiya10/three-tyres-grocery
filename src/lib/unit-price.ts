// Unit prices (Grundpreis) as required by § 4 PAngV: price per 1 kg or 1 litre.

export type NetUnit = "g" | "kg" | "ml" | "l" | "pcs";
export const NET_UNITS: NetUnit[] = ["g", "kg", "ml", "l", "pcs"];

/**
 * Reads a pack size label like "5 kg", "500 g", "12 × 70 g", "750 ml", "1 kg tin" or "20 pcs".
 * Returns null when it can't tell.
 */
export function parseSize(size: string): { netQuantity: number; netUnit: NetUnit } | null {
  const s = size.toLowerCase().replace(",", ".").trim();
  const multi = s.match(/^(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/);
  if (multi) return { netQuantity: Number(multi[1]) * Number(multi[2]), netUnit: multi[3] as NetUnit };
  const single = s.match(/^(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/);
  if (single) return { netQuantity: Number(single[1]), netUnit: single[2] as NetUnit };
  const pieces = s.match(/^(\d+)\s*(pcs|pieces|pc|items|stück)\b/);
  if (pieces) return { netQuantity: Number(pieces[1]), netUnit: "pcs" };
  return null;
}

/** "€3.00 / kg", or null for items sold by the piece or without a net quantity. */
export function unitPrice(priceCents: number, netQuantity: number | null | undefined, netUnit: string | null | undefined) {
  if (!netQuantity || netQuantity <= 0 || !netUnit) return null;
  const base = netUnit === "g" ? netQuantity / 1000 : netUnit === "ml" ? netQuantity / 1000 : netUnit === "kg" || netUnit === "l" ? netQuantity : null;
  if (!base) return null;
  const per = netUnit === "g" || netUnit === "kg" ? "kg" : "l";
  const cents = Math.round(priceCents / base);
  return `€${(cents / 100).toFixed(2)} / ${per}`;
}
