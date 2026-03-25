"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiKey } from "@/lib/api-key-context";

interface ApiKeyInputProps {
  onContinue: () => void;
}

export function ApiKeyInput({ onContinue }: ApiKeyInputProps) {
  const { apiKey, setApiKey } = useApiKey();
  const [showKey, setShowKey] = useState(false);

  const isValid = apiKey.trim().length > 0;

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="relative">
        <Input
          data-testid="api-key-input"
          type={showKey ? "text" : "password"}
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="h-12 pr-12 font-mono text-sm"
        />
        <button
          data-testid="toggle-visibility"
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your key is stored in memory only and never sent to our servers.
      </p>
      <Button
        data-testid="continue-button"
        onClick={onContinue}
        disabled={!isValid}
        className="w-full h-11"
        size="lg"
      >
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
