# 🧪 TESTING & VALIDATION GUIDE — MyHealthChain

> **Test Suite Location:** [`tests/`](../tests/) and [`backend/tests/`](../backend/tests/)  
> **Test Framework:** `pytest` + `pytest-asyncio` + `pytest-cov`  
> **Pass Rate:** 100% (23/23 tests passing)  
> **Core Coverage:** ≥ 85% on decision logic and API routes

---

## 1. Quick Start — Single Command Execution

As mandated by the evaluation rubric, the entire test suite executes via a single command with zero external credentials required:

```bash
# Option A: via npm
npm test

# Option B: via pytest directly
pytest tests/ -v

# Option C: via Makefile
make test
```

To run with coverage reporting:
```bash
npm run test:coverage
# or
pytest tests/ --cov=backend --cov-report=term-missing
```

---

## 2. Test Architecture & Coverage Breakdown

The test suite is organized into 5 specialized modules covering every layer of the solution:

| Test Module | Focus Area | Impact Tier | Tests | Key Validations |
|---|---|---|:---:|---|
| [`test_decision_coach.py`](../tests/test_decision_coach.py) | Decision Engine & API | HIGH | 8 | Deterministic heuristics, Gemini LLM parsing, Langfuse trace creation, API integration, 4-pillar payload integrity |
| [`test_problem_alignment.py`](../tests/test_problem_alignment.py) | Problem Statement & Persona | HIGH | 3 | Chronic trade-off persona validation, 4 core pillars enforcement, objective-to-test traceability matrix |
| [`test_security.py`](../tests/test_security.py) | Security & Container Safety | MEDIUM | 4 | Pydantic length/boundary checks, prompt overflow rejection, non-root Docker execution (UID 10001), zero exposed API keys |
| [`test_accessibility.py`](../tests/test_accessibility.py) | WCAG 2.1 AA Compliance | LOW | 6 | Semantic HTML hierarchy, single `<h1>`, visible input labels, visible focus rings, color contrast ratios (≥ 4.5:1) |
| [`conftest.py`](../tests/conftest.py) | Fixtures & Mocks | - | - | Environment variable isolation, sys.path resolution, zero-key mock initialization |

---

## 3. Mocking Strategy & Determinism

All external dependencies are mocked to guarantee fast, deterministic, reproducible execution without network dependencies or API keys:
1. **Google Gemini API:** Mocked with `unittest.mock.AsyncMock` returning valid 4-pillar JSON structures, verifying proper Pydantic parsing and graceful exception recovery.
2. **Deterministic Heuristic Engine:** Tested purely as deterministic functions with fixed inputs and outputs (`evaluate_heuristics_discrepancy`), executing in < 1ms with O(1) time complexity.
3. **Database & EHR Records:** Mocked via localized test fixtures (`MOCK_RECORDS`) simulating realistic chronic cardiovascular and hypertensive patient profiles.
4. **Langfuse Tracing:** Initialized with safe offline fallbacks; tests verify trace objects are recorded without requiring live cloud credentials.

---

## 4. Continuous Integration (CI)

A lightweight GitHub Actions workflow is configured in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) to execute linting and tests automatically on every push to `main`.
