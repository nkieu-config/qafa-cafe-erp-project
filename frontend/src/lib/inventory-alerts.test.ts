import { describe, expect, it } from "vitest";
import {
  buildExpiryAlerts,
  buildLowStockAlerts,
  countExpiringBatches,
  countLowStockRecords,
  isExpiringBatch,
  isLowStockRecord,
} from "./inventory-alerts";

describe("isLowStockRecord", () => {
  it("treats out and low levels as alerts", () => {
    expect(isLowStockRecord({ stock: 0, minStock: 5 })).toBe(true);
    expect(isLowStockRecord({ stock: 3, minStock: 5 })).toBe(true);
    expect(isLowStockRecord({ stock: 6, minStock: 5 })).toBe(false);
  });
});

describe("countLowStockRecords", () => {
  it("counts all non-ok stock levels", () => {
    expect(
      countLowStockRecords([
        { id: 1, branchId: 1, ingredientId: 1, stock: 0, minStock: 5 },
        { id: 2, branchId: 1, ingredientId: 2, stock: 4, minStock: 5 },
        { id: 3, branchId: 1, ingredientId: 3, stock: 10, minStock: 5 },
      ]),
    ).toBe(2);
  });
});

describe("isExpiringBatch", () => {
  it("includes batches expiring within the warning window", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);

    expect(
      isExpiringBatch({
        expiryDate: soon.toISOString(),
        quantity: 1,
        status: "ACTIVE",
      }),
    ).toBe(true);
  });

  it("ignores batches beyond the warning window", () => {
    const later = new Date();
    later.setDate(later.getDate() + 30);

    expect(
      isExpiringBatch({
        expiryDate: later.toISOString(),
        quantity: 1,
        status: "ACTIVE",
      }),
    ).toBe(false);
  });
});

describe("countExpiringBatches", () => {
  it("counts only batches with quantity and valid status", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 1);

    expect(
      countExpiringBatches([
        {
          id: 1,
          branchId: 1,
          ingredientId: 1,
          quantity: 2,
          status: "ACTIVE",
          expiryDate: soon.toISOString(),
        },
        {
          id: 2,
          branchId: 1,
          ingredientId: 2,
          quantity: 0,
          status: "ACTIVE",
          expiryDate: soon.toISOString(),
        },
      ]),
    ).toBe(1);
  });
});

describe("buildLowStockAlerts", () => {
  it("returns worst stock levels first up to the preview limit", () => {
    const alerts = buildLowStockAlerts(
      [
        { id: 1, branchId: 1, ingredientId: 1, stock: 2, minStock: 5, ingredient: { id: 1, name: "Sugar", unit: "kg" } },
        { id: 2, branchId: 1, ingredientId: 2, stock: 0, minStock: 5, ingredient: { id: 2, name: "Milk", unit: "L" } },
        { id: 3, branchId: 1, ingredientId: 3, stock: 10, minStock: 5, ingredient: { id: 3, name: "Flour", unit: "kg" } },
      ],
      "Main",
      1,
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.ingredientName).toBe("Milk");
    expect(alerts[0]?.branchName).toBe("Main");
  });
});

describe("buildExpiryAlerts", () => {
  it("returns soonest expiry batches first", () => {
    const sooner = new Date();
    sooner.setDate(sooner.getDate() + 1);
    const later = new Date();
    later.setDate(later.getDate() + 5);

    const alerts = buildExpiryAlerts(
      [
        {
          id: 1,
          branchId: 1,
          ingredientId: 1,
          quantity: 2,
          status: "ACTIVE",
          expiryDate: later.toISOString(),
          ingredient: { id: 1, name: "Cream", unit: "L" },
        },
        {
          id: 2,
          branchId: 1,
          ingredientId: 2,
          quantity: 1,
          status: "ACTIVE",
          expiryDate: sooner.toISOString(),
          ingredient: { id: 2, name: "Butter", unit: "kg" },
        },
      ],
      "Main",
      2,
    );

    expect(alerts[0]?.ingredientName).toBe("Butter");
  });
});
