import { createEmptyNotebook, type Notebook, type NotebookCell } from "./notebook-types";
import { scanAndSanitizeCode } from "./output-scanner";

interface RawCell {
  cell_type: "markdown" | "code";
  source: string[] | string;
}

function repairAndParse(jsonStr: string): RawCell[] {
  let lastValidIdx = -1;
  for (let i = jsonStr.length - 1; i >= 0; i--) {
    if (jsonStr[i] === "}") {
      const candidate = jsonStr.substring(0, i + 1) + "]";
      try {
        const result = JSON.parse(candidate);
        if (Array.isArray(result)) {
          lastValidIdx = i;
          return result;
        }
      } catch {
        continue;
      }
    }
  }
  if (lastValidIdx === -1) {
    throw new Error("Could not repair truncated JSON output from the model");
  }
  return [];
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

  let parsed: RawCell[];
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    parsed = repairAndParse(jsonStr);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array of cells");
  }

  notebook.cells = parsed.map((cell, index): NotebookCell => {
    const source = Array.isArray(cell.source)
      ? cell.source
      : cell.source.split("\n").map((line, i, arr) =>
          i < arr.length - 1 ? line + "\n" : line
        );

    const sanitizedSource = cell.cell_type === "code"
      ? scanAndSanitizeCode(source.join("")).split("\n").map((line, i, arr) =>
          i < arr.length - 1 ? line + "\n" : line
        )
      : source;

    return {
      cell_type: cell.cell_type === "code" ? "code" : "markdown",
      metadata: {},
      source: sanitizedSource,
      ...(cell.cell_type === "code"
        ? { outputs: [], execution_count: index + 1 }
        : {}),
    };
  });

  return notebook;
}
