import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

test.describe.configure({ mode: "serial" });
test.describe("Task 4: PDF Parse API", () => {
  test("warm up parse route", async ({ request }) => {
    // Hit the route once to trigger compilation
    await request.post("http://localhost:3000/api/parse", {
      multipart: { other: "warmup" },
    });
  });

  test("parses a valid PDF and returns text", async ({ request }) => {
    const pdfBuffer = fs.readFileSync(
      path.join(FIXTURES_DIR, "test-paper.pdf")
    );

    const response = await request.post("http://localhost:3000/api/parse", {
      multipart: {
        file: {
          name: "test-paper.pdf",
          mimeType: "application/pdf",
          buffer: pdfBuffer,
        },
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("text");
    expect(body).toHaveProperty("title");
    expect(body).toHaveProperty("numPages");
    expect(body).toHaveProperty("metadata");
    expect(typeof body.numPages).toBe("number");
  });

  test("rejects non-PDF files", async ({ request }) => {
    const txtBuffer = fs.readFileSync(
      path.join(FIXTURES_DIR, "not-a-pdf.txt")
    );

    const response = await request.post("http://localhost:3000/api/parse", {
      multipart: {
        file: {
          name: "not-a-pdf.txt",
          mimeType: "text/plain",
          buffer: txtBuffer,
        },
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("PDF");
  });

  test("rejects request with no file", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/parse", {
      multipart: {
        other: "value",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("No PDF");
  });
});
