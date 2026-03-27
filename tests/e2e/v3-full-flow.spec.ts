import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");
const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots", "v3-e2e-flow");

const mockNotebook = {
  nbformat: 4,
  nbformat_minor: 5,
  metadata: {
    kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
    language_info: { name: "python", version: "3.10.0" },
    colab: { name: "Attention Paper.ipynb", provenance: [] },
  },
  cells: [
    { cell_type: "markdown", metadata: {}, source: ["# Attention Is All You Need\n", "\n", "Implementation of the Transformer architecture.\n"] },
    { cell_type: "code", metadata: {}, source: ["import numpy as np\n", "import torch\n"], outputs: [], execution_count: 1 },
    { cell_type: "markdown", metadata: {}, source: ["## Background & Theory\n", "\n", "The Transformer model relies on self-attention mechanisms.\n"] },
    { cell_type: "code", metadata: {}, source: ["def scaled_dot_product_attention(Q, K, V):\n", "    d_k = Q.shape[-1]\n", "    scores = torch.matmul(Q, K.transpose(-2, -1)) / np.sqrt(d_k)\n", "    return torch.matmul(torch.softmax(scores, dim=-1), V)\n"], outputs: [], execution_count: 2 },
    { cell_type: "code", metadata: {}, source: ["class MultiHeadAttention(torch.nn.Module):\n", "    def __init__(self, d_model, num_heads):\n", "        super().__init__()\n", "        self.num_heads = num_heads\n"], outputs: [], execution_count: 3 },
    { cell_type: "markdown", metadata: {}, source: ["## Synthetic Data\n"] },
    { cell_type: "code", metadata: {}, source: ["data = torch.randn(32, 10, 512)\n"], outputs: [], execution_count: 4 },
    { cell_type: "markdown", metadata: {}, source: ["## Results & Analysis\n"] },
    { cell_type: "code", metadata: {}, source: ["print('Training complete')\n"], outputs: [], execution_count: 5 },
    { cell_type: "markdown", metadata: {}, source: ["## Extensions & Next Steps\n"] },
  ],
};

function setupMockRoutes(page: import("@playwright/test").Page) {
  page.route("**/api/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        text: "Attention Is All You Need. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.",
        title: "Attention Is All You Need",
        numPages: 15,
        metadata: { author: "Vaswani et al." },
      }),
    });
  });

  page.route("**/api/generate", async (route) => {
    const progressMessages = [
      'data: {"type":"progress","message":"Analyzing paper structure..."}\n\n',
      'data: {"type":"progress","message":"Identifying key algorithms..."}\n\n',
      'data: {"type":"progress","message":"Generating implementation code..."}\n\n',
      `data: {"type":"complete","notebook":${JSON.stringify(JSON.stringify(mockNotebook))}}\n\n`,
    ];
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
      body: progressMessages.join(""),
    });
  });
}

test.describe("v3: Full E2E Flow with Screenshots", () => {
  test("complete user journey — API key → upload → generate → results → history → reset", async ({
    page,
  }) => {
    // Step 1: Land on page
    await page.goto("http://localhost:3000");
    await expect(page.locator("h1")).toContainText("Paper2Notebook");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-landing.png"),
      fullPage: true,
    });

    // Step 2: Enter API key
    const apiKeyInput = page.getByTestId("api-key-input");
    await expect(apiKeyInput).toBeVisible();
    await apiKeyInput.fill("sk-test-key-for-e2e-testing");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-api-key-entered.png"),
      fullPage: true,
    });

    // Step 3: Click Continue → upload step
    const continueButton = page.getByTestId("continue-button");
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
    await expect(page.getByTestId("upload-step")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-upload-step.png"),
      fullPage: true,
    });

    // Step 4: Upload test PDF
    setupMockRoutes(page);
    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "test-paper.pdf"));
    await expect(page.getByTestId("file-preview")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-file-selected.png"),
      fullPage: true,
    });

    // Step 5: Click Generate → progress
    const generateButton = page.getByTestId("generate-button");
    await expect(generateButton).toBeVisible();
    await generateButton.click();
    await expect(page.getByTestId("generating-step")).toBeVisible({ timeout: 5000 });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-generating.png"),
      fullPage: true,
    });

    // Step 6: Wait for results
    await expect(page.getByTestId("results-view")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("download-button")).toBeVisible();
    const notebookPreview = page.getByTestId("notebook-preview");
    await expect(notebookPreview).toBeVisible();
    await expect(notebookPreview).toContainText("cells");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-results.png"),
      fullPage: true,
    });

    // Step 7: Check History drawer
    const historyButton = page.getByTestId("history-button");
    await expect(historyButton).toBeVisible();
    await historyButton.click();
    const historyDrawer = page.getByTestId("history-drawer");
    await expect(historyDrawer).toBeVisible({ timeout: 3000 });
    const historyEntry = page.getByTestId("history-entry");
    await expect(historyEntry).toBeVisible();
    await expect(historyEntry).toContainText("Attention Is All You Need");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-history.png"),
      fullPage: true,
    });

    // Close history drawer by pressing Escape
    await page.keyboard.press("Escape");
    await expect(historyDrawer).not.toBeVisible({ timeout: 3000 });

    // Step 8: Reset → back to upload
    const resetButton = page.getByTestId("new-paper-button");
    await expect(resetButton).toBeVisible();
    await resetButton.click();
    await expect(page.getByTestId("upload-step")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08-reset.png"),
      fullPage: true,
    });
  });
});
