import { expect, test } from "@playwright/test";

test("renders outside the Claude app", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#page-title")).toBeVisible();
});

test("shows the About line with the app name", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#about")).toHaveText("About: Habit Tracker");
});

test("page title and heading read Scratch", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Scratch");
  await expect(page.locator("#page-title")).toHaveText("Scratch");
});
