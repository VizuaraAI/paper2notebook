"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  paperTitle: string;
  timestamp: number;
  notebookJson: string;
  cellCount: number;
}

interface HistoryContextValue {
  entries: HistoryEntry[];
  addEntry: (paperTitle: string, notebookJson: string) => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const addEntry = useCallback((paperTitle: string, notebookJson: string) => {
    let cellCount = 0;
    try {
      const notebook = JSON.parse(notebookJson);
      cellCount = notebook.cells?.length || 0;
    } catch {
      cellCount = 0;
    }

    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      paperTitle,
      timestamp: Date.now(),
      notebookJson,
      cellCount,
    };

    setEntries((prev) => [entry, ...prev]);
  }, []);

  return (
    <HistoryContext.Provider value={{ entries, addEntry }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
