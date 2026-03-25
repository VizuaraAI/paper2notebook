"use client";

import { useState, useCallback, useRef } from "react";

interface StreamEvent {
  type: "progress" | "complete" | "error";
  message?: string;
  notebook?: string;
}

interface GenerationState {
  status: "idle" | "streaming" | "complete" | "error";
  messages: string[];
  notebookJson: string | null;
  error: string | null;
}

export function useGenerationStream() {
  const [state, setState] = useState<GenerationState>({
    status: "idle",
    messages: [],
    notebookJson: null,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (text: string, apiKey: string, title: string) => {
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      setState({
        status: "streaming",
        messages: [],
        notebookJson: null,
        error: null,
      });

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, apiKey, title }),
          signal: abort.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Request failed" }));
          setState((prev) => ({
            ...prev,
            status: "error",
            error: err.error || "Request failed",
          }));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: "No response stream",
          }));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);

            try {
              const event: StreamEvent = JSON.parse(jsonStr);

              if (event.type === "progress" && event.message) {
                setState((prev) => ({
                  ...prev,
                  messages: [...prev.messages, event.message!],
                }));
              } else if (event.type === "complete" && event.notebook) {
                setState((prev) => ({
                  ...prev,
                  status: "complete",
                  notebookJson: event.notebook!,
                }));
              } else if (event.type === "error") {
                setState((prev) => ({
                  ...prev,
                  status: "error",
                  error: event.message || "Generation failed",
                }));
              }
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : "Connection failed",
        }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      status: "idle",
      messages: [],
      notebookJson: null,
      error: null,
    });
  }, []);

  return { ...state, generate, reset };
}
