import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { test as setup } from "@playwright/test";

const authFile = "e2e/.auth/manager.json";
const email = process.env.E2E_EMAIL ?? "manager@branchbrew.dev";
const password = process.env.E2E_PASSWORD ?? "password123";

setup("authenticate manager", async ({ page }) => {
  mkdirSync(dirname(authFile), { recursive: true });

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(/\/(dashboard)?$/);

  await page.context().storageState({ path: authFile });
});
