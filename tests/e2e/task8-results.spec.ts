import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

const mockNotebook = {
  nbformat: 4,
  nbformat_minor: 5,
  metadata: {
    kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
    language_info: { name: "python", version: "3.10.0" },
    colab: { name: "Test_Paper.ipynb", provenance: [] },
  },
  cells: [
    { cell_type: "markdown", metadata: {}, source: ["# Test Paper\n"] },
    { cell_type: "code", metadata: {}, source: ["import numpy as np\n"], outputs: [], execution_count: 1 },
    { cell_type: "markdown", metadata: {}, source: ["## Results\n"] },
    { cell_type: "code", metadata: {}, source: ["print('done')\n"], outputs: [], execution_count: 2 },
  ],
};

async function navigateToResults(page: import("@playwright/test").Page) {
  await page.goto("http://localhost:3000");
  await page.getByTestId("api-key-input").fill("sk-test-key");
  await page.getByTestId("continue-button").click();

  const fileInput = page.getByTestId("file-input");
  await fileInput.setInputFiles(path.join(FIXTURES_DIR, "test-paper.pdf"));

  await page.route("**/api/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        text: "Paper content",
        title: "Test Paper",
        numPages: 5,
        metadata: {},
      }),
    });
  });

  await page.route("**/api/generate", async (route) => {
    const sseBody = [
      'data: {"type":"progress","message":"Analyzing..."}\n\n',
      `data: {"type":"complete","notebook":${JSON.stringify(JSON.stringify(mockNotebook))}}\n\n`,
    ].join("");

    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
      body: sseBody,
    });
  });

  await page.getByTestId("generate-button").click();
  await expect(page.getByTestId("results-view")).toBeVisible({ timeout: 10000 });
}

test.describe("Task 8: Results View", () => {
  test("shows notebook preview with cell counts", async ({ page }) => {
    await navigateToResults(page);

    const preview = page.getByTestId("notebook-preview");
    await expect(preview).toBeVisible();
    await expect(preview).toContainText("Test Paper");
    await expect(preview).toContainText("4 cells");
    await expect(preview).toContainText("2 code");
    await expect(preview).toContainText("2 markdown");

    await page.screenshot({
      path: "tests/screenshots/task8-01-results-view.png",
      fullPage: true,
    });
  });

  test("download button is visible", async ({ page }) => {
    await navigateToResults(page);
    const downloadBtn = page.getByTestId("download-button");
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toContainText("Download .ipynb");
  });

  test("new paper button resets to upload", async ({ page }) => {
    await navigateToResults(page);
    await page.getByTestId("new-paper-button").click();
    await expect(page.getByTestId("upload-step")).toBeVisible();
  });
});
