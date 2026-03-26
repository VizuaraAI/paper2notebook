"use client";

import { useCallback, useMemo } from "react";
import { Download, CheckCircle, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsViewProps {
  notebookJson: string;
  paperTitle: string;
  onReset: () => void;
}

interface ParsedNotebook {
  cellCount: number;
  codeCells: number;
  markdownCells: number;
  error: string | null;
}

function parseNotebook(json: string): ParsedNotebook {
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
    return { cellCount: 0, codeCells: 0, markdownCells: 0, error: "Failed to parse notebook data" };
  }
}

export function ResultsView({
  notebookJson,
  paperTitle,
  onReset,
}: ResultsViewProps) {
  const filename = `${paperTitle.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_").slice(0, 100)}.ipynb`;
  const parsed = useMemo(() => parseNotebook(notebookJson), [notebookJson]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([notebookJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [notebookJson, filename]);

  if (parsed.error) {
    return (
      <div data-testid="results-view" className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-semibold text-foreground">
            Notebook Generated
          </h2>
        </div>

        <div
          data-testid="parse-error-message"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2"
        >
          <p className="text-sm text-amber-800">
            The notebook was generated but could not be previewed. You can still
            download the raw file.
          </p>
        </div>

        <Button
          data-testid="download-raw-button"
          onClick={handleDownload}
          className="w-full h-11"
          size="lg"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Raw .ipynb
        </Button>

        <Button
          data-testid="new-paper-button"
          onClick={onReset}
          variant="ghost"
          className="w-full"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Generate another notebook
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="results-view" className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center gap-3">
        <CheckCircle className="h-10 w-10 text-green-600" />
        <h2 className="text-lg font-semibold text-foreground">
          Notebook Ready
        </h2>
      </div>

      <div
        data-testid="notebook-preview"
        className="rounded-lg border border-border bg-card p-4 space-y-2"
      >
        <p className="text-sm font-medium text-foreground truncate">
          {paperTitle}
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{parsed.cellCount} cells</span>
          <span>{parsed.codeCells} code</span>
          <span>{parsed.markdownCells} markdown</span>
        </div>
      </div>

      <Button
        data-testid="download-button"
        onClick={handleDownload}
        className="w-full h-11"
        size="lg"
      >
        <Download className="mr-2 h-4 w-4" />
        Download .ipynb
      </Button>

      <Button
        data-testid="new-paper-button"
        onClick={onReset}
        variant="ghost"
        className="w-full"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Generate another notebook
      </Button>
    </div>
  );
}
