# Sprint v2 — PRD: Security Hardening + Generation History

## Overview
Harden the Paper2Notebook application against the OWASP Top 10 vulnerabilities identified in the v1 security audit, with particular focus on prompt injection defense (PDF content → LLM), input validation gaps, and missing security headers. Additionally, add a lightweight generation history feature so users can revisit previously generated notebooks within their session.

## Goals
- All 3 critical and 3 high security findings from the v1 audit are resolved
- Prompt injection via PDF content is defended with input sanitization, delimiter isolation, and output scanning
- All API routes have proper input size limits, rate limiting, and generic error responses
- Security headers (CSP, X-Frame-Options, HSTS, etc.) are configured in next.config.mjs
- PDF magic byte validation on the server (not just client-trusted MIME type)
- "Open in Colab" button removed (broken — GitHub requires auth for gist creation)
- Users can see a session-scoped history of generated notebooks and re-download them
- All existing tests continue to pass; new security-focused tests added

## User Stories
- As a researcher, I want to be confident that uploading a PDF won't produce a notebook with malicious code, so I can trust the generated output
- As a user, I want to re-download a notebook I generated earlier in my session without re-uploading the PDF
- As a developer deploying this app, I want security headers and rate limiting in place before going to production

## Technical Architecture

### Security Layers
```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│                                                          │
│  API Key (in-memory only, never persisted)               │
│  ↓                                                       │
│  POST /api/parse ──────────────────────────────────────┐ │
│  POST /api/generate ─────────────────────────────────┐ │ │
└──────────────────────────────────────────────────────┼─┼─┘
                                                       │ │
                    ┌──────────────────────────────┐   │ │
                    │     Rate Limiter (IP-based)   │◀──┼─┘
                    └──────────┬───────────────────┘   │
                               ▼                       │
                    ┌──────────────────────────────┐   │
                    │     Input Validation          │◀──┘
                    │  - Zod schemas (max lengths)  │
                    │  - PDF magic byte check       │
                    │  - Request body size limit     │
                    └──────────┬───────────────────┘
                               ▼
                    ┌──────────────────────────────┐
                    │     Prompt Injection Defense  │
                    │  - Content delimiters         │
                    │  - Instruction hierarchy      │
                    │  - Input sanitization          │
                    └──────────┬───────────────────┘
                               ▼
                    ┌──────────────────────────────┐
                    │     Output Scanning           │
                    │  - Block dangerous patterns   │
                    │  - os.system, subprocess,     │
                    │    eval, exec, requests.post  │
                    └──────────┬───────────────────┘
                               ▼
                    ┌──────────────────────────────┐
                    │     Generic Error Responses   │
                    │  - No internal details leaked │
                    └──────────────────────────────┘
```

### Generation History (Session-scoped)
```
┌─────────────────────────────────┐
│  React Context: HistoryProvider │
│                                 │
│  entries: [{                    │
│    id, paperTitle, timestamp,   │
│    notebookJson, cellCount      │
│  }]                             │
│                                 │
│  addEntry(), getEntry()         │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  HistoryDrawer Component        │
│  - List of past generations     │
│  - Click to re-download         │
│  - Session-only (no persistence)│
└─────────────────────────────────┘
```

### Tech Stack (unchanged from v1)
- Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- OpenAI SDK with gpt-5.4 (max_completion_tokens: 32000)
- pdf-parse v1.1.1 for text extraction
- Zod for input validation
- No database — history stored in React state (session-scoped)

## Out of Scope (v3+)
- Authentication and user accounts
- Persistent storage / database for history
- Deployment infrastructure (Vercel/Railway)
- Model selection (sticking with gpt-5.4)
- "Open in Colab" via Gist (requires GitHub auth)
- OCR for scanned PDFs

## Dependencies
- Sprint v1 complete (all 10 tasks done, 38 tests passing)
- v1 security audit completed with 14 findings documented
