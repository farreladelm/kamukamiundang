import { expect, test } from "@playwright/test";

test("catalog filters and resets template collection", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Undango/);
  await expect(
    page.getByRole("heading", {
      name: "Dirancang untuk hari yang ingin selalu diingat.",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Modern" }).click();

  await expect(page.getByText("Larasati", { exact: true })).toBeHidden();
  await expect(page.getByText("Pesisir Senja", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Tampilkan semua template" }).click();

  await expect(page.getByText("Larasati", { exact: true })).toBeVisible();
});

test("catalog exposes preview and WhatsApp contact actions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Preview" })).toHaveAttribute(
    "href",
    "/templates/larasati",
  );
  await expect(page.getByRole("link", { name: "Pesan" })).toHaveCount(3);
});
