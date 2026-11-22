import { expect, test } from "@playwright/test";

test("renders outside the Claude app", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#page-title")).toBeVisible();
});

test("shows the About line with the app name, current year and version", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#about")).toHaveText(
    new RegExp(`^About: Habit Tracker · ${new Date().getFullYear()} · v\\d+\\.\\d+\\.\\d+$`),
  );
  await expect(page.locator(".eyebrow")).toHaveText("Habit Tracker");
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

test("a quiet 'Built with the studio harness' line sits under the footer in both modes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const line = page.locator("#built-with");
  await expect(line).toHaveText("Built with the studio harness");
  await expect(line).toHaveCSS("color", "rgb(26, 58, 107)");
  const about = await page.locator("#about").boundingBox();
  const built = await line.boundingBox();
  expect(built!.y).toBeGreaterThan(about!.y);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(line).toHaveCSS("color", "rgb(157, 184, 232)");
});

test("page heading is bold and the small label above it is not", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#page-title")).toHaveCSS("font-weight", "700");
  await expect(page.locator(".eyebrow")).toHaveCSS("font-weight", "400");
});
