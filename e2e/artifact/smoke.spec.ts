import { expect, test } from "@playwright/test";

test("renders outside the Claude app", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#page-title")).toBeVisible();
});

test("shows the About line with the app name and current year", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#about")).toHaveText(
    `About: Habit Tracker · ${new Date().getFullYear()}`,
  );
});

test("page title and heading read Scratch", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Scratch");
  await expect(page.locator("#page-title")).toHaveText("Scratch");
});

test("About line is dark blue in light mode and lighter blue in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("#about")).toHaveCSS("color", "rgb(26, 58, 107)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("#about")).toHaveCSS("color", "rgb(157, 184, 232)");
});
