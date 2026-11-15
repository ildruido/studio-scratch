import { expect, test } from "@playwright/test";

test("empty state, add, limit of 5, remove, blank refused", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#empty")).toHaveText(
    "No habits yet. Type a name above and press Add to start.",
  );
  await expect(page.locator("#habit-name")).toBeEnabled();

  await page.locator("#habit-name").fill("   ");
  await page.locator("#add-button").click();
  await expect(page.locator("#habit-list li")).toHaveCount(0);
  await expect(page.locator("#add-hint")).toContainText("Give your habit a name first");

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

test("tick and untick today's habit", async ({ page }) => {
  await page.goto("/");
  await page.locator("#habit-name").fill("Read");
  await page.locator("#add-button").click();
  const box = page.getByRole("checkbox", { name: "Read done today" });
  await expect(box).not.toBeChecked();
  await box.check();
  await expect(box).toBeChecked();
  await expect(page.locator("#habit-list li.done")).toHaveCount(1);
  await box.uncheck();
  await expect(box).not.toBeChecked();
  await expect(page.locator("#habit-list li.done")).toHaveCount(0);
});
