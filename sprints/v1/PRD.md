# Sprint v1 — PRD: Paper2Notebook

## Overview
Build a web application where researchers upload a PDF of a research paper and receive a production-quality Google Colab notebook that implements the paper's algorithms, methodology, and key contributions as a structured, runnable tutorial. The app uses OpenAI's gpt-5.4 reasoning model to deeply understand the paper and generate detailed, research-grade Python code with synthetic data demonstrations.

## Goals
- User can enter their OpenAI API key on the landing page and have it persist for the session
- User can upload a research paper PDF and have it parsed server-side
- The app generates a highly structured .ipynb notebook implementing the paper's core algorithms with synthetic data
- During generation, the user sees real-time streaming status text to stay engaged
- User can download the generated .ipynb file or click "Open in Google Colab"
- UI follows the ARC Prize aesthetic: clean, minimalist, research-oriented, dark neutrals with generous whitespace

## User Stories
- As a research scientist, I want to upload a paper PDF and get a runnable notebook, so I can quickly replicate and build upon the paper's methodology
- As a researcher, I want to see progress updates while the notebook generates, so I know the system is working and what stage it's at
- As a user, I want to download the notebook or open it directly in Colab, so I can start experimenting immediately
- As a user, I want to provide my own OpenAI API key, so I maintain control over costs and usage

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes (Route Handlers)
- **PDF Parsing**: `pdf-parse` (server-side text extraction)
- **AI**: OpenAI SDK with `gpt-5.4` model for notebook generation
- **Notebook Format**: Direct `.ipynb` JSON assembly (no external notebook libraries needed)
- **Fonts**: Inter (body) + JetBrains Mono (code/accent) — matching ARC Prize's clean sans-serif style
- **No database** — stateless, all processing happens per-request

### Component Diagram
```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│                                                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ API Key  │→ │ PDF Upload│→ │ Generation   │  │
│  │ Input    │  │ Drop Zone │  │ Progress View│  │
│  └──────────┘  └───────────┘  └──────┬───────┘  │
│                                      │          │
│                              ┌───────▼───────┐  │
│                              │ Download /    │  │
│                              │ Open in Colab │  │
│                              └───────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │ API Calls (streaming)
┌──────────────────▼──────────────────────────────┐
│                   Backend                        │
│                                                  │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ /api/parse   │  │ /api/generate           │  │
│  │ PDF → text   │  │ text → OpenAI → .ipynb  │  │
│  │ (pdf-parse)  │  │ (streaming response)    │  │
│  └──────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Data Flow
1. User enters OpenAI API key → stored in React state (session only)
2. User uploads PDF → sent to `/api/parse` → returns extracted text + metadata
3. Frontend sends extracted text + API key to `/api/generate` (streaming endpoint)
4. Backend constructs a detailed prompt, calls gpt-5.4 with streaming
5. Backend streams progress messages to frontend in real-time
6. On completion, backend assembles the .ipynb JSON and returns it
7. Frontend offers download button + "Open in Google Colab" link

### Notebook Generation Strategy
The prompt to gpt-5.4 will instruct it to produce a structured notebook with:
- **Title & Abstract Summary** — markdown cell with paper citation
- **Environment Setup** — pip installs, imports
- **Background & Theory** — markdown cells explaining key concepts from the paper
- **Algorithm Implementation** — code cells implementing each algorithm step-by-step
- **Synthetic Data Generation** — realistic synthetic datasets matching the paper's domain
- **Experiments & Results** — running the implementation, generating plots/metrics
- **Analysis & Discussion** — comparing with paper's reported results
- **Extensions & Next Steps** — suggestions for adapting the code

### "Open in Colab" Approach
The generated .ipynb content will be encoded and uploaded as a GitHub Gist via the GitHub Gists API (unauthenticated gists are public but require no auth). The Colab URL format `https://colab.research.google.com/gist/{gist_id}` will be used. Fallback: direct .ipynb download if Gist creation fails.

## Design Direction (ARC Prize Inspired)
- **Background**: Off-white / light gray (#FAFAFA)
- **Text**: Near-black (#1A1A1A) for headings, dark gray (#4A4A4A) for body
- **Accent**: Subtle blue or purple for interactive elements
- **Cards**: White with subtle borders, no heavy shadows
- **Typography**: Large, bold headings (Inter 700), clean body text (Inter 400)
- **Spacing**: Very generous — sections breathe
- **Animations**: Subtle fade-ins, no flashy transitions
- **Layout**: Centered single-column, max-width ~720px for content

## Out of Scope (v2+)
- User authentication and accounts
- Usage tracking and rate limiting
- Saving/history of generated notebooks
- Batch processing multiple papers
- Custom notebook templates or style preferences
- Real-time collaboration
- Payment/billing integration
- Deployment and hosting infrastructure

## Dependencies
- None (greenfield project)
- User must provide their own OpenAI API key with gpt-5.4 access
