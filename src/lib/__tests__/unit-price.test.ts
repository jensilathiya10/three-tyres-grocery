import { describe, expect, it } from "vitest";
import { parseSize, unitPrice } from "../unit-price";

describe("parseSize", () => {
  it.each([
    ["5 kg", 5, "kg"],
    ["500 g", 500, "g"],
    ["12 × 70 g", 840, "g"],
    ["12 x 70 g", 840, "g"],
    ["750 ml", 750, "ml"],
    ["1 kg tin", 1, "kg"],
    ["1,5 l", 1.5, "l"],
    ["20 pcs", 20, "pcs"],
    ["6 items", 6, "pcs"],
  ])("reads %s", (size, q, u) => expect(parseSize(size)).toEqual({ netQuantity: q, netUnit: u }));
  it("returns null for unknown formats", () => expect(parseSize("family pack")).toBeNull());
});

describe("unitPrice", () => {
  it("per kg from grams", () => expect(unitPrice(199, 500, "g")).toBe("€3.98 / kg"));
  it("per kg from kg", () => expect(unitPrice(1499, 5, "kg")).toBe("€3.00 / kg"));
  it("per litre from ml", () => expect(unitPrice(449, 750, "ml")).toBe("€5.99 / l"));
  it("multipacks", () => expect(unitPrice(649, 840, "g")).toBe("€7.73 / kg"));
  it("none for pieces", () => expect(unitPrice(349, 5, "pcs")).toBeNull());
  it("none without a quantity", () => expect(unitPrice(349, null, null)).toBeNull());
});
