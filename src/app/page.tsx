"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { ApiKeyInput } from "@/components/api-key-input";
import { PdfUpload } from "@/components/pdf-upload";
import { GenerationProgress } from "@/components/generation-progress";
import { ResultsView } from "@/components/results-view";
import { Button } from "@/components/ui/button";
import { useApiKey } from "@/lib/api-key-context";
import { useHistory } from "@/lib/history-context";
import { HistoryDrawer } from "@/components/history-drawer";
import { useGenerationStream } from "@/hooks/use-generation-stream";

type AppStep = "api-key" | "upload" | "generating" | "results";

export default function Home() {
  const [step, setStep] = useState<AppStep>("api-key");
  const [paperTitle, setPaperTitle] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const { apiKey } = useApiKey();
  const { addEntry } = useHistory();
  const generation = useGenerationStream();

  useEffect(() => {
    if (generation.status === "complete" && step === "generating") {
      if (generation.notebookJson) {
        addEntry(paperTitle, generation.notebookJson);
      }
      setStep("results");
    }
  }, [generation.status, step, generation.notebookJson, paperTitle, addEntry]);

  const handleGenerate = useCallback(
    async (file: File) => {
      lastFileRef.current = file;
      setParseError(null);
      setStep("generating");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const parseRes = await fetch("/api/parse", {
          method: "POST",
          body: formData,
        });

        if (!parseRes.ok) {
          const err = await parseRes
            .json()
            .catch(() => ({ error: "Failed to parse PDF" }));
          generation.reset();
          setParseError(err.error || "Failed to parse PDF");
          setStep("upload");
          return;
        }

        const parsed = await parseRes.json();
        setPaperTitle(parsed.title);

        await generation.generate(parsed.text, apiKey, parsed.title);
      } catch {
        generation.reset();
        setParseError(
          "Network error. Please check your connection and try again."
        );
        setStep("upload");
      }
    },
    [apiKey, generation]
  );

  const handleRetry = useCallback(() => {
    if (lastFileRef.current) {
      handleGenerate(lastFileRef.current);
    }
  }, [handleGenerate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="fixed top-4 right-4 z-50">
        <HistoryDrawer />
      </div>
      <div className="w-full max-w-2xl flex flex-col items-center space-y-8">
        <div className="text-center space-y-3 sm:space-y-4 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Paper2Notebook
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Transform research papers into production-quality Google Colab
            notebooks.
          </p>
        </div>

        <div className="block sm:hidden text-xs text-muted-foreground/60 text-center">
          Best experienced on desktop
        </div>

        {step === "api-key" && (
          <div className="w-full flex flex-col items-center space-y-6 pt-4 animate-slide-up">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-medium text-foreground">
                Enter your OpenAI API Key
              </h2>
              <p className="text-xs text-muted-foreground">
                Required to generate notebooks using GPT-5.4
              </p>
            </div>
            <ApiKeyInput onContinue={() => setStep("upload")} />
          </div>
        )}

        {step === "upload" && (
          <div
            data-testid="upload-step"
            className="w-full flex flex-col items-center space-y-6 pt-4 animate-slide-up"
          >
            <div className="text-center space-y-1">
              <h2 className="text-sm font-medium text-foreground">
                Upload a Research Paper
              </h2>
              <p className="text-xs text-muted-foreground">
                We&apos;ll extract the methodology and generate a notebook
              </p>
            </div>

            {parseError && (
              <div
                data-testid="parse-error"
                className="w-full max-w-md flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 animate-fade-in"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{parseError}</p>
              </div>
            )}

            <PdfUpload onGenerate={handleGenerate} />
          </div>
        )}

        {step === "generating" && (
          <div
            data-testid="generating-step"
            className="w-full flex flex-col items-center pt-4 animate-slide-up"
          >
            <GenerationProgress messages={generation.messages} />
            {generation.error && (
              <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in">
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 max-w-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">
                    {generation.error}
                  </p>
                </div>
                <Button
                  data-testid="retry-button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                >
                  <RotateCcw className="mr-2 h-3 w-3" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "results" && generation.notebookJson && (
          <div
            data-testid="results-step"
            className="w-full flex flex-col items-center pt-4 animate-slide-up"
          >
            <ResultsView
              notebookJson={generation.notebookJson}
              paperTitle={paperTitle}
              onReset={() => {
                generation.reset();
                setParseError(null);
                setStep("upload");
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
