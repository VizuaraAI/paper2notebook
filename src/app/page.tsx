"use client";

import { useState, useCallback } from "react";
import { ApiKeyInput } from "@/components/api-key-input";
import { PdfUpload } from "@/components/pdf-upload";
import { GenerationProgress } from "@/components/generation-progress";
import { useApiKey } from "@/lib/api-key-context";
import { useGenerationStream } from "@/hooks/use-generation-stream";

type AppStep = "api-key" | "upload" | "generating" | "results";

export default function Home() {
  const [step, setStep] = useState<AppStep>("api-key");
  const [paperTitle, setPaperTitle] = useState("");
  const { apiKey } = useApiKey();
  const generation = useGenerationStream();

  const handleGenerate = useCallback(
    async (file: File) => {
      setStep("generating");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const parseRes = await fetch("/api/parse", {
          method: "POST",
          body: formData,
        });

        if (!parseRes.ok) {
          const err = await parseRes.json();
          generation.reset();
          setStep("upload");
          alert(err.error || "Failed to parse PDF");
          return;
        }

        const parsed = await parseRes.json();
        setPaperTitle(parsed.title);

        await generation.generate(parsed.text, apiKey, parsed.title);
      } catch {
        generation.reset();
        setStep("upload");
        alert("Failed to process PDF. Please try again.");
      }
    },
    [apiKey, generation]
  );

  if (generation.status === "complete" && step === "generating") {
    setStep("results");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl flex flex-col items-center space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Paper2Notebook
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Transform research papers into production-quality Google Colab
            notebooks.
          </p>
        </div>

        {step === "api-key" && (
          <div className="w-full flex flex-col items-center space-y-6 pt-4">
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
            className="w-full flex flex-col items-center space-y-6 pt-4"
          >
            <div className="text-center space-y-1">
              <h2 className="text-sm font-medium text-foreground">
                Upload a Research Paper
              </h2>
              <p className="text-xs text-muted-foreground">
                We&apos;ll extract the methodology and generate a notebook
              </p>
            </div>
            <PdfUpload onGenerate={handleGenerate} />
          </div>
        )}

        {step === "generating" && (
          <div
            data-testid="generating-step"
            className="w-full flex flex-col items-center pt-4"
          >
            <GenerationProgress messages={generation.messages} />
            {generation.error && (
              <div className="mt-4 text-sm text-destructive">
                {generation.error}
              </div>
            )}
          </div>
        )}

        {step === "results" && (
          <div data-testid="results-step" className="text-muted-foreground">
            Results: {paperTitle}
          </div>
        )}
      </div>
    </main>
  );
}
