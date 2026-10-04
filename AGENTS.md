# AGENTS.md — PromptWars Mission Brief

> Read this file completely before writing any code. It overrides default habits.
> Applies to every AI agent in this repo (Antigravity, Cursor, or any other).

## 1. THE ONE GOAL

Maximize the **AI Evaluation Score (/100)** for this repository.
The submission is graded automatically by an AI that reads the GitHub repo and the deployed Cloud Run app. Every decision must be justified by: *"Does this raise a score on the rubric below?"*
If a feature does not help a rubric item, do not build it.

### Rubric (weights are by impact tier)

| Criterion | Impact | What the grader checks |
|---|---|---|
| **Problem Statement Alignment** | HIGH | How accurately the solution targets the root challenge, user needs, and core objectives |
| **Code Quality** | HIGH | Clean, readable, well-structured, maintainable code |
| **Security** | MEDIUM | Safe practices, no common vulnerabilities |
| **Efficiency** | MEDIUM | Sensible use of time and memory |
| **Testing** | LOW | How easily the code can be tested, validated, maintained |
| **Accessibility** | LOW | Usable by diverse users and environments |
| **Google Services** | (scored in breakdown) | Meaningful use of Google services (see §8) |

Low-impact still counts toward a perfect score. **Do all seven. Never skip one because it is "low impact".**
A previous run of this kind scored 0 on Problem Statement Alignment and Google Services and under 20 on Efficiency, Testing and Accessibility. Those are the gaps to close first.

## 2. HARD RULES (breaking any can void the submission)

1. Repo is **public**.
2. **One branch only** (`main`). Never create other branches. Delete any that appear.
3. Repo size **< 10 MB**. No `node_modules`, `venv`, build output, datasets, model weights, videos, or large images. Keep a correct `.gitignore`.
4. Maximum **2 submission attempts** — the first must already be near-final. Do not treat attempt 1 as a draft.
5. Commit and push regularly with meaningful messages (Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`).
6. Must be deployable to **Google Cloud Run** (a Cloud Run URL is required).
7. A **README** is mandatory (see §9).
8. Never commit secrets, API keys, `.env` files, or credentials.

## 3. FIRST STEP — UNDERSTAND BEFORE BUILDING

Before any code:
1. Read the problem statement and the chosen challenge vertical/persona.
2. Write `docs/PROBLEM_ANALYSIS.md` (short): the root problem, target user, core objectives, success criteria, assumptions.
3. Map each requirement to a planned feature and a planned test.
4. Only then scaffold the project.

Challenge expectations the grader looks for:
- A **smart, dynamic assistant**
- **Logical decision-making based on user context** (not a static page or a thin chatbot wrapper)
- **Practical, real-world usability**
- **Clean, maintainable code**

The solution must clearly commit to **one chosen vertical/persona**, and its logic must visibly reflect that persona.

## 4. PROBLEM STATEMENT ALIGNMENT (HIGH)

- Every feature traces back to a stated objective. Keep a requirement → feature → test table in the README.
- Use the problem statement's own vocabulary in code names, UI text, and docs so alignment is obvious to a reader.
- Implement real context-aware logic: the assistant must take user input/context, make a decision, and explain the result. Put this logic in plain, testable functions, not buried in prompts.
- Handle realistic edge cases (empty input, ambiguous input, out-of-scope requests) gracefully.
- Ship a working end-to-end flow rather than many half-built features. Depth beats breadth.

## 5. CODE QUALITY (HIGH)

- Clear layered structure, for example:
  ```
  /src
    /api         # routes / controllers (thin)
    /services    # business + decision logic (pure where possible)
    /models      # schemas / types
    /utils       # helpers
    /config      # settings from env
  /tests
  /docs
  Dockerfile  README.md  AGENTS.md  .gitignore  .env.example
  ```
- Single responsibility per module/function. Functions short (aim < 30 lines). No duplicated logic.
- Descriptive names. No magic numbers or strings; use named constants/config.
- Type hints / types everywhere (Python type hints or TypeScript strict mode).
- Docstrings/JSDoc on every public function and module explaining *why*, not just *what*.
- Consistent formatting and linting configured and passing (e.g. Ruff + Black, or ESLint + Prettier). Include the config files.
- No dead code, no commented-out blocks, no stray `print`/`console.log`; use a logger.
- Explicit error handling with meaningful messages. Never swallow exceptions.
- Keep dependencies minimal and pinned.

## 6. SECURITY (MEDIUM)

- Secrets only via environment variables or Google Secret Manager. Provide `.env.example` with placeholders only.
- Validate and sanitize **all** user input (type, length, allowed values) using a schema library (e.g. Pydantic / Zod).
- Guard against prompt injection: treat user text as data, separate it from system instructions, constrain model output formats, and never execute model output as code.
- Escape output in the UI (no unsafe `innerHTML`); set secure HTTP headers (CSP, X-Content-Type-Options, X-Frame-Options, etc.).
- Configure CORS to specific origins, not `*`.
- Add basic rate limiting on public endpoints.
- No `eval`, no shell string concatenation, no SQL string building (use parameters).
- Docker: run as a non-root user, slim base image, no secrets baked into the image.
- Don't leak stack traces or internals in error responses.
- Run a dependency audit (`pip-audit` / `npm audit`) and fix issues before submitting.

## 7. EFFICIENCY (MEDIUM) — and keep it measurable

- Choose the lightest approach that solves the problem; avoid heavy frameworks and unneeded dependencies.
- Use appropriate data structures; avoid O(n²) work where O(n) is possible.
- Cache repeated or expensive calls (LLM/API responses, static lookups) with sensible TTLs.
- Use async I/O for network calls, timeouts on every external request, and retries with backoff.
- Don't load large files fully into memory; stream when needed.
- Keep the Docker image small (multi-stage build, slim base) so cold starts on Cloud Run are fast.
- Limit LLM token usage: concise prompts, capped `max_tokens`, reuse context where possible.
- Frontend: minimal JS, lazy-load, compress assets, no oversized images.
- Document key efficiency decisions in the README.

## 8. GOOGLE SERVICES

The score breakdown includes a Google Services item, so use Google's stack **meaningfully**, not decoratively:
- Deploy on **Cloud Run** (required).
- Use **Gemini API** (Google AI Studio / Vertex AI) as the reasoning engine where an LLM is needed.
- Where it genuinely fits the problem, add other services (e.g. Firestore for state, Secret Manager for keys, Cloud Logging, Maps/Places, Translate, Cloud Storage).
- Explain in the README which Google services are used and why.
- Don't add a service that has no purpose; each must support a real feature.

## 9. TESTING (LOW impact, but build it properly)

- Use pytest (Python) or Vitest/Jest (JS).
- Unit-test all decision logic and utilities; integration-test the main API endpoints.
- Mock external APIs (Gemini, etc.) so tests are fast, deterministic, and need no keys.
- Cover: happy path, edge cases, invalid input, and security validation (e.g. rejects oversized/malicious input).
- Target **≥ 80% coverage** on core logic. Include the coverage config.
- One command runs everything (`make test` or `npm test`), documented in the README.
- Design code for testability: dependency injection, pure functions, small units.
- Add a minimal CI workflow (`.github/workflows/ci.yml`) running lint + tests on push to `main`.

## 10. ACCESSIBILITY (LOW impact, but build it properly)

- Semantic HTML (`header`, `nav`, `main`, `section`, `button`), one `h1`, logical heading order.
- Every input has a visible `<label>`; every image has meaningful `alt`.
- Full keyboard navigation with visible focus states; no keyboard traps.
- ARIA only where semantics aren't enough (`aria-live` for dynamic assistant replies, `role="alert"` for errors).
- Color contrast ≥ WCAG AA (4.5:1); never convey meaning by color alone.
- Responsive, mobile-first layout; works at 200% zoom; respects `prefers-reduced-motion` and `prefers-color-scheme`.
- Clear error messages and loading states; plain, simple language.
- Consider multilingual/low-bandwidth users when relevant to the persona.
- Set `lang` on `<html>` and a proper `<title>` and meta viewport.

## 11. README (mandatory sections)

1. **Chosen Vertical / Persona** — and why
2. **Problem & Objectives** (from the problem statement)
3. **Approach & Logic** — how decisions are made from user context
4. **How It Works** — architecture overview (short diagram or list) and a user flow
5. **Google Services Used** — and why
6. **Security, Efficiency, Accessibility** notes (what was done)
7. **Testing** — how to run, what is covered
8. **Setup & Run Locally**, **Deploy to Cloud Run**
9. **Assumptions Made**
10. **Requirement → Feature → Test traceability table**

Keep it accurate. Never claim a feature that does not exist.

## 12. WORKFLOW FOR EVERY TASK

1. State which rubric items the task improves.
2. Implement in small steps; keep code clean as you go (don't "clean up later").
3. Write or update tests alongside the code.
4. Run lint, type checks, tests. Fix failures before moving on.
5. Update the README/docs if behavior changed.
6. Commit to `main` with a Conventional Commit message and push.
7. Check repo size and that only one branch exists.

## 13. DEFINITION OF DONE — PRE-SUBMISSION CHECKLIST

Do not tell the user the project is ready until every box is true:

- [ ] Solution clearly targets the problem statement and chosen persona; end-to-end flow works
- [ ] Context-aware decision logic is real, explained, and tested
- [ ] Lint, formatting, and type checks pass; no dead code or secrets
- [ ] Input validation, injection defenses, security headers, rate limiting in place
- [ ] Dependencies audited and minimal; Docker image slim and non-root
- [ ] Caching, async I/O, and timeouts used where appropriate
- [ ] Tests pass; coverage ≥ 80% on core logic; CI workflow present
- [ ] Accessibility checklist (§10) satisfied and verified
- [ ] Google services integrated meaningfully and documented
- [ ] Deployed on Cloud Run; URL works from a fresh browser
- [ ] README complete with all sections (§11)
- [ ] Repo is public, **single branch**, **< 10 MB**
- [ ] Final self-review: score yourself 0–100 on each rubric item and fix anything below 90 before reporting

## 14. BEHAVIOR RULES FOR THE AGENT

- If something about the problem statement is unclear, ask the user rather than guessing.
- Prefer simple, correct, well-tested solutions over impressive but fragile ones.
- Never remove tests or lower standards to make things pass.
- Never create extra branches, large files, or throwaway artifacts in the repo.
- Report honestly what is done, what is missing, and the risk to the score.
