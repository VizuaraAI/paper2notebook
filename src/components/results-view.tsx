"use client";

import { useState, useCallback } from "react";
import { Download, ExternalLink, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadToGist } from "@/lib/gist-uploader";

interface ResultsViewProps {
  notebookJson: string;
  paperTitle: string;
  onReset: () => void;
}

export function ResultsView({
  notebookJson,
  paperTitle,
  onReset,
}: ResultsViewProps) {
  const [colabUrl, setColabUrl] = useState<string | null>(null);
  const [colabLoading, setColabLoading] = useState(false);
  const [colabError, setColabError] = useState<string | null>(null);

  const filename = `${paperTitle.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_")}.ipynb`;

  const notebook = JSON.parse(notebookJson);
  const cellCount = notebook.cells?.length || 0;
  const codeCells = notebook.cells?.filter(
    (c: { cell_type: string }) => c.cell_type === "code"
  ).length || 0;
  const markdownCells = cellCount - codeCells;

  const handleDownload = useCallback(() => {
    const blob = new Blob([notebookJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [notebookJson, filename]);

  const handleOpenInColab = useCallback(async () => {
    setColabLoading(true);
    setColabError(null);

    try {
      const url = await uploadToGist(notebookJson, filename);
      setColabUrl(url);
      window.open(url, "_blank");
    } catch {
      setColabError(
        "Could not upload to GitHub Gist. Download the .ipynb file and upload it to Colab manually."
      );
    } finally {
      setColabLoading(false);
    }
  }, [notebookJson, filename]);

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
          <span>{cellCount} cells</span>
          <span>{codeCells} code</span>
          <span>{markdownCells} markdown</span>
        </div>
      </div>

      <div className="space-y-3">
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
          data-testid="colab-button"
          onClick={colabUrl ? () => window.open(colabUrl, "_blank") : handleOpenInColab}
          variant="outline"
          className="w-full h-11"
          size="lg"
          disabled={colabLoading}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          {colabLoading ? "Uploading..." : "Open in Google Colab"}
        </Button>

        {colabError && (
          <p className="text-xs text-muted-foreground">{colabError}</p>
        )}
      </div>

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
