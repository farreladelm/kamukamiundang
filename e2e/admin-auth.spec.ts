import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./admin-fixture";

test("unauthenticated admin access redirects to login", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/auth\/admin$/);
  await expect(page.getByRole("heading", { name: "Masuk dashboard" })).toBeVisible();
});

test("admin can log in, access dashboard, and log out", async ({ page }) => {
  await page.goto("/auth/admin");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Kata sandi").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();

  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/auth\/admin$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth\/admin$/);
});
