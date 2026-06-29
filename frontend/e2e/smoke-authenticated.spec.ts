import { test, expect } from "@playwright/test";

test.describe("authenticated routes", () => {
  test("manager can open POS terminal", async ({ page }) => {
    await page.goto("/pos/terminal");
    await expect(page.getByText(/select a branch|product|cart/i).first()).toBeVisible();
  });

  test("manager can open inventory balance", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByText(/branch stock balance|select a branch/i).first()).toBeVisible();
  });

  test("legacy /users redirects to organization users", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/organization\/users/);
  });
});
