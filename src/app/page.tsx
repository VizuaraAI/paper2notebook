"use client";

import { useState } from "react";
import { ApiKeyInput } from "@/components/api-key-input";
import { PdfUpload } from "@/components/pdf-upload";

type AppStep = "api-key" | "upload" | "generating" | "results";

export default function Home() {
  const [step, setStep] = useState<AppStep>("api-key");

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
          <div data-testid="upload-step" className="w-full flex flex-col items-center space-y-6 pt-4">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-medium text-foreground">
                Upload a Research Paper
              </h2>
              <p className="text-xs text-muted-foreground">
                We&apos;ll extract the methodology and generate a notebook
              </p>
            </div>
            <PdfUpload
              onGenerate={(file) => {
                console.log("Generate notebook for:", file.name);
                setStep("generating");
              }}
            />
          </div>
        )}

        {step === "generating" && (
          <div data-testid="generating-step" className="text-muted-foreground">
            Generating...
          </div>
        )}
      </div>
    </main>
  );
}
