import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

test.describe("Task 7: Generation Progress UI", () => {
  test("shows progress component with spinner after clicking Generate", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000");

    await page.getByTestId("api-key-input").fill("sk-test-key");
    await page.getByTestId("continue-button").click();

    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(
      path.join(FIXTURES_DIR, "test-paper.pdf")
    );

    await page.route("**/api/parse", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          text: "Test paper content about algorithms",
          title: "Test Paper",
          numPages: 5,
          metadata: {},
        }),
      });
    });

    await page.route("**/api/generate", async (route) => {
      const sseBody = [
        'data: {"type":"progress","message":"Analyzing paper structure..."}\n\n',
        'data: {"type":"progress","message":"Identifying key algorithms..."}\n\n',
      ].join("");

      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: sseBody,
      });
    });

    await page.getByTestId("generate-button").click();

    const progress = page.getByTestId("generation-progress");
    await expect(progress).toBeVisible({ timeout: 10000 });

    const spinner = page.getByTestId("progress-spinner");
    await expect(spinner).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/task7-01-progress-ui.png",
      fullPage: true,
    });
  });
});
