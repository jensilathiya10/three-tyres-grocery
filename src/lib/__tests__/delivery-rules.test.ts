import { describe, expect, it } from "vitest";
import { deliveryDate, formatDay } from "../format";
import { deliveryFee, findArea, type AreaRule } from "../postcode";

const rule = { estimatedDays: 1, cutoffHour: 20 };
const at = (iso: string) => formatDay(deliveryDate(rule, new Date(iso)));

describe("deliveryDate", () => {
  it("delivers next day before the cut-off", () => expect(at("2026-09-30T17:59:00Z")).toBe("Thursday 1 October"));
  it("moves a day at the cut-off hour", () => expect(at("2026-09-30T18:00:00Z")).toBe("Friday 2 October"));
  it("skips Sundays", () => expect(at("2026-10-03T08:00:00Z")).toBe("Monday 5 October"));
  it("skips Sunday after a Saturday cut-off", () => expect(at("2026-10-03T19:00:00Z")).toBe("Monday 5 October"));
  it("handles orders placed on Sunday", () => expect(at("2026-10-04T08:00:00Z")).toBe("Monday 5 October"));
  it("uses Berlin's date just after midnight", () => expect(at("2026-09-30T22:30:00Z")).toBe("Friday 2 October"));
  it("uses winter time (UTC+1) correctly", () => {
    expect(at("2026-12-01T18:30:00Z")).toBe("Wednesday 2 December");
    expect(at("2026-12-01T19:30:00Z")).toBe("Thursday 3 December");
  });
});

const berlin: AreaRule = {
  id: "a", name: "Berlin", postcodeFrom: 10115, postcodeTo: 14199, feeCents: 399, freeOverCents: 4900,
  minOrderCents: 2000, estimatedDays: 1, cutoffHour: 20, excludedPostcodes: ["12529"],
};

describe("findArea", () => {
  it("accepts a postcode in range", () => expect(findArea("10115", [berlin]).ok).toBe(true));
  it("rejects an excluded postcode with a clear message", () => {
    const r = findArea("12529", [berlin]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/outside our delivery area/);
  });
  it("rejects a postcode outside the range", () => expect(findArea("20095", [berlin]).ok).toBe(false));
  it("rejects malformed input", () => {
    expect(findArea("1011", [berlin]).ok).toBe(false);
    expect(findArea("abcde", [berlin]).ok).toBe(false);
  });
  it("ignores surrounding spaces", () => expect(findArea(" 10115 ", [berlin]).ok).toBe(true));
});

describe("deliveryFee", () => {
  it("charges below the free-delivery threshold", () => expect(deliveryFee(4899, berlin)).toBe(399));
  it("is free at the threshold", () => expect(deliveryFee(4900, berlin)).toBe(0));
});
