import { expect, test } from "@playwright/test";

test("empty state, add, limit of 5, remove, blank refused", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#empty")).toBeVisible();
  await expect(page.locator("#habit-name")).toBeEnabled();

  await page.locator("#habit-name").fill("   ");
  await page.locator("#add-button").click();
  await expect(page.locator("#habit-list li")).toHaveCount(0);
  await expect(page.locator("#add-hint")).toContainText("Type a name");

  for (const n of ["A", "B", "C", "D", "E"]) {
    await page.locator("#habit-name").fill(n);
    await page.locator("#add-button").click();
  }
  await expect(page.locator("#habit-list li")).toHaveCount(5);
  await expect(page.locator("#empty")).toBeHidden();
  await expect(page.locator("#habit-name")).toBeDisabled();
  await expect(page.locator("#add-hint")).toContainText("5");

  await page.getByRole("button", { name: "Remove C" }).click();
  await expect(page.locator("#habit-list li")).toHaveCount(4);
  await expect(page.locator("#habit-name")).toBeEnabled();
});
