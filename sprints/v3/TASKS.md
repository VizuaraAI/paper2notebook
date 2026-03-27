# Sprint v3 — Tasks

## Status: Not Started

---

## PHASE 1: TESTING (Tasks 1–4)

- [ ] Task 1: Add minimal unit tests for untested backend modules (P1)
  - Acceptance: Add lightweight unit tests for `pdf-parser.ts` and `openai-client.ts` (the two modules without unit tests). Keep it minimal — 3-5 tests per module covering happy path and one error case. Existing unit tests (44) remain passing. Total unit count reaches ~50. All pass with `npx vitest run`.
  - Files: tests/unit/pdf-parser.test.ts (new), tests/unit/openai-client.test.ts (new)

- [ ] Task 2: Add minimal integration tests for both API endpoints (P1)
  - Acceptance: Add 2-3 integration tests per API route covering: `/api/parse` — valid PDF returns 200, non-PDF returns 400; `/api/generate` — missing body returns 400, invalid JSON returns 400. Keep it lightweight — no mocked OpenAI streaming needed. Existing integration tests (10) remain passing. All pass with `npx playwright test tests/integration/`.
  - Files: tests/integration/api-parse-v3.spec.ts (new), tests/integration/api-generate-v3.spec.ts (new)

- [x] Task 3: Add comprehensive E2E Playwright test with screenshots at every step (P0)
  - Acceptance: E2E test covers the full user flow with mocked API responses: (1) land on page → screenshot `01-landing.png`, (2) enter API key "sk-test-key" → screenshot `02-api-key-entered.png`, (3) click Continue → see upload step → screenshot `03-upload-step.png`, (4) upload test PDF → screenshot `04-file-selected.png`, (5) click Generate → see progress spinner → screenshot `05-generating.png`, (6) generation completes → see results with download button → screenshot `06-results.png`, (7) verify History drawer shows entry → screenshot `07-history.png`, (8) click "Generate another" → back to upload → screenshot `08-reset.png`. All screenshots saved to `tests/screenshots/v3-e2e-flow/`. Passes with `npx playwright test tests/e2e/v3-full-flow.spec.ts`.
  - Files: tests/e2e/v3-full-flow.spec.ts (new), tests/screenshots/v3-e2e-flow/ (new directory)
  - Completed: 2026-03-27 — Full 8-step E2E flow with mocked APIs, all 8 screenshots captured. 1 test passing.

- [x] Task 4: Real quality validation test — "Attention Is All You Need" with live browser (P0)
  - Acceptance: A standalone Playwright test script that: (1) opens a VISIBLE browser (headless: false, slowMo: 500), (2) navigates to localhost:3000, takes screenshot, (3) prompts the user in the terminal to enter their OpenAI API key (using readline or a dialog), (4) types the API key into the input, takes screenshot, (5) clicks Continue, uploads `/Users/rajat/Desktop/MSD-PRD/NIPS-2017-attention-is-all-you-need-Paper (1).pdf`, takes screenshot, (6) clicks Generate Notebook, takes screenshot of progress, (7) waits for completion (timeout: 5 minutes), takes screenshot of results, (8) intercepts or reads the download — validates the notebook: (a) valid JSON, (b) `cells` array with ≥8 entries, (c) ≥3 code cells and ≥3 markdown cells, (d) at least one cell mentions "attention" or "transformer", (e) no dangerous patterns (os.system, subprocess, eval), (f) has a markdown cell with paper title or citation. (9) Prints a validation report to the terminal with pass/fail for each check. (10) All screenshots saved to `tests/screenshots/v3-real-quality/`. Script is run manually via `npx playwright test tests/e2e/v3-real-quality.spec.ts --headed` and is tagged to skip in CI. Clear instructions in file header on how to run.
  - Files: tests/e2e/v3-real-quality.spec.ts (new), tests/screenshots/v3-real-quality/ (new directory)
  - Completed: 2026-03-27 — Real quality test with visible browser, window.prompt for API key, 7-check validation (JSON, ≥8 cells, code/markdown counts, Python patterns, attention/transformer mention, no dangerous code, paper title). Playwright config updated with "real" project (headless: false, slowMo: 500). Skipped in CI.

---

## PHASE 2: CI/CD PIPELINE (Tasks 5–7)

- [x] Task 5: Create GitHub repo and CI workflow for tests + lint + typecheck (P0)
  - Acceptance: Git remote set up via `gh repo create` (public or private per user preference). GitHub Actions workflow `.github/workflows/ci.yml` runs on push and PR to `main`. Jobs: (1) `lint-typecheck` — `npx next lint` + `npx tsc --noEmit`, (2) `unit-tests` — `npx vitest run`, (3) `e2e-tests` — installs Playwright browsers, starts dev server, runs `npx playwright test` (excludes `@real` tagged tests). All jobs on `ubuntu-latest` with Node 20. Playwright browsers cached. Workflow passes on current codebase.
  - Files: .github/workflows/ci.yml (new)
  - Completed: 2026-03-27 — Repo created at github.com/VizuaraAI/paper2notebook. CI workflow with 3 jobs all passing: lint+typecheck (40s), unit tests (34s), E2E+integration (1m40s). Playwright browser cache and screenshot artifact upload included.

- [ ] Task 6: Add security scanning — npm audit + semgrep (P0)
  - Acceptance: CI workflow gets two additional parallel jobs: (1) `dependency-audit` — `npm audit --audit-level=high`, (2) `static-analysis` — semgrep with `p/javascript` + `p/typescript` rulesets. Both block merge on failure. Fix any existing findings. Workflow passes clean.
  - Files: .github/workflows/ci.yml (update)

- [ ] Task 7: Configure branch protection + credential safety (P1)
  - Acceptance: Branch protection on `main` via `gh api`: require status checks to pass, require PR before merge. Verify `.gitignore` blocks `aws_cred.md`, `*.pem`, `.env*`. Add AWS credentials as GitHub Actions secrets via `gh secret set AWS_ACCESS_KEY_ID` and `gh secret set AWS_SECRET_ACCESS_KEY`. Verify secrets are set with `gh secret list`.
  - Files: .gitignore (verify)

---

## PHASE 3: DOCKER & CLOUD DEPLOYMENT (Tasks 8–10)

- [ ] Task 8: Create Dockerfile with multi-stage build for Next.js standalone (P0)
  - Acceptance: Multi-stage Dockerfile: (1) `deps` — node:20-alpine, install production deps, (2) `builder` — copy source, `next build` with standalone output, (3) `runner` — node:20-alpine, copy standalone + static + public, non-root user, port 3000. Update `next.config.mjs` to add `output: "standalone"`. Create `.dockerignore` (exclude node_modules, .next, .git, tests, aws_cred.md, infra/). `docker build -t paper2notebook .` succeeds. `docker run -p 3000:3000 paper2notebook` serves the app. Image under 250MB.
  - Files: Dockerfile (new), .dockerignore (new), next.config.mjs (update)

- [ ] Task 9: Create docker-compose.yml for local orchestration (P1)
  - Acceptance: `docker-compose.yml` with single `app` service: builds from Dockerfile, maps 3000:3000, passes env vars. `docker compose up --build` starts app successfully. Add a `docker-compose.dev.yml` override with volume mount + `next dev` command for hot-reload development.
  - Files: docker-compose.yml (new), docker-compose.dev.yml (new)

- [ ] Task 10: Terraform for AWS ECS Fargate + CD pipeline (P0)
  - Acceptance: `infra/` directory with Terraform: (1) `main.tf` — VPC (2 public subnets), ECS cluster, ECR repo, Fargate task definition (256 CPU, 512MB), Fargate service (desired count 1), ALB + target group + listener (port 80 → 3000), CloudWatch log group, security groups (ALB: 80 inbound, ECS: 3000 from ALB), IAM roles (task execution + task role), (2) `variables.tf` — aws_region (us-east-1), app_name (paper2notebook), container_port (3000), (3) `outputs.tf` — ALB DNS, ECR URL, ECS cluster name. CD workflow `.github/workflows/cd.yml`: triggers after CI passes on `main`, logs into ECR, builds + pushes Docker image, updates ECS service to force new deployment. Uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from GitHub secrets. `terraform init` and `terraform validate` pass. CD workflow is syntactically valid YAML.
  - Files: infra/main.tf (new), infra/variables.tf (new), infra/outputs.tf (new), .github/workflows/cd.yml (new)
