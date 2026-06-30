import { test, expect } from "@playwright/test";

test.describe("finance business flow", () => {
  test("manager demo login opens finance overview via sidebar", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Manager", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"));

    await page.getByRole("link", { name: "Finance", exact: true }).click();
    await expect(page).toHaveURL(/\/finance\/overview/);

    await expect(page.getByRole("heading", { name: /shift settlements/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /export sales/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search expenses/i)).toBeVisible();
  });
});
