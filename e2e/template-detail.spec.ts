import { expect, test } from "@playwright/test";

test("template detail renders demo and updates compatible palette preview", async ({ page }) => {
  await page.goto("/templates/larasati");

  await expect(page.getByRole("heading", { name: "Larasati" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aruna & Bima" })).toBeVisible();
  await page.getByRole("button", { name: "Buka pilihan palet" }).click();
  await expect(page.getByRole("button", { name: /^Gading/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Terakota" })).toHaveCount(0);

  const demo = page.getByTestId("template-demo").locator(":scope > article");
  await expect(demo).toHaveCSS("background-color", "rgb(246, 240, 229)");

  await page.getByRole("button", { name: "Soga" }).click();

  await page.getByRole("button", { name: "Buka pilihan palet" }).click();
  await expect(page.getByRole("button", { name: /^Soga/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(demo).toHaveCSS("background-color", "rgb(240, 231, 217)");
});

test("unknown template detail returns not found", async ({ page }) => {
  const response = await page.goto("/templates/tidak-ada");

  expect(response?.status()).toBe(404);
});

test("keeps cover fixed on desktop and hides it on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/templates/larasati");

  await expect(page.getByTestId("preview-cover")).toBeVisible();
  await expect(page.getByTestId("invitation-scroll")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });

  await expect(page.getByTestId("preview-cover")).toBeHidden();
  await expect(page.getByTestId("invitation-frame")).toBeVisible();
});
