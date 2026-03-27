/**
 * ============================================================
 *  REAL QUALITY VALIDATION TEST — "Attention Is All You Need"
 * ============================================================
 *
 * This test opens a VISIBLE browser and generates a REAL notebook
 * using your actual OpenAI API key. It validates the output quality.
 *
 * HOW TO RUN:
 *   1. Make sure the dev server is running: npm run dev
 *   2. Run: npx playwright test tests/e2e/v3-real-quality.spec.ts --project=real
 *   3. When the browser opens, you will see a dialog asking for your OpenAI API key
 *   4. Enter your key and click OK
 *   5. The test will upload the paper, generate, and validate the notebook
 *   6. Watch the terminal for the validation report
 *   7. Screenshots saved to tests/screenshots/v3-real-quality/
 *
 * This test is SKIPPED in CI (only runs with --project=real).
 * Expected duration: 2-5 minutes depending on OpenAI response time.
 */

import { test, expect, type Page, type Download } from "@playwright/test";
import path from "path";
import fs from "fs";

const PAPER_PDF = path.resolve(
  __dirname,
  "..",
  "..",
  "NIPS-2017-attention-is-all-you-need-Paper (1).pdf"
);
const SCREENSHOTS_DIR = path.join(
  __dirname,
  "..",
  "screenshots",
  "v3-real-quality"
);

// ── Validation helpers ──────────────────────────────────────

interface ValidationResult {
  check: string;
  passed: boolean;
  detail: string;
}

function validateNotebook(notebookJson: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // (a) Valid JSON
  let notebook: Record<string, unknown>;
  try {
    notebook = JSON.parse(notebookJson);
    results.push({
      check: "Valid JSON",
      passed: true,
      detail: "JSON.parse succeeded",
    });
  } catch (e) {
    results.push({
      check: "Valid JSON",
      passed: false,
      detail: `JSON.parse failed: ${e}`,
    });
    return results; // Can't continue without valid JSON
  }

  // (b) Has cells array with ≥8 entries
  const cells = notebook.cells as Array<Record<string, unknown>>;
  const hasCells = Array.isArray(cells);
  const cellCount = hasCells ? cells.length : 0;
  results.push({
    check: "≥8 cells",
    passed: hasCells && cellCount >= 8,
    detail: `Found ${cellCount} cells`,
  });

  if (!hasCells) return results;

  // (c) ≥3 code cells and ≥3 markdown cells
  const codeCells = cells.filter(
    (c) => c.cell_type === "code"
  );
  const markdownCells = cells.filter(
    (c) => c.cell_type === "markdown"
  );
  results.push({
    check: "≥3 code cells",
    passed: codeCells.length >= 3,
    detail: `Found ${codeCells.length} code cells`,
  });
  results.push({
    check: "≥3 markdown cells",
    passed: markdownCells.length >= 3,
    detail: `Found ${markdownCells.length} markdown cells`,
  });

  // (d) Code cells contain valid Python (check for basic syntax patterns)
  const allCode = codeCells
    .map((c) => {
      const src = c.source;
      return Array.isArray(src) ? (src as string[]).join("") : String(src);
    })
    .join("\n");
  const hasPythonPatterns =
    /(?:import |def |class |print\(|for |if |return )/.test(allCode);
  results.push({
    check: "Contains valid Python patterns",
    passed: hasPythonPatterns,
    detail: hasPythonPatterns
      ? "Found import/def/class/print/for/if/return statements"
      : "No recognizable Python patterns found",
  });

  // (e) At least one cell mentions "attention" or "transformer"
  const allText = cells
    .map((c) => {
      const src = c.source;
      return Array.isArray(src) ? (src as string[]).join("") : String(src);
    })
    .join("\n")
    .toLowerCase();
  const mentionsAttention =
    allText.includes("attention") || allText.includes("transformer");
  results.push({
    check: 'Mentions "attention" or "transformer"',
    passed: mentionsAttention,
    detail: mentionsAttention
      ? "Paper topic referenced in notebook content"
      : 'No mention of "attention" or "transformer" found',
  });

  // (f) No dangerous patterns
  const dangerousPatterns = [
    /os\.system\s*\(/,
    /subprocess\.\w+\s*\(/,
    /(?:^|[\s=,(])eval\s*\(/m,
    /(?:^|[\s=,(])exec\s*\(/m,
    /__import__\s*\(/,
    /shutil\.rmtree\s*\(/,
  ];
  const foundDangerous = dangerousPatterns.filter((p) => p.test(allCode));
  results.push({
    check: "No dangerous code patterns",
    passed: foundDangerous.length === 0,
    detail:
      foundDangerous.length === 0
        ? "No os.system/subprocess/eval/exec/__import__/shutil.rmtree found"
        : `Found ${foundDangerous.length} dangerous pattern(s)`,
  });

  // (g) Has a markdown cell with paper title or citation
  const hasTitle = allText.includes("attention is all you need");
  results.push({
    check: "Has paper title/citation",
    passed: hasTitle,
    detail: hasTitle
      ? 'Found "Attention Is All You Need" in notebook'
      : "Paper title not found in any cell",
  });

  return results;
}

function printReport(results: ValidationResult[]) {
  console.log("\n" + "=".repeat(60));
  console.log("  NOTEBOOK QUALITY VALIDATION REPORT");
  console.log("  Paper: Attention Is All You Need (2017)");
  console.log("=".repeat(60) + "\n");

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.passed ? "PASS" : "FAIL";
    const color = r.passed ? "\x1b[32m" : "\x1b[31m";
    console.log(`  ${color}[${icon}]\x1b[0m ${r.check}`);
    console.log(`        ${r.detail}`);
    if (r.passed) passed++;
    else failed++;
  }

  console.log("\n" + "-".repeat(60));
  console.log(
    `  TOTAL: ${passed + failed} checks — ${passed} passed, ${failed} failed`
  );
  if (failed === 0) {
    console.log("  \x1b[32mALL CHECKS PASSED\x1b[0m");
  } else {
    console.log(`  \x1b[31m${failed} CHECK(S) FAILED\x1b[0m`);
  }
  console.log("=".repeat(60) + "\n");
}

// ── Test ──────────────────────────────────────────────────────

test.describe("Real Quality Test — Attention Is All You Need", () => {
  test("generate and validate notebook from real paper with live OpenAI", async ({
    page,
    context,
  }) => {
    // Increase timeout for real API call (5 minutes)
    test.setTimeout(300_000);

    // Step 1: Navigate to app
    await page.goto("http://localhost:3000");
    await expect(page.locator("h1")).toContainText("Paper2Notebook");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-landing.png"),
      fullPage: true,
    });
    console.log("\n  [Step 1] Landed on Paper2Notebook");

    // Step 2: Prompt user for API key via browser dialog
    const apiKey = await new Promise<string>((resolve) => {
      page.once("dialog", async (dialog) => {
        // This shouldn't fire — we're using page.evaluate to prompt
      });

      // Use window.prompt to get the API key from the user
      page
        .evaluate(() => {
          return window.prompt(
            "Enter your OpenAI API key (starts with sk-):"
          );
        })
        .then((key) => {
          resolve(key || "");
        });
    });

    if (!apiKey || !apiKey.startsWith("sk-")) {
      console.log(
        "\n  [ABORT] No valid API key provided. Key must start with 'sk-'."
      );
      console.log("  Skipping real quality test.\n");
      test.skip();
      return;
    }

    // Type the API key
    const apiKeyInput = page.getByTestId("api-key-input");
    await apiKeyInput.fill(apiKey);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-api-key-entered.png"),
      fullPage: true,
    });
    console.log("  [Step 2] API key entered");

    // Step 3: Click Continue
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("upload-step")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-upload-step.png"),
      fullPage: true,
    });
    console.log("  [Step 3] Upload step visible");

    // Step 4: Upload the real paper PDF
    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(PAPER_PDF);
    await expect(page.getByTestId("file-preview")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-file-selected.png"),
      fullPage: true,
    });
    console.log("  [Step 4] Paper uploaded: Attention Is All You Need");

    // Step 5: Click Generate and wait for progress
    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("generating-step")).toBeVisible({
      timeout: 10_000,
    });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-generating.png"),
      fullPage: true,
    });
    console.log("  [Step 5] Generation started — waiting for completion...");

    // Step 6: Wait for results (up to 5 minutes)
    const resultsLocator = page.getByTestId("results-view");
    const errorLocator = page.getByTestId("retry-button");

    // Poll for either results or error
    await expect(resultsLocator.or(errorLocator)).toBeVisible({
      timeout: 300_000,
    });

    if (await errorLocator.isVisible()) {
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, "06-error.png"),
        fullPage: true,
      });
      console.log("\n  [ERROR] Generation failed. See screenshot 06-error.png");
      // Still pass the test but note the failure
      expect(false, "Generation failed — check OpenAI API key and quota").toBe(
        true
      );
      return;
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-results.png"),
      fullPage: true,
    });
    console.log("  [Step 6] Notebook generated successfully!");

    // Step 7: Intercept the download to validate notebook content
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("download-button").click(),
    ]);

    const downloadPath = path.join(SCREENSHOTS_DIR, "generated-notebook.ipynb");
    await download.saveAs(downloadPath);
    console.log(`  [Step 7] Notebook downloaded to ${downloadPath}`);

    const notebookJson = fs.readFileSync(downloadPath, "utf-8");

    // Step 8: Validate the notebook
    const results = validateNotebook(notebookJson);
    printReport(results);

    // Take final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-final.png"),
      fullPage: true,
    });

    // Save the validation report to a file
    const reportLines = results.map(
      (r) => `[${r.passed ? "PASS" : "FAIL"}] ${r.check}: ${r.detail}`
    );
    const passCount = results.filter((r) => r.passed).length;
    reportLines.push(
      "",
      `TOTAL: ${results.length} checks — ${passCount} passed, ${results.length - passCount} failed`
    );
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, "validation-report.txt"),
      reportLines.join("\n")
    );

    // Assert all checks passed
    const failedChecks = results.filter((r) => !r.passed);
    expect(
      failedChecks.length,
      `Failed checks: ${failedChecks.map((r) => r.check).join(", ")}`
    ).toBe(0);
  });
});
