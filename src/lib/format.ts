import { berlinHoliday, isoDay } from "./holidays";

export const money = (cents: number) => "€" + (cents / 100).toFixed(2);

// TTG = Three Tyres Grocery. Early orders were shown as IGB-…; admin search accepts both.
export const orderNo = (n: number) => `TTG-${1000 + n}`;

export const savePct = (priceCents: number, wasCents: number) => Math.round((1 - priceCents / wasCents) * 100);

/** Today's date in Berlin as a UTC-midnight Date, so date-only maths ignores the server's timezone. */
export function berlinToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(parts + "T00:00:00Z");
}

/** Current hour (0–23) in Berlin. */
export const berlinHour = (now = new Date()) =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", hourCycle: "h23" }).format(now));

export type DeliveryRule = {
  estimatedDays: number;
  cutoffHour: number;
  /** Extra days without delivery (the shop's own days off), as ISO dates. */
  closedDays?: readonly string[];
};
export const DEFAULT_RULE: DeliveryRule = { estimatedDays: 1, cutoffHour: 20 };

/** Why there's no delivery on this UTC-midnight date, or null if there is. */
export function noDeliveryReason(d: Date, closedDays: readonly string[] = []): string | null {
  if (d.getUTCDay() === 0) return "Sunday";
  return berlinHoliday(d) ?? (closedDays.includes(isoDay(d)) ? "Shop closed" : null);
}

/** Days in the next `days` days (from today) with no delivery, other than Sundays. */
export function upcomingDaysOff(closedDays: readonly string[] = [], days = 30, now = new Date()) {
  const today = berlinToday(now);
  const out: { date: Date; reason: string }[] = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(today.getTime() + i * 86_400_000);
    const reason = noDeliveryReason(d, closedDays);
    if (reason && reason !== "Sunday") out.push({ date: d, reason });
  }
  return out;
}

/**
 * Delivery date for an order placed `now`: `estimatedDays` delivery days later, skipping Sundays,
 * Berlin public holidays and the shop's days off. Orders at or after the cut-off hour count as placed the next day.
 */
export function deliveryDate(rule: DeliveryRule = DEFAULT_RULE, now = new Date()) {
  const d = berlinToday(now);
  if (berlinHour(now) >= rule.cutoffHour) d.setUTCDate(d.getUTCDate() + 1);
  let left = Math.max(1, rule.estimatedDays);
  // The cap only matters if someone closes the shop for months; the date is then shown as-is
  for (let guard = 0; left > 0 && guard < 120; guard++) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (!noDeliveryReason(d, rule.closedDays)) left--;
  }
  return d;
}

export const formatDay = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export const formatDateTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
