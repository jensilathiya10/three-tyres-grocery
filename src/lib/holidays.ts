// Berlin public holidays, worked out per year so nobody has to type them in.
// Pure code: used by the client widgets as well as the server.

/** Easter Sunday (Gregorian), as a UTC-midnight Date. Anonymous Gregorian algorithm. */
export function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const cache = new Map<number, Map<string, string>>();

/** Berlin's public holidays for a year: ISO date → name. */
export function berlinHolidays(year: number): Map<string, string> {
  const hit = cache.get(year);
  if (hit) return hit;
  const easter = easterSunday(year);
  const fromEaster = (days: number) => isoDay(new Date(easter.getTime() + days * 86_400_000));
  const fixed = (m: number, d: number) => `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const list: [string, string][] = [
    [fixed(1, 1), "New Year's Day"],
    [fixed(3, 8), "International Women's Day"],
    [fromEaster(-2), "Good Friday"],
    [fromEaster(1), "Easter Monday"],
    [fixed(5, 1), "Labour Day"],
    [fromEaster(39), "Ascension Day"],
    [fromEaster(50), "Whit Monday"],
    [fixed(10, 3), "German Unity Day"],
    [fixed(12, 25), "Christmas Day"],
    [fixed(12, 26), "Second Day of Christmas"],
  ];
  const map = new Map(list);
  cache.set(year, map);
  return map;
}

/** Name of the Berlin public holiday on this UTC-midnight date, or null. */
export const berlinHoliday = (d: Date) => berlinHolidays(d.getUTCFullYear()).get(isoDay(d)) ?? null;
