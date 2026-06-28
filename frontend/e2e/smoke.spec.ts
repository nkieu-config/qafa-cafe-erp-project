import { test, expect } from "@playwright/test";

/**
 * Smoke flows — require backend API + seeded credentials.
 * Set E2E_EMAIL / E2E_PASSWORD or skip in CI until fixtures exist.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const hasCredentials = Boolean(email && password);

test.describe("public routes", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("authenticated smoke", () => {
  test.skip(!hasCredentials, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated smoke tests");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard)?$/);
  });

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
