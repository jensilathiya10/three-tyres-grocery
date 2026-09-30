export const money = (cents: number) => "€" + (cents / 100).toFixed(2);

export const orderNo = (n: number) => `IGB-${1000 + n}`;

export const savePct = (priceCents: number, wasCents: number) => Math.round((1 - priceCents / wasCents) * 100);

/** Today's date in Berlin as a UTC-midnight Date, so date-only maths ignores the server's timezone. */
function berlinToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(parts + "T00:00:00Z");
}

/** Delivery date `days` working days from today. We don't deliver on Sundays. */
export function deliveryDate(days = 1, now = new Date()) {
  const d = berlinToday(now);
  let left = Math.max(1, days);
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
