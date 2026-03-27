# Sprint v1 — Walkthrough

## Summary
Built **Paper2Notebook**, a single-page web application that converts research paper PDFs into production-quality Google Colab notebooks. Users enter their OpenAI API key, upload a PDF, watch real-time streaming progress, and download a runnable `.ipynb` file (or open it directly in Colab). The app is entirely stateless — no database, no auth, no localStorage — and uses gpt-5.4 for generation with a carefully engineered 10-section notebook prompt. 38 tests passing (23 Playwright + 15 Vitest).

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │ API Key  │──▶│  Upload  │──▶│ Progress │──▶│ Results  │  │
│  │  Input   │   │ PDF Drop │   │ Streaming│   │ Download │  │
│  └──────────┘   └────┬─────┘   └────┬─────┘   └──────────┘  │
│                      │              │                        │
│  ApiKeyContext ──────────────────────────────────────────▶    │
│  useGenerationStream ──────────────────────SSE──────────▶    │
└──────────────────────┼──────────────┼────────────────────────┘
                       │              │
              POST /api/parse    POST /api/generate
                       │              │
                       ▼              ▼
              ┌──────────────┐ ┌──────────────────────────────┐
              │  pdf-parse   │ │  OpenAI gpt-5.4 (streaming)  │
              │  (v1.1.1)    │ │  ↓                           │
              │  Extract     │ │  Prompt Builder               │
              │  text/title  │ │  ↓                           │
              │  /metadata   │ │  Notebook Assembler           │
              └──────────────┘ │  (JSON → .ipynb)             │
                               └──────────────────────────────┘
```

## Files Created/Modified

### `next.config.mjs`
**Purpose**: Next.js configuration marking `pdf-parse` as a server-side external package.

**How it works**: pdf-parse is a CommonJS module that bundles `pdfjs-dist`, which fails under Next.js's webpack bundling. The `experimental.serverComponentsExternalPackages` array tells Next.js to load it at runtime rather than bundling it. This single config line prevents a "Object.defineProperty called on non-object" webpack error.

---

### `tailwind.config.ts`
**Purpose**: Tailwind CSS v3 configuration extending the default theme with shadcn/ui's HSL color system and custom fonts.

**How it works**: All color values reference CSS custom properties (e.g., `background: "hsl(var(--background))"`), allowing the entire palette to be controlled from `globals.css`. The `fontFamily` section wires Inter (`--font-sans`) and JetBrains Mono (`--font-mono`) via CSS variables set by `next/font/google` in the layout. Uses the `tailwindcss-animate` plugin for shadcn/ui component animations. Dark mode is class-based but not actively used in v1.

---

### `src/app/globals.css`
**Purpose**: Global CSS defining the design system's HSL color variables and custom animations.

**Key variables**: All colors are achromatic (hue 0, saturation 0) except `--destructive` (red), giving the app its clean ARC Prize-inspired aesthetic. Background is `0 0% 98%` (off-white), foreground is `0 0% 10%` (near-black).

Custom animation utilities for step transitions:
```css
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
.animate-slide-up { animation: slideUp 0.4s ease-out; }
```

---

### `src/app/layout.tsx`
**Purpose**: Root layout that loads fonts, sets metadata, and wraps the app in `ApiKeyProvider`.

**How it works**: Loads Inter as `--font-sans` and JetBrains Mono as `--font-mono` via `next/font/google`, setting both CSS variables on the `<html>` tag. Wraps all children in `<ApiKeyProvider>` so the API key is accessible anywhere in the component tree. The body has `bg-background font-sans antialiased` for the base aesthetic.

---

### `src/app/page.tsx`
**Purpose**: Main application page orchestrating the 4-step user flow via a state machine.

**Key Components**: `Home` (default export)

**How it works**: Uses a `step` state variable (`"api-key" | "upload" | "generating" | "results"`) to conditionally render one of four views. The `useGenerationStream` hook manages SSE connection state. When the user clicks "Generate Notebook", `handleGenerate` first calls `/api/parse` to extract PDF text, then streams the response from `/api/generate`:

```typescript
const handleGenerate = useCallback(async (file: File) => {
  lastFileRef.current = file;
  setStep("generating");
  const formData = new FormData();
  formData.append("file", file);
  const parseRes = await fetch("/api/parse", { method: "POST", body: formData });
  if (!parseRes.ok) { /* show inline error, return to upload */ }
  const parsed = await parseRes.json();
  setPaperTitle(parsed.title);
  await generation.generate(parsed.text, apiKey, parsed.title);
}, [apiKey, generation]);
```

Error handling is inline — parse errors show a red alert in the upload step; generation errors show in the progress step with a retry button that re-invokes `handleGenerate` with the same file (stored in `lastFileRef`). An `useEffect` watches for `generation.status === "complete"` to auto-transition to results.

---

### `src/lib/api-key-context.tsx`
**Purpose**: React context provider for sharing the OpenAI API key across components.

**Key Exports**: `ApiKeyProvider`, `useApiKey`

**How it works**: Standard React context pattern. `ApiKeyProvider` wraps the app in `layout.tsx` and stores the key in `useState("")`. The key exists only in memory — never persisted to localStorage, cookies, or sent to the app's own backend. `useApiKey()` throws if used outside the provider.

---

### `src/components/api-key-input.tsx`
**Purpose**: Password-masked input field for the OpenAI API key with visibility toggle and Continue button.

**Key Components**: `ApiKeyInput`

**How it works**: Reads/writes the API key via `useApiKey()` context. The input toggles between `type="password"` and `type="text"` using Lucide `Eye`/`EyeOff` icons. The Continue button is disabled until the key has non-whitespace content (`apiKey.trim().length > 0`).

---

### `src/components/pdf-upload.tsx`
**Purpose**: Drag-and-drop PDF upload zone with file validation and preview.

**Key Components**: `PdfUpload`

**How it works**: Renders a dashed-border drop zone that highlights on drag-over. Validates files are `application/pdf` and under 20MB. After selection, shows a preview card with filename, formatted file size, and a clear (X) button. The "Generate Notebook" button calls the `onGenerate` prop with the `File` object. A hidden `<input type="file" accept=".pdf">` serves as a click-to-browse fallback.

---

### `src/app/api/parse/route.ts`
**Purpose**: API route that accepts a PDF file upload and returns extracted text + metadata.

**Key Exports**: `POST`

**How it works**: Validates the uploaded file (must exist, must be `application/pdf`, must be ≤20MB, must not be empty). Converts `File` to `Buffer` and calls `parsePdf()`. If extracted text is empty, returns 422 suggesting the PDF may be scanned/image-based. Returns `{ text, title, numPages, metadata }` on success.

---

### `src/lib/pdf-parser.ts`
**Purpose**: Server-side PDF text extraction wrapper around `pdf-parse` v1.1.1.

**Key Exports**: `parsePdf`, `ParsedPdf`

**How it works**: Uses `require("pdf-parse")` (CommonJS) because pdf-parse doesn't support ESM imports. Title extraction falls back through: `data.info.Title` → first non-empty text line → "Untitled Paper". Returns `{ text, title, numPages, metadata: { author?, subject?, creator? } }`.

---

### `src/lib/prompt-builder.ts`
**Purpose**: Constructs the system + user prompt pair for gpt-5.4 notebook generation.

**Key Exports**: `buildNotebookPrompt`, `PromptPair`

**How it works**: The system prompt defines the persona ("elite research engineer"), output format (JSON array of `{ cell_type, source }` objects), and 10 required notebook sections: title/citation, overview, environment setup, imports, background/theory, core algorithm implementation, synthetic data generation, experiments, analysis/visualization, and extensions. Paper text is truncated at 30,000 characters to stay within context limits:

```typescript
const truncatedText = paperText.length > 30000
  ? paperText.slice(0, 30000) + "\n\n[Paper text truncated at 30,000 characters]"
  : paperText;
```

---

### `src/lib/notebook-types.ts`
**Purpose**: TypeScript interfaces for the Jupyter `.ipynb` format and a factory function.

**Key Exports**: `NotebookCell`, `Notebook`, `createEmptyNotebook`

**How it works**: `NotebookCell` models both markdown and code cells. `Notebook` follows nbformat 4.5 with Python 3 kernel and optional Colab metadata. `createEmptyNotebook(name)` returns a ready-to-populate notebook structure.

---

### `src/lib/openai-client.ts`
**Purpose**: OpenAI SDK wrapper with a streaming async generator for notebook generation.

**Key Exports**: `createOpenAIClient`, `streamNotebookGeneration`

**How it works**: `streamNotebookGeneration` is an async generator yielding `{ type: "progress" | "content" | "error", data: string }` events. It calls gpt-5.4 with `temperature: 0.3` and `max_completion_tokens: 32000` in streaming mode. Progress messages are emitted at specific chunk counts to simulate stage transitions:

```typescript
if (chunkCount === 50)  yield { type: "progress", data: "Generating implementation code..." };
if (chunkCount === 150) yield { type: "progress", data: "Creating synthetic datasets..." };
if (chunkCount === 300) yield { type: "progress", data: "Building experiments and visualizations..." };
if (chunkCount === 500) yield { type: "progress", data: "Finalizing notebook structure..." };
```

Error handling distinguishes `AuthenticationError`, `RateLimitError`, and `APIConnectionError` with user-friendly messages.

---

### `src/app/api/generate/route.ts`
**Purpose**: Streaming SSE endpoint that calls OpenAI and returns progress + notebook JSON.

**Key Exports**: `POST`

**How it works**: Validates request body with Zod (`text`, `apiKey`, `title`). Creates a `ReadableStream` that iterates over `streamNotebookGeneration()`. Progress events become `data: {"type":"progress","message":"..."}` SSE frames. When content arrives, `assembleNotebook()` converts the raw model output to `.ipynb` JSON, sent as a `type: "complete"` event. Errors are forwarded as `type: "error"` events.

---

### `src/lib/notebook-assembler.ts`
**Purpose**: Converts raw gpt-5.4 JSON output into a valid `.ipynb` Notebook, with repair for truncated output.

**Key Exports**: `assembleNotebook`

**How it works**: Strips markdown code fences if present, then attempts `JSON.parse`. If parsing fails (typically from truncated output hitting the token limit), `repairAndParse()` scans backwards for the last complete cell object, appends `]` to close the array, and retries:

```typescript
function repairAndParse(jsonStr: string): RawCell[] {
  for (let i = jsonStr.length - 1; i >= 0; i--) {
    if (jsonStr[i] === "}") {
      const candidate = jsonStr.substring(0, i + 1) + "]";
      try {
        const result = JSON.parse(candidate);
        if (Array.isArray(result)) return result;
      } catch { continue; }
    }
  }
  throw new Error("Could not repair truncated JSON output from the model");
}
```

Each cell's `source` is normalized from string to string array (split on `\n` with newlines re-appended). Code cells get `outputs: []` and `execution_count`.

---

### `src/hooks/use-generation-stream.ts`
**Purpose**: React hook managing the SSE connection to `/api/generate` and tracking generation state.

**Key Exports**: `useGenerationStream`

**How it works**: Maintains state with `status` ("idle" | "streaming" | "complete" | "error"), `messages` (progress strings array), `notebookJson`, and `error`. The `generate` function POSTs to `/api/generate`, reads the response body stream, splits on `\n\n` to extract SSE events, and dispatches state updates. Supports abort via `AbortController`. The `reset` function aborts and returns to idle.

SSE parsing:
```typescript
buffer += decoder.decode(value, { stream: true });
const lines = buffer.split("\n\n");
buffer = lines.pop() || "";
for (const line of lines) {
  if (!line.startsWith("data: ")) continue;
  const event = JSON.parse(line.slice(6));
  // handle progress/complete/error
}
```

---

### `src/components/generation-progress.tsx`
**Purpose**: Real-time progress display with spinner, streaming messages, and progress bar.

**Key Components**: `GenerationProgress`

**How it works**: Shows a `Loader2` spinning icon with "Generating notebook..." text. Each progress message renders with a dot indicator — the latest message gets a pulsing dot and brighter text, older messages fade. The progress bar fills based on `messages.length / 6 * 100`, capped at 90% (never shows 100% prematurely).

---

### `src/components/results-view.tsx`
**Purpose**: Post-generation view with notebook preview, download, Colab link, and reset.

**Key Components**: `ResultsView`

**How it works**: Parses `notebookJson` to extract cell counts (total, code, markdown). "Download .ipynb" creates a Blob URL and triggers download. "Open in Google Colab" calls `uploadToGist()` to create a public GitHub Gist, then opens the Colab URL. Falls back gracefully with a message if Gist upload fails (GitHub requires authentication for gist creation). "Generate another notebook" resets to the upload step without re-entering the API key.

---

### `src/lib/gist-uploader.ts`
**Purpose**: Uploads notebook JSON to GitHub Gists API and returns a Colab URL.

**Key Exports**: `uploadToGist`

**How it works**: POSTs to `https://api.github.com/gists` without authentication, creating a public gist. Returns `https://colab.research.google.com/gist/anonymous/{gist.id}/{filename}`. Currently fails because GitHub requires authentication for gist creation — this is a known limitation.

---

### `src/components/ui/button.tsx` & `src/components/ui/input.tsx`
**Purpose**: Standard shadcn/ui components (Tailwind v3 compatible).

**How they work**: Button uses class-variance-authority (CVA) with 6 variants and 4 sizes, supports `asChild` via Radix `Slot`. Input is a styled forwarded-ref `<input>` with consistent border, focus ring, and disabled states.

---

### `src/lib/utils.ts`
**Purpose**: Tailwind class name merge utility (`cn`), combining `clsx` with `tailwind-merge`.

---

## Data Flow

1. **User opens app** → `page.tsx` renders the API key step
2. **User enters API key** → stored in `ApiKeyContext` (in-memory only) → clicks Continue → transitions to upload step
3. **User uploads PDF** → drag-and-drop or click-to-browse → file validated client-side (type, size)
4. **User clicks "Generate Notebook"** → `handleGenerate()` fires:
   - `POST /api/parse` with FormData → server extracts text via `pdf-parse` → returns `{ text, title, numPages, metadata }`
   - If parse fails → inline error shown in upload step
5. **Parse succeeds** → `generation.generate()` called:
   - `POST /api/generate` with `{ text, apiKey, title }` → server builds prompt → streams gpt-5.4 response via SSE
   - Each SSE `progress` event → appended to `messages[]` → rendered in `GenerationProgress`
   - SSE `complete` event → `notebookJson` set → `useEffect` transitions to results step
   - SSE `error` event → error displayed with retry button
6. **Results displayed** → `ResultsView` shows cell counts, download button, Colab button
7. **Download** → Blob URL created → browser downloads `.ipynb` file
8. **Open in Colab** → `uploadToGist()` → Colab URL opened in new tab (or fallback message)
9. **Reset** → returns to upload step, API key preserved in context

## Test Coverage

### Unit Tests (15 tests — Vitest)
- **prompt-builder.test.ts** (6 tests) — prompt pair structure, paper title/text inclusion, 30k truncation, JSON format instructions, all 10 notebook sections present
- **notebook-types.test.ts** (1 test) — `createEmptyNotebook` produces valid nbformat 4.5 structure
- **notebook-assembler.test.ts** (8 tests) — valid JSON assembly, colab name setting, code cell outputs/execution_count, markdown cell structure, code fence handling, string-to-array source normalization, invalid JSON rejection, non-array JSON rejection

### Integration Tests (4 tests — Playwright)
- **task4-parse-api.spec.ts** — warm-up route compilation, valid PDF returns 200 with text/title/numPages/metadata, non-PDF rejection (400), missing file rejection (400)

### E2E Tests (19 tests — Playwright)
- **task1-setup.spec.ts** (3 tests) — page title, Inter font loading, off-white background color
- **task2-api-key.spec.ts** (4 tests) — input visibility, password toggle, button enable/disable, step transition
- **task3-pdf-upload.spec.ts** (4 tests) — drop zone rendering, file selection, file clearing, generate transition
- **task7-progress-ui.spec.ts** (1 test) — progress spinner and component rendering with mocked APIs
- **task8-results.spec.ts** (4 tests) — notebook preview with cell counts, download button, Colab button, reset flow
- **task9-full-flow.spec.ts** (3 tests) — complete happy-path journey, parse error with inline display, generation error with retry button

## Security Measures
- API key stored in React state only — never persisted to localStorage, cookies, or the app's backend
- API key sent only to OpenAI's API endpoint, never to Paper2Notebook's own server (except `/api/generate` which uses it to call OpenAI)
- File type validation on both client (accept attribute, drag handler) and server (MIME type check)
- File size validation (20MB limit) on both client and server
- Zod schema validation on `/api/generate` request body
- Empty/corrupt PDF detection with specific error messages (no raw stack traces exposed)
- No user-generated content rendered as HTML (React's default XSS protection)

## Known Limitations
- **Gist upload requires authentication**: GitHub no longer allows unauthenticated gist creation. The "Open in Colab" feature fails and falls back to a download instruction. Needs a GitHub token (env var or user-provided) to work.
- **Token limit truncation**: gpt-5.4 output may exceed 32k tokens for complex papers. The JSON repair mechanism recovers partial output but loses later notebook sections.
- **Paper text truncation**: Papers longer than 30k characters are truncated, potentially losing methodology details in the tail of the paper.
- **No scanned PDF support**: pdf-parse extracts text from digital PDFs only — scanned/image-based PDFs return empty text with a 422 error.
- **No auth or rate limiting**: Anyone with the URL can use the app. Each request creates a fresh OpenAI API call charged to the user's key.
- **Stateless**: No history, no saved notebooks, no usage tracking. Each session is ephemeral.
- **Single worker tests**: Playwright tests run with `workers: 1` because pdf-parse has initialization issues under concurrent Next.js compilation.
- **Model-specific parameter**: Uses `max_completion_tokens` (gpt-5.4 specific) — would need adjustment for other OpenAI models.

## What's Next
v2 priorities based on current limitations and PRD trajectory:
1. **Authentication & usage tracking** — user accounts, generation history, usage limits
2. **GitHub token integration** — fix "Open in Colab" with user-provided or server-side GitHub PAT
3. **Smarter paper parsing** — OCR support for scanned PDFs, better section extraction
4. **Chunked generation** — split long papers into sections, generate notebook per-section to avoid token limits
5. **Deployment** — Vercel/Railway deployment with environment variable management
6. **Model flexibility** — allow users to choose between GPT models based on cost/quality tradeoff
