import { describe, expect, it } from "vitest";
import type { Ingredient, Product, RecipeItem } from "@/types/api";
import { calcProductFoodCost, foodCostStatus } from "./food-cost";
import {
  matchesFoodCostStatusFilter,
  productFoodCostBucket,
  productHasMissingIngredientCost,
  summarizeFoodCost,
} from "./food-cost-filters";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Latte",
    price: 100,
    category: "Coffee",
    isActive: true,
    recipeItems: [
      {
        id: 1,
        productId: 1,
        ingredientId: 1,
        quantity: 10,
        ingredient: { id: 1, name: "Milk", unit: "ml", costPerUnit: 0.1 },
      },
    ],
    ...overrides,
  };
}

describe("food-cost", () => {
  it("computes food cost percent from recipe", () => {
    const latte = {
      id: 1,
      name: "Latte",
      price: 85,
      category: "Coffee",
      recipeItems: [
        {
          id: 1,
          productId: 1,
          ingredientId: 1,
          quantity: 18,
          ingredient: { id: 1, name: "Beans", unit: "g", costPerUnit: 0.5 },
        },
        {
          id: 2,
          productId: 1,
          ingredientId: 2,
          quantity: 150,
          ingredient: { id: 2, name: "Milk", unit: "ml", costPerUnit: 0.05 },
        },
      ] as (RecipeItem & { ingredient: Ingredient })[],
    } satisfies Product & { recipeItems: (RecipeItem & { ingredient: Ingredient })[] };

    const { foodCostPercent } = calcProductFoodCost(latte);
    expect(foodCostPercent).toBeGreaterThan(0);
    expect(foodCostPercent).toBeLessThan(100);
    expect(foodCostStatus(25)).toBe("good");
    expect(foodCostStatus(35)).toBe("warn");
    expect(foodCostStatus(45)).toBe("bad");
  });
});

describe("food-cost-filters", () => {
  it("classifies food cost buckets", () => {
    expect(productFoodCostBucket(product({ recipeItems: [] }))).toBe("no-recipe");
    expect(productFoodCostBucket(product({ price: 0 }))).toBe("no-price");
    expect(productFoodCostBucket(product({ price: 100, recipeItems: [] }))).toBe("no-recipe");
  });

  it("detects missing ingredient cost", () => {
    expect(
      productHasMissingIngredientCost(
        product({
          recipeItems: [
            {
              id: 1,
              productId: 1,
              ingredientId: 1,
              quantity: 10,
              ingredient: { id: 1, name: "Milk", unit: "ml", costPerUnit: 0 },
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("filters by status", () => {
    const highCost = product({
      price: 10,
      recipeItems: [
        {
          id: 1,
          productId: 1,
          ingredientId: 1,
          quantity: 10,
          ingredient: { id: 1, name: "Milk", unit: "ml", costPerUnit: 1 },
        },
      ],
    });
    expect(matchesFoodCostStatusFilter(highCost, "bad")).toBe(true);
    expect(matchesFoodCostStatusFilter(highCost, "good")).toBe(false);
  });

  it("summarizes portfolio metrics", () => {
    const summary = summarizeFoodCost([
      product(),
      product({ id: 2, name: "Tea", recipeItems: [] }),
    ]);
    expect(summary.total).toBe(2);
    expect(summary.noRecipe).toBe(1);
  });
});
