import { createEmptyNotebook, type Notebook, type NotebookCell } from "./notebook-types";

interface RawCell {
  cell_type: "markdown" | "code";
  source: string[] | string;
}

export function assembleNotebook(
  rawContent: string,
  paperTitle: string
): Notebook {
  const notebook = createEmptyNotebook(`${paperTitle}.ipynb`);

  let jsonStr = rawContent.trim();

  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed: RawCell[] = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array of cells");
  }

  notebook.cells = parsed.map((cell, index): NotebookCell => {
    const source = Array.isArray(cell.source)
      ? cell.source
      : cell.source.split("\n").map((line, i, arr) =>
          i < arr.length - 1 ? line + "\n" : line
        );

    return {
      cell_type: cell.cell_type === "code" ? "code" : "markdown",
      metadata: {},
      source,
      ...(cell.cell_type === "code"
        ? { outputs: [], execution_count: index + 1 }
        : {}),
    };
  });

  return notebook;
}
