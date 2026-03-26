import { test, expect } from "@playwright/test";

test.describe("Task 1: Security Headers", () => {
  test("response includes X-Content-Type-Options: nosniff", async ({ request }) => {
    const response = await request.get("http://localhost:3000");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("response includes X-Frame-Options: DENY", async ({ request }) => {
    const response = await request.get("http://localhost:3000");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  });

  test("response includes Referrer-Policy", async ({ request }) => {
    const response = await request.get("http://localhost:3000");
    expect(response.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  test("response includes Permissions-Policy", async ({ request }) => {
    const response = await request.get("http://localhost:3000");
    const policy = response.headers()["permissions-policy"];
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
  });
});
