import { describe, expect, it } from "vitest";
import type { BomGroupRow, ProductionBOM } from "@/types/api";
import { groupProductionBoms } from "./bom";
import {
  getBomTargetIds,
  matchesBomSearch,
  productionBomHasTarget,
  summarizeProductionBoms,
} from "./bom-filters";

const bomRow: ProductionBOM = {
  id: 1,
  targetIngredientId: 10,
  rawIngredientId: 20,
  quantityNeeded: 2,
  targetIngredient: { id: 10, name: "Espresso", unit: "shot" },
  rawIngredient: { id: 20, name: "Beans", unit: "g", costPerUnit: 0.5 },
};

describe("bom", () => {
  it("groups rows by target ingredient", () => {
    const grouped = groupProductionBoms([bomRow]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].targetName).toBe("Espresso");
    expect(grouped[0].children).toHaveLength(1);
    expect(grouped[0].children[0].totalCost).toBe(1);
  });
});

describe("bom-filters", () => {
  const group: BomGroupRow = {
    id: "TARGET_1",
    targetName: "Sauce",
    targetUnit: "L",
    isGroup: true,
    children: [
      {
        id: 1,
        rawIngredientId: 2,
        rawName: "Tomato",
        rawUnit: "kg",
        quantityNeeded: 2,
        costPerUnit: 0,
        totalCost: 0,
      },
    ],
  };

  it("summarizes BOM portfolio", () => {
    const summary = summarizeProductionBoms([group]);
    expect(summary.targets).toBe(1);
    expect(summary.rawLines).toBe(1);
    expect(summary.missingCostLines).toBe(1);
  });

  it("detects whether target has a BOM", () => {
    const boms = [{ targetIngredientId: 5 }] as ProductionBOM[];
    expect(productionBomHasTarget(boms, 5)).toBe(true);
    expect(getBomTargetIds(boms).has(5)).toBe(true);
  });

  it("searches target and raw names", () => {
    expect(matchesBomSearch(group, "tomato")).toBe(true);
    expect(matchesBomSearch(group, "bread")).toBe(false);
  });
});
