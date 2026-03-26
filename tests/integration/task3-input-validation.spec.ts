import { test, expect } from "@playwright/test";

test.describe("Task 3: Input Validation", () => {
  test("rejects file with spoofed MIME type but invalid magic bytes", async ({ request }) => {
    const fakeBuffer = Buffer.from("This is not a PDF file at all");

    const response = await request.post("http://localhost:3000/api/parse", {
      multipart: {
        file: {
          name: "fake.pdf",
          mimeType: "application/pdf",
          buffer: fakeBuffer,
        },
      },
    });

    if (response.status() === 429) {
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("not a valid PDF");
  });

  test("generate endpoint rejects text exceeding 100k chars", async ({ request }) => {
    const longText = "a".repeat(100001);

    const response = await request.post("http://localhost:3000/api/generate", {
      data: {
        text: longText,
        apiKey: "sk-test",
        title: "Test",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("maximum length");
  });

  test("generate endpoint rejects apiKey exceeding 200 chars", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/generate", {
      data: {
        text: "Some paper text",
        apiKey: "k".repeat(201),
        title: "Test",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("maximum length");
  });

  test("parse 500 error does not leak internal details", async ({ request }) => {
    const corruptBuffer = Buffer.from("%PDF-1.4\x00corrupt data here");

    const response = await request.post("http://localhost:3000/api/parse", {
      multipart: {
        file: {
          name: "corrupt.pdf",
          mimeType: "application/pdf",
          buffer: corruptBuffer,
        },
      },
    });

    if (response.status() === 500) {
      const body = await response.json();
      expect(body.error).not.toContain("at ");
      expect(body.error).not.toContain("Error:");
      expect(body.error).toBe("Failed to parse PDF. Please try a different file.");
    }
  });
});
