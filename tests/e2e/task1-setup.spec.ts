import { test, expect } from "@playwright/test";

test.describe("Task 1: Project Setup", () => {
  test("landing page loads with correct title and styling", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000");

    await expect(page).toHaveTitle("Paper2Notebook");

    const heading = page.getByRole("heading", { name: "Paper2Notebook" });
    await expect(heading).toBeVisible();

    const tagline = page.getByText("Transform research papers");
    await expect(tagline).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/task1-01-landing-page.png",
      fullPage: true,
    });
  });

  test("Inter font is loaded", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const fontFamily = await page.evaluate(() => {
      const body = document.querySelector("body");
      return body ? getComputedStyle(body).fontFamily : "";
    });

    expect(fontFamily).toContain("__Inter");
  });

  test("background color matches ARC Prize off-white", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const bgColor = await page.evaluate(() => {
      const body = document.querySelector("body");
      return body ? getComputedStyle(body).backgroundColor : "";
    });

    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });
});
