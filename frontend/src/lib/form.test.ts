import { describe, it, expect } from "vitest";
import { updateLineItem, filterActive } from "./form";

describe("form helpers", () => {
  it("updateLineItem immutably updates one field", () => {
    const items = [{ ingredientId: 0, quantity: 1, reason: "" }];
    const next = updateLineItem(items, 0, "quantity", 5);
    expect(next[0].quantity).toBe(5);
    expect(items[0].quantity).toBe(1);
  });

  it("filterActive excludes isActive === false", () => {
    const items = [
      { id: 1, isActive: true },
      { id: 2, isActive: false },
      { id: 3 },
    ];
    expect(filterActive(items).map((i) => i.id)).toEqual([1, 3]);
  });
});
