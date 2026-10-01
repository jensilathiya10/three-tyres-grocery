import { describe, expect, it } from "vitest";
import { berlinHoliday, berlinHolidays, easterSunday, isoDay } from "../holidays";
import { deliveryDate, formatDay, noDeliveryReason, upcomingDaysOff } from "../format";

const day = (iso: string) => new Date(iso + "T00:00:00Z");

describe("easterSunday", () => {
  it.each([[2024, "2024-03-31"], [2025, "2025-04-20"], [2026, "2026-04-05"], [2027, "2027-03-28"], [2030, "2030-04-21"]])(
    "%i", (y, iso) => expect(isoDay(easterSunday(y))).toBe(iso),
  );
});

describe("berlinHolidays", () => {
  it("has the ten Berlin holidays of 2026", () => {
    expect([...berlinHolidays(2026).keys()].sort()).toEqual([
      "2026-01-01", "2026-03-08", "2026-04-03", "2026-04-06", "2026-05-01",
      "2026-05-14", "2026-05-25", "2026-10-03", "2026-12-25", "2026-12-26",
    ]);
  });
  it("names German Unity Day", () => expect(berlinHoliday(day("2026-10-03"))).toBe("German Unity Day"));
  it("ignores normal days", () => expect(berlinHoliday(day("2026-10-02"))).toBeNull());
});

const rule = { estimatedDays: 1, cutoffHour: 20 };
const at = (iso: string, closedDays: string[] = []) => formatDay(deliveryDate({ ...rule, closedDays }, new Date(iso)));

describe("deliveryDate with holidays and days off", () => {
  it("skips German Unity Day and the Sunday after it", () => expect(at("2026-10-02T08:00:00Z")).toBe("Monday 5 October"));
  it("skips both Christmas days", () => expect(at("2026-12-24T08:00:00Z")).toBe("Monday 28 December"));
  it("skips Good Friday, Easter Sunday and Monday", () => expect(at("2026-04-02T08:00:00Z")).toBe("Saturday 4 April"));
  it("skips the shop's own days off", () => expect(at("2026-10-06T08:00:00Z", ["2026-10-07", "2026-10-08"])).toBe("Friday 9 October"));
  it("isn't affected by days off already past", () => expect(at("2026-10-06T08:00:00Z", ["2026-10-01"])).toBe("Wednesday 7 October"));
});

describe("noDeliveryReason", () => {
  it("prefers the holiday name over a day off", () => expect(noDeliveryReason(day("2026-10-03"), ["2026-10-03"])).toBe("German Unity Day"));
  it("reports days off", () => expect(noDeliveryReason(day("2026-10-07"), ["2026-10-07"])).toBe("Shop closed"));
  it("reports Sundays", () => expect(noDeliveryReason(day("2026-10-04"))).toBe("Sunday"));
});

describe("upcomingDaysOff", () => {
  it("lists holidays and days off but not Sundays", () => {
    const list = upcomingDaysOff(["2026-10-09"], 10, new Date("2026-10-01T08:00:00Z"));
    expect(list.map((o) => [isoDay(o.date), o.reason])).toEqual([["2026-10-03", "German Unity Day"], ["2026-10-09", "Shop closed"]]);
  });
});
