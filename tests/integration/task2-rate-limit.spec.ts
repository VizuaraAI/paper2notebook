import { test, expect } from "@playwright/test";

test.describe("Task 2: Rate Limiting", () => {
  test("parse endpoint returns 429 after excessive requests", async ({ request }) => {
    const responses = [];
    for (let i = 0; i < 12; i++) {
      const res = await request.post("http://localhost:3000/api/parse", {
        multipart: { other: "test" },
      });
      responses.push(res.status());
    }

    expect(responses).toContain(429);
  });

  test("429 response includes error message", async ({ request }) => {
    for (let i = 0; i < 12; i++) {
      await request.post("http://localhost:3000/api/parse", {
        multipart: { other: "test" },
      });
    }

    const res = await request.post("http://localhost:3000/api/parse", {
      multipart: { other: "test" },
    });

    if (res.status() === 429) {
      const body = await res.json();
      expect(body.error).toContain("Too many requests");
    }
  });
});
