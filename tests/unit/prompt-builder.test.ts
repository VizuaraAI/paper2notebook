import { describe, it, expect } from "vitest";
import { buildNotebookPrompt } from "@/lib/prompt-builder";

describe("buildNotebookPrompt", () => {
  it("returns system and user prompt pair", () => {
    const result = buildNotebookPrompt("Some paper text", "Test Paper");
    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
  });

  it("includes paper title in user prompt", () => {
    const result = buildNotebookPrompt("content", "Attention Is All You Need");
    expect(result.user).toContain("Attention Is All You Need");
  });

  it("includes paper text in user prompt", () => {
    const result = buildNotebookPrompt(
      "We propose a transformer architecture",
      "Test"
    );
    expect(result.user).toContain("We propose a transformer architecture");
  });

  it("truncates long papers at 30000 chars", () => {
    const longText = "x".repeat(35000);
    const result = buildNotebookPrompt(longText, "Long Paper");
    expect(result.user).toContain("[Paper text truncated");
    expect(result.user.length).toBeLessThan(35000);
  });

  it("system prompt specifies JSON array output format", () => {
    const result = buildNotebookPrompt("text", "title");
    expect(result.system).toContain("JSON array");
    expect(result.system).toContain("cell_type");
  });

  it("system prompt includes all required notebook sections", () => {
    const result = buildNotebookPrompt("text", "title");
    const sections = [
      "TITLE",
      "OVERVIEW",
      "ENVIRONMENT SETUP",
      "IMPORTS",
      "BACKGROUND",
      "CORE ALGORITHM",
      "SYNTHETIC DATA",
      "EXPERIMENTS",
      "ANALYSIS",
      "EXTENSIONS",
    ];
    for (const section of sections) {
      expect(result.system).toContain(section);
    }
  });
});
