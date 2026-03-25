import { describe, it, expect } from "vitest";
import { assembleNotebook } from "@/lib/notebook-assembler";

describe("assembleNotebook", () => {
  const validCells = JSON.stringify([
    { cell_type: "markdown", source: ["# Test Paper\n", "Abstract here"] },
    { cell_type: "code", source: ["import numpy as np\n", "print('hello')"] },
  ]);

  it("assembles valid JSON into notebook structure", () => {
    const nb = assembleNotebook(validCells, "Test Paper");
    expect(nb.nbformat).toBe(4);
    expect(nb.cells).toHaveLength(2);
    expect(nb.cells[0].cell_type).toBe("markdown");
    expect(nb.cells[1].cell_type).toBe("code");
  });

  it("sets colab name from paper title", () => {
    const nb = assembleNotebook(validCells, "My Paper");
    expect(nb.metadata.colab?.name).toBe("My Paper.ipynb");
  });

  it("code cells have outputs and execution_count", () => {
    const nb = assembleNotebook(validCells, "Test");
    expect(nb.cells[1].outputs).toEqual([]);
    expect(nb.cells[1].execution_count).toBe(2);
  });

  it("markdown cells do not have outputs", () => {
    const nb = assembleNotebook(validCells, "Test");
    expect(nb.cells[0].outputs).toBeUndefined();
  });

  it("handles JSON wrapped in markdown fences", () => {
    const wrapped = "```json\n" + validCells + "\n```";
    const nb = assembleNotebook(wrapped, "Test");
    expect(nb.cells).toHaveLength(2);
  });

  it("handles source as string instead of array", () => {
    const cells = JSON.stringify([
      { cell_type: "markdown", source: "# Hello\nWorld" },
    ]);
    const nb = assembleNotebook(cells, "Test");
    expect(nb.cells[0].source).toEqual(["# Hello\n", "World"]);
  });

  it("throws on invalid JSON", () => {
    expect(() => assembleNotebook("not json", "Test")).toThrow();
  });

  it("throws on non-array JSON", () => {
    expect(() => assembleNotebook('{"key": "value"}', "Test")).toThrow(
      "Expected JSON array"
    );
  });
});
