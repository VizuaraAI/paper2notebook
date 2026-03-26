import { test, expect } from "@playwright/test";

test.describe("Generation History", () => {
  test("history button is visible on page load", async ({ page }) => {
    await page.goto("/");
    await page.screenshot({
      path: "tests/screenshots/task8-01-history-button.png",
    });
    const historyButton = page.getByTestId("history-button");
    await expect(historyButton).toBeVisible();
    await expect(historyButton).toContainText("History");
  });

  test("history drawer opens and shows empty state", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("history-button").click();
    await page.screenshot({
      path: "tests/screenshots/task8-02-history-drawer-empty.png",
    });
    const drawer = page.getByTestId("history-drawer");
    await expect(drawer).toBeVisible();
    const emptyMessage = page.getByTestId("history-empty");
    await expect(emptyMessage).toContainText("No notebooks generated yet");
  });
});
