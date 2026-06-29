import { inclusiveTaxAmount, parseVatRatePercent } from "./vat";

describe("vat", () => {
  it("computes inclusive VAT", () => {
    expect(inclusiveTaxAmount(107, 7)).toBeCloseTo(7);
  });

  it("parses rate from settings", () => {
    expect(parseVatRatePercent("7")).toBe(7);
    expect(parseVatRatePercent(undefined)).toBe(7);
  });
});
