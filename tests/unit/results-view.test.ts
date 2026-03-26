import { describe, it, expect } from "vitest";

function parseNotebook(json: string): {
  cellCount: number;
  codeCells: number;
  markdownCells: number;
  error: string | null;
} {
  try {
    const notebook = JSON.parse(json);
    const cellCount = notebook.cells?.length || 0;
    const codeCells =
      notebook.cells?.filter(
        (c: { cell_type: string }) => c.cell_type === "code"
      ).length || 0;
    return {
      cellCount,
      codeCells,
      markdownCells: cellCount - codeCells,
      error: null,
    };
  } catch {
    return {
      cellCount: 0,
      codeCells: 0,
      markdownCells: 0,
      error: "Failed to parse notebook data",
    };
  }
}

describe("ResultsView parseNotebook", () => {
  it("parses valid notebook JSON correctly", () => {
    const json = JSON.stringify({
      cells: [
        { cell_type: "code", source: ["print('hello')"] },
        { cell_type: "markdown", source: ["# Title"] },
        { cell_type: "code", source: ["x = 1"] },
      ],
    });
    const result = parseNotebook(json);
    expect(result.error).toBeNull();
    expect(result.cellCount).toBe(3);
    expect(result.codeCells).toBe(2);
    expect(result.markdownCells).toBe(1);
  });

  it("handles invalid JSON gracefully without throwing", () => {
    const result = parseNotebook("this is not json{{{");
    expect(result.error).toBe("Failed to parse notebook data");
    expect(result.cellCount).toBe(0);
    expect(result.codeCells).toBe(0);
    expect(result.markdownCells).toBe(0);
  });

  it("handles truncated JSON gracefully", () => {
    const result = parseNotebook('{"cells":[{"cell_type":"code","source":["pri');
    expect(result.error).toBe("Failed to parse notebook data");
    expect(result.cellCount).toBe(0);
  });

  it("handles empty string gracefully", () => {
    const result = parseNotebook("");
    expect(result.error).toBe("Failed to parse notebook data");
  });

  it("handles JSON without cells property", () => {
    const result = parseNotebook(JSON.stringify({ nbformat: 4 }));
    expect(result.error).toBeNull();
    expect(result.cellCount).toBe(0);
  });
});
