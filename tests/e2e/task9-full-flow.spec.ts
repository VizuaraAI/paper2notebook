import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

const mockNotebook = {
  nbformat: 4,
  nbformat_minor: 5,
  metadata: {
    kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
    language_info: { name: "python", version: "3.10.0" },
    colab: { name: "Test.ipynb", provenance: [] },
  },
  cells: [
    { cell_type: "markdown", metadata: {}, source: ["# Test\n"] },
    { cell_type: "code", metadata: {}, source: ["print('hi')\n"], outputs: [], execution_count: 1 },
  ],
};

function setupMockRoutes(page: import("@playwright/test").Page) {
  page.route("**/api/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        text: "Paper content",
        title: "Test Paper",
        numPages: 3,
        metadata: {},
      }),
    });
  });

  page.route("**/api/generate", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
      body: [
        'data: {"type":"progress","message":"Analyzing..."}\n\n',
        `data: {"type":"complete","notebook":${JSON.stringify(JSON.stringify(mockNotebook))}}\n\n`,
      ].join(""),
    });
  });
}

test.describe("Task 9: Full E2E Flow", () => {
  test("complete journey: api key → upload → progress → results → reset", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000");

    // Step 1: API key
    await page.getByTestId("api-key-input").fill("sk-test-key-12345");
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("upload-step")).toBeVisible();

    // Step 2: Upload
    setupMockRoutes(page);
    await page.getByTestId("file-input").setInputFiles(
      path.join(FIXTURES_DIR, "test-paper.pdf")
    );
    await page.getByTestId("generate-button").click();

    // Step 3: Results
    await expect(page.getByTestId("results-view")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("download-button")).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/task9-01-full-flow.png",
      fullPage: true,
    });

    // Step 4: Reset
    await page.getByTestId("new-paper-button").click();
    await expect(page.getByTestId("upload-step")).toBeVisible();
  });

  test("shows error when parse fails and allows retry", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.getByTestId("api-key-input").fill("sk-test");
    await page.getByTestId("continue-button").click();

    await page.route("**/api/parse", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error: "Could not extract text from PDF." }),
      });
    });

    await page.getByTestId("file-input").setInputFiles(
      path.join(FIXTURES_DIR, "test-paper.pdf")
    );
    await page.getByTestId("generate-button").click();

    const error = page.getByTestId("parse-error");
    await expect(error).toBeVisible({ timeout: 10000 });
    await expect(error).toContainText("Could not extract text");

    await page.screenshot({
      path: "tests/screenshots/task9-02-parse-error.png",
      fullPage: true,
    });
  });

  test("shows error when generation fails with retry button", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.getByTestId("api-key-input").fill("sk-invalid");
    await page.getByTestId("continue-button").click();

    await page.route("**/api/parse", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ text: "content", title: "Paper", numPages: 1, metadata: {} }),
      });
    });

    await page.route("**/api/generate", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: 'data: {"type":"progress","message":"Analyzing..."}\n\ndata: {"type":"error","message":"Invalid API key."}\n\n',
      });
    });

    await page.getByTestId("file-input").setInputFiles(
      path.join(FIXTURES_DIR, "test-paper.pdf")
    );
    await page.getByTestId("generate-button").click();

    const retryBtn = page.getByTestId("retry-button");
    await expect(retryBtn).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: "tests/screenshots/task9-03-generation-error.png",
      fullPage: true,
    });
  });
});
