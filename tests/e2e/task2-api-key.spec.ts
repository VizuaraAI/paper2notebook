import { test, expect } from "@playwright/test";

test.describe("Task 2: API Key Input", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("shows API key input on landing page", async ({ page }) => {
    const input = page.getByTestId("api-key-input");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "password");

    const continueBtn = page.getByTestId("continue-button");
    await expect(continueBtn).toBeDisabled();

    await page.screenshot({
      path: "tests/screenshots/task2-01-api-key-form.png",
      fullPage: true,
    });
  });

  test("toggle password visibility", async ({ page }) => {
    const input = page.getByTestId("api-key-input");
    const toggle = page.getByTestId("toggle-visibility");

    await expect(input).toHaveAttribute("type", "password");
    await toggle.click();
    await expect(input).toHaveAttribute("type", "text");
    await toggle.click();
    await expect(input).toHaveAttribute("type", "password");
  });

  test("continue button enables when key entered", async ({ page }) => {
    const input = page.getByTestId("api-key-input");
    const continueBtn = page.getByTestId("continue-button");

    await expect(continueBtn).toBeDisabled();
    await input.fill("sk-test-key-12345");
    await expect(continueBtn).toBeEnabled();

    await page.screenshot({
      path: "tests/screenshots/task2-02-key-entered.png",
      fullPage: true,
    });
  });

  test("clicking continue transitions to upload step", async ({ page }) => {
    const input = page.getByTestId("api-key-input");
    const continueBtn = page.getByTestId("continue-button");

    await input.fill("sk-test-key-12345");
    await continueBtn.click();

    const uploadStep = page.getByTestId("upload-step");
    await expect(uploadStep).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/task2-03-after-continue.png",
      fullPage: true,
    });
  });
});
