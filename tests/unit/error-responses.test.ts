import { describe, it, expect } from "vitest";
import { streamNotebookGeneration, createOpenAIClient } from "@/lib/openai-client";

describe("Error response hardening", () => {
  it("openai-client catch-all yields generic error without internal details", async () => {
    const client = createOpenAIClient("sk-invalid-key-for-testing");

    const events: { type: string; data: string }[] = [];
    for await (const event of streamNotebookGeneration(client, "system", "user")) {
      events.push(event);
    }

    const errorEvents = events.filter((e) => e.type === "error");
    expect(errorEvents.length).toBeGreaterThan(0);

    for (const event of errorEvents) {
      expect(event.data).not.toMatch(/stack/i);
      expect(event.data).not.toMatch(/at\s+\w+\s+\(/);
      expect(event.data).not.toMatch(/\/Users\//);
      expect(event.data).not.toMatch(/node_modules/);
      expect(event.data).not.toMatch(/Error:/);
    }
  });

  it("openai-client error messages are one of the known safe messages", async () => {
    const client = createOpenAIClient("sk-invalid-key-for-testing");

    const safeMessages = [
      "Invalid API key. Please check your OpenAI API key.",
      "Rate limit exceeded. Please wait and try again.",
      "Connection failed. Please check your internet connection.",
      "Generation failed. Please try again.",
    ];

    const events: { type: string; data: string }[] = [];
    for await (const event of streamNotebookGeneration(client, "system", "user")) {
      events.push(event);
    }

    const errorEvents = events.filter((e) => e.type === "error");
    for (const event of errorEvents) {
      expect(safeMessages).toContain(event.data);
    }
  });
});
