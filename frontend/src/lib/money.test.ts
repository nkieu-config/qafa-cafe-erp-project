import { describe, it, expect } from "vitest";
import { toNumber, formatMoney, formatBaht } from "./money";

describe("money", () => {
  it("coerces decimal strings from API", () => {
    expect(toNumber("85.0000")).toBe(85);
    expect(toNumber(null)).toBe(0);
  });

  it("formats baht safely", () => {
    expect(formatBaht("60.5")).toBe("฿60.50");
    expect(formatMoney(1000)).toBe("1,000.00");
  });
});
