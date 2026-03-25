# Sprint v1 — Tasks

## Status: Not Started

- [ ] Task 1: Initialize Next.js 14 project with Tailwind CSS, shadcn/ui, and fonts (P0)
  - Acceptance: `npm run dev` starts without errors. Tailwind works. Inter + JetBrains Mono fonts loaded. shadcn/ui initialized with dark-neutral theme. Base layout matches ARC Prize aesthetic (off-white bg, centered content, generous spacing).
  - Files: package.json, tailwind.config.ts, app/layout.tsx, app/globals.css, app/page.tsx, components.json

- [ ] Task 2: Build the landing page with API key input (P0)
  - Acceptance: Hero section with app title "Paper2Notebook", tagline, and description. API key input field (password-masked, with show/hide toggle). Key is stored in React context/state and persists across page interactions. "Continue" button enabled only when key is entered. ARC Prize-inspired typography and spacing.
  - Files: app/page.tsx, components/api-key-input.tsx, lib/api-key-context.tsx

- [ ] Task 3: Build the PDF upload interface with drag-and-drop (P0)
  - Acceptance: Drag-and-drop zone with visual feedback (border highlight on drag-over). Click-to-browse fallback. Accepts only .pdf files, max 20MB. Shows file name, size after selection. "Generate Notebook" button appears after file is selected. Clean, minimal design consistent with landing page.
  - Files: components/pdf-upload.tsx, app/page.tsx (update to show upload after API key)

- [ ] Task 4: Implement PDF parsing API route (P0)
  - Acceptance: POST `/api/parse` accepts a PDF file upload (multipart/form-data). Uses `pdf-parse` to extract full text content. Returns JSON with `{ text, title, numPages, metadata }`. Handles errors gracefully (corrupt PDF, empty PDF, too large). Zod validation on input.
  - Files: app/api/parse/route.ts, lib/pdf-parser.ts

- [ ] Task 5: Build the notebook generation prompt engineering (P0)
  - Acceptance: A prompt builder function that takes extracted paper text and constructs a detailed system + user prompt for gpt-5.4. Prompt instructs the model to output structured JSON matching .ipynb format. Includes all notebook sections (setup, theory, implementation, synthetic data, experiments, analysis). Prompt emphasizes research-grade quality, not toy examples.
  - Files: lib/prompt-builder.ts, lib/notebook-types.ts

- [ ] Task 6: Implement streaming notebook generation API route (P0)
  - Acceptance: POST `/api/generate` accepts `{ text, apiKey }`. Calls OpenAI gpt-5.4 with streaming enabled. Streams progress messages to the client using Server-Sent Events (SSE). Progress messages include: "Analyzing paper structure...", "Identifying key algorithms...", "Generating implementation code...", "Creating synthetic datasets...", "Assembling notebook...". On completion, returns the full .ipynb JSON. Handles OpenAI errors (invalid key, rate limit, timeout).
  - Files: app/api/generate/route.ts, lib/openai-client.ts, lib/notebook-assembler.ts

- [ ] Task 7: Build the generation progress UI with streaming text display (P0)
  - Acceptance: After clicking "Generate Notebook", the UI transitions to a progress view. Shows an animated progress indicator (subtle pulse/spinner). Displays streaming status messages from the backend in real-time with typewriter-style fade-in. Messages appear sequentially as SSE events arrive. Looks polished and keeps user engaged during the 30-60s generation time.
  - Files: components/generation-progress.tsx, hooks/use-generation-stream.ts

- [ ] Task 8: Build the results page with download and "Open in Colab" (P0)
  - Acceptance: After generation completes, shows a success state with notebook preview (title, section count, estimated cells). "Download .ipynb" button triggers browser download with proper filename (based on paper title). "Open in Google Colab" button uploads notebook as a GitHub Gist and opens `colab.research.google.com/gist/{id}`. If Gist upload fails, gracefully falls back to download-only with a tooltip explaining how to open in Colab manually.
  - Files: components/results-view.tsx, lib/gist-uploader.ts, app/api/gist/route.ts

- [ ] Task 9: Wire up the full end-to-end flow with state management (P1)
  - Acceptance: Complete user journey works: enter API key → upload PDF → see progress → download/open notebook. State transitions are smooth (no flickers, no broken states). Error states handled at every step (network error, API error, PDF parse error) with user-friendly messages and retry options. Back navigation works (can upload another PDF without re-entering API key).
  - Files: app/page.tsx (orchestration update), lib/app-state.ts

- [ ] Task 10: UI polish — responsive design, animations, edge cases (P1)
  - Acceptance: Works on desktop (1024px+) and tablet (768px+). Mobile shows a "best on desktop" note but still functions. Subtle fade-in animations on section transitions. Loading states have skeleton/pulse animations. Error toasts use shadcn/ui toast component. Empty states are handled. Overall feel matches ARC Prize: calm, confident, research-grade aesthetic.
  - Files: various component updates, app/globals.css updates
