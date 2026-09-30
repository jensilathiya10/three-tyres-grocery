export const money = (cents: number) => "€" + (cents / 100).toFixed(2);

export const orderNo = (n: number) => `IGB-${1000 + n}`;

export const savePct = (priceCents: number, wasCents: number) => Math.round((1 - priceCents / wasCents) * 100);

/** Today's date in Berlin as a UTC-midnight Date, so date-only maths ignores the server's timezone. */
export function berlinToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(parts + "T00:00:00Z");
}

/** Current hour (0–23) in Berlin. */
export const berlinHour = (now = new Date()) =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", hourCycle: "h23" }).format(now));

export type DeliveryRule = { estimatedDays: number; cutoffHour: number };
export const DEFAULT_RULE: DeliveryRule = { estimatedDays: 1, cutoffHour: 20 };

/**
 * Delivery date for an order placed `now`: `estimatedDays` delivery days later, skipping Sundays.
 * Orders at or after the cut-off hour count as placed the next day.
 */
export function deliveryDate(rule: DeliveryRule = DEFAULT_RULE, now = new Date()) {
  const d = berlinToday(now);
  if (berlinHour(now) >= rule.cutoffHour) d.setUTCDate(d.getUTCDate() + 1);
  let left = Math.max(1, rule.estimatedDays);
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0) left--;
  }
  return d;
}

export const formatDay = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export const formatDateTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
