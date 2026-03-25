"use client";

import { Loader2 } from "lucide-react";

interface GenerationProgressProps {
  messages: string[];
}

export function GenerationProgress({ messages }: GenerationProgressProps) {
  return (
    <div
      data-testid="generation-progress"
      className="w-full max-w-md space-y-6"
    >
      <div className="flex items-center justify-center gap-3">
        <Loader2
          data-testid="progress-spinner"
          className="h-5 w-5 animate-spin text-muted-foreground"
        />
        <span className="text-sm font-medium text-foreground">
          Generating notebook...
        </span>
      </div>

      <div className="space-y-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                index === messages.length - 1
                  ? "bg-foreground animate-pulse"
                  : "bg-muted-foreground/40"
              }`}
            />
            <p
              className={`text-sm ${
                index === messages.length - 1
                  ? "text-foreground"
                  : "text-muted-foreground/60"
              }`}
            >
              {message}
            </p>
          </div>
        ))}
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full animate-pulse rounded-full bg-foreground/20 transition-all duration-1000"
          style={{ width: `${Math.min((messages.length / 6) * 100, 90)}%` }}
        />
      </div>
    </div>
  );
}
