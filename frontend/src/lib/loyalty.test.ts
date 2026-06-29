import { describe, it, expect } from "vitest";
import { POINTS_PER_THB, pointsToDiscountBaht } from "./loyalty";

describe("loyalty", () => {
  it("converts points to discount baht at the configured rate", () => {
    expect(POINTS_PER_THB).toBe(10);
    expect(pointsToDiscountBaht(50)).toBe(5);
  });
});
