import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  projects: [
    {
      name: "default",
      testIgnore: "**/v3-real-quality.spec.ts",
    },
    {
      name: "real",
      testMatch: "**/v3-real-quality.spec.ts",
      use: {
        headless: false,
        launchOptions: {
          slowMo: 500,
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60000,
    stdout: "ignore",
    stderr: "ignore",
  },
});
