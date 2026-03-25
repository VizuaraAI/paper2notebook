import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

test.beforeAll(() => {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  if (!fs.existsSync(path.join(FIXTURES_DIR, "not-a-pdf.txt"))) {
    fs.writeFileSync(path.join(FIXTURES_DIR, "not-a-pdf.txt"), "hello world");
  }
});

async function navigateToUploadStep(page: import("@playwright/test").Page) {
  await page.goto("http://localhost:3000");
  await page.getByTestId("api-key-input").fill("sk-test-key");
  await page.getByTestId("continue-button").click();
  await expect(page.getByTestId("upload-step")).toBeVisible();
}

test.describe("Task 3: PDF Upload", () => {
  test("shows drop zone on upload step", async ({ page }) => {
    await navigateToUploadStep(page);

    const dropZone = page.getByTestId("drop-zone");
    await expect(dropZone).toBeVisible();
    await expect(page.getByText("Drop your research paper here")).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/task3-01-upload-form.png",
      fullPage: true,
    });
  });

  test("accepts PDF file via file input", async ({ page }) => {
    await navigateToUploadStep(page);

    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "test-paper.pdf"));

    await expect(page.getByTestId("file-preview")).toBeVisible();
    await expect(page.getByText("test-paper.pdf")).toBeVisible();
    await expect(page.getByTestId("generate-button")).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/task3-02-file-selected.png",
      fullPage: true,
    });
  });

  test("can clear selected file", async ({ page }) => {
    await navigateToUploadStep(page);

    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "test-paper.pdf"));
    await expect(page.getByTestId("file-preview")).toBeVisible();

    await page.getByTestId("clear-file").click();
    await expect(page.getByTestId("drop-zone")).toBeVisible();
  });

  test("clicking generate transitions to generating step", async ({ page }) => {
    await navigateToUploadStep(page);

    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "test-paper.pdf"));

    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("generating-step")).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/task3-03-generating.png",
      fullPage: true,
    });
  });
});
