// Pure postcode logic, shared by client widgets and server actions.

export type AreaRule = {
  id: string;
  name: string;
  postcodeFrom: number;
  postcodeTo: number;
  feeCents: number;
  freeOverCents: number;
  minOrderCents: number;
  estimatedDays: number;
  cutoffHour: number;
  excludedPostcodes: string[];
};

export type PostcodeResult = { ok: true; area: AreaRule } | { ok: false; message: string };

export function findArea(raw: string, areas: AreaRule[]): PostcodeResult {
  const v = raw.trim();
  if (!/^\d{5}$/.test(v)) return { ok: false, message: "Enter a 5-digit postcode, for example 10115." };
  const n = Number(v);
  const area = areas.find((a) => n >= a.postcodeFrom && n <= a.postcodeTo && !a.excludedPostcodes.includes(v));
  if (area) return { ok: true, area };
  if (areas.some((a) => a.excludedPostcodes.includes(v))) {
    return { ok: false, message: `We don't deliver to ${v}. It's outside our delivery area.` };
  }
  const ranges = areas.map((a) => `${a.postcodeFrom}–${a.postcodeTo}`).join(", ");
  return { ok: false, message: `We don't deliver to ${v} yet. We cover postcodes ${ranges}.` };
}

export const deliveryFee = (subtotalCents: number, area: AreaRule) =>
  subtotalCents >= area.freeOverCents ? 0 : area.feeCents;
