"use client";

import { useCallback } from "react";
import { History, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useHistory } from "@/lib/history-context";

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryDrawer() {
  const { entries } = useHistory();

  const handleDownload = useCallback(
    (paperTitle: string, notebookJson: string) => {
      const filename = `${paperTitle
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 100)}.ipynb`;
      const blob = new Blob([notebookJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          data-testid="history-button"
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <History className="h-4 w-4" />
          History
          {entries.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {entries.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent data-testid="history-drawer" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Generation History</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {entries.length === 0 ? (
            <p
              data-testid="history-empty"
              className="text-sm text-muted-foreground text-center py-8"
            >
              No notebooks generated yet
            </p>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.id}
                data-testid="history-entry"
                onClick={() =>
                  handleDownload(entry.paperTitle, entry.notebookJson)
                }
                className="w-full rounded-lg border border-border bg-card p-3 text-left hover:bg-accent transition-colors"
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.paperTitle}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatTimestamp(entry.timestamp)}</span>
                  <span>{entry.cellCount} cells</span>
                  <Download className="ml-auto h-3 w-3" />
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
