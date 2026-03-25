"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfUploadProps {
  onGenerate: (file: File) => void;
}

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfUpload({ onGenerate }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback((selected: File) => {
    setError(null);
    if (selected.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError(`File exceeds ${MAX_SIZE_MB}MB limit.`);
      return;
    }
    setFile(selected);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) validateAndSet(dropped);
    },
    [validateAndSet]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) validateAndSet(selected);
    },
    [validateAndSet]
  );

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {!file ? (
        <div
          data-testid="drop-zone"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
            dragOver
              ? "border-foreground bg-accent"
              : "border-border hover:border-muted-foreground"
          }`}
        >
          <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drop your research paper here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF only, up to {MAX_SIZE_MB}MB
          </p>
          <input
            ref={inputRef}
            data-testid="file-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div
          data-testid="file-preview"
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
        >
          <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            data-testid="clear-file"
            onClick={clearFile}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <p data-testid="upload-error" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {file && (
        <Button
          data-testid="generate-button"
          onClick={() => onGenerate(file)}
          className="w-full h-11"
          size="lg"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Notebook
        </Button>
      )}
    </div>
  );
}
