# Sprint v3 — PRD: Production-Ready (Testing + CI/CD + Cloud Deployment)

## Overview
Make Paper2Notebook production-ready with three pillars: (1) comprehensive test coverage following the testing pyramid (~70% unit, ~20% integration, ~10% E2E), including a real-world quality validation test using the "Attention Is All You Need" paper; (2) CI/CD pipeline via GitHub Actions with automated testing, security scanning, and merge gating; (3) Docker containerization and AWS ECS Fargate deployment via Terraform with automated CD.

## Goals
- All backend modules have thorough unit tests (≥70% of test count)
- Integration tests cover both API endpoints (`/api/parse`, `/api/generate`) with mocked OpenAI responses
- E2E Playwright tests cover the full user journey with screenshots at each step
- A real quality test generates a notebook from "Attention Is All You Need" and validates: valid JSON, ≥8 sections, valid Python syntax, safety disclaimer present
- GitHub Actions runs all tests + security scans on every push/PR, blocks merge on failure
- The app runs in Docker (single Next.js container) with docker-compose for local dev
- Terraform provisions AWS ECS Fargate infrastructure and CD auto-deploys on main after tests pass
- AWS credentials are stored as GitHub Actions secrets — NEVER committed to the repo

## User Stories
- As a developer, I want comprehensive tests so I can refactor with confidence and catch regressions early
- As a developer, I want a CI/CD pipeline so that broken code never reaches production
- As a DevOps engineer, I want infrastructure-as-code so I can reproduce the deployment from scratch
- As a user, I want the app deployed to a reliable cloud service so I can access it from anywhere

## Technical Architecture

### Testing Pyramid
```
                    ┌─────────┐
                    │  E2E    │  ~10% — Playwright browser tests
                    │ (3-5)   │  Full user flow with screenshots
                    ├─────────┤
                    │ Integr. │  ~20% — API endpoint tests
                    │ (8-12)  │  Mocked OpenAI, real HTTP
               ┌────┴─────────┴────┐
               │     Unit Tests     │  ~70% — All backend modules
               │     (30-40)        │  Pure logic, no I/O
               └────────────────────┘
```

### Modules to Test (unit)
| Module | File | Key Functions |
|--------|------|---------------|
| PDF Parser | `src/lib/pdf-parser.ts` | `parsePdf()` |
| Prompt Builder | `src/lib/prompt-builder.ts` | `buildNotebookPrompt()` |
| Notebook Assembler | `src/lib/notebook-assembler.ts` | `assembleNotebook()`, `repairAndParse()` |
| OpenAI Client | `src/lib/openai-client.ts` | `streamNotebookGeneration()` |
| Content Sanitizer | `src/lib/content-sanitizer.ts` | `sanitizePaperContent()` |
| Output Scanner | `src/lib/output-scanner.ts` | `scanAndSanitizeCode()` |
| Rate Limiter | `src/lib/rate-limiter.ts` | `RateLimiter.check()` |
| Notebook Types | `src/lib/notebook-types.ts` | `createEmptyNotebook()` |

### CI/CD Pipeline (GitHub Actions)
```
┌──────────────────────────────────────────────────────────┐
│                  on: push / pull_request                  │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ Unit Tests   │  │ Lint + Type │  │ Security Scans   │ │
│  │ (vitest)     │  │ Check       │  │ (npm audit +     │ │
│  │              │  │ (eslint +   │  │  semgrep)        │ │
│  │              │  │  tsc)       │  │                  │ │
│  └──────┬───────┘  └──────┬──────┘  └────────┬─────────┘ │
│         │                 │                   │           │
│         └────────┬────────┘───────────────────┘           │
│                  ▼                                        │
│         ┌────────────────┐                                │
│         │ Integration    │                                │
│         │ Tests          │                                │
│         └───────┬────────┘                                │
│                 ▼                                         │
│         ┌────────────────┐                                │
│         │ E2E Tests      │                                │
│         │ (Playwright)   │                                │
│         └───────┬────────┘                                │
│                 ▼                                         │
│         ┌────────────────┐     ┌──────────────────────┐  │
│         │ All pass?      │────▶│ Deploy to ECS Fargate│  │
│         │ (main only)    │     │ (CD step)            │  │
│         └────────────────┘     └──────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Docker Architecture
```
┌─────────────────────────────────────────────┐
│            docker-compose.yml                │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  paper2notebook (Next.js)              │  │
│  │  - Multi-stage build (deps → build →   │  │
│  │    production)                          │  │
│  │  - node:20-alpine                      │  │
│  │  - Port 3000                           │  │
│  │  - standalone output mode              │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### AWS ECS Fargate Architecture
```
┌──────────────────────────────────────────────────────────┐
│                         AWS                               │
│                                                           │
│  ┌──────────┐    ┌──────────┐    ┌─────────────────────┐ │
│  │  Route53  │───▶│   ALB    │───▶│  ECS Fargate        │ │
│  │ (domain)  │    │ (HTTPS)  │    │  ┌───────────────┐  │ │
│  │           │    │          │    │  │ Next.js Task  │  │ │
│  │           │    │          │    │  │ (256 CPU,     │  │ │
│  │           │    │          │    │  │  512 MB RAM)  │  │ │
│  └──────────┘    └──────────┘    │  └───────────────┘  │ │
│                                   └─────────────────────┘ │
│  ┌──────────┐    ┌──────────┐                             │
│  │   ECR    │    │ CloudWatch│                             │
│  │ (images) │    │  (logs)   │                             │
│  └──────────┘    └──────────┘                             │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack Additions
- **Testing**: Vitest (unit), Playwright (integration + E2E) — already in use
- **CI/CD**: GitHub Actions
- **Security**: npm audit (dependency vulnerabilities), semgrep (static analysis)
- **Containerization**: Docker multi-stage build, docker-compose
- **Infrastructure**: Terraform (AWS provider)
- **AWS Services**: ECR, ECS Fargate, ALB, CloudWatch, VPC

## Out of Scope (v4+)
- Custom domain and SSL certificate (Route53 + ACM)
- Auto-scaling policies (min/max task count)
- Database (RDS/DynamoDB) for persistent history
- CDN (CloudFront) for static assets
- Monitoring and alerting (PagerDuty/Opsgenie integration)
- Staging environment (single environment for now)
- ArXiv URL input (fetch papers by URL instead of upload)
- Multi-model support (Gemini, Claude, etc.)

## Dependencies
- Sprint v1 + v2 complete (20 tasks done, 78 tests passing)
- AWS IAM user `paper-to-notebook-deploy` created with ECS/ECR/VPC/ALB/CloudWatch policies
- AWS credentials stored as GitHub Actions secrets (NOT in repo)
- GitHub repository created (via `gh` CLI)
- Test PDF: `/Users/rajat/Desktop/MSD-PRD/NIPS-2017-attention-is-all-you-need-Paper (1).pdf`
