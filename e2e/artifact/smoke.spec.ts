import { expect, test } from "@playwright/test";
import { fakeClaude } from "./fake-claude";

test("renders outside the Claude app and says the AI is not available", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#page-title")).toBeVisible();
  await expect(page.locator("#status")).toContainText("not available");
});

test("with the runtime present, the AI is ready", async ({ page }) => {
  await fakeClaude(page);
  await page.goto("/");
  await expect(page.locator("#status")).toContainText("ready");
});
