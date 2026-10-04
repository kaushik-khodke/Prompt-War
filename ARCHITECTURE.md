# 🏗️ MyHealthChain — Architecture Blueprint
### *Context-Aware Clinical Decision Intelligence Grounded in Longitudinal Patient Records*

---

## 📐 1. High-Level Architecture Topology

MyHealthChain Personal Health Decision Coach is built on a clean, decoupled 4-tier architecture designed for rapid Cloud Run container deployment, high testability, and zero ungrounded clinical claims:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              1. ACCESSIBLE PATIENT PORTAL                              │
│  [🩺 Personal Health Decision Coach]     [📊 Longitudinal Records Preview]             │
│  • WCAG 2.1 Level AA Compliant           • Live Verified EHR Documents (17 Loaded)     │
│  • Dual Stated Intent & Priority Inputs  • Dynamic 4-Pillar Visual Feedback             │
│  • 1-Click Clinical Scenario Presets     • Socratic Probing Reflections for Doctor     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS / REST (Pydantic Validated)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            2. SECURE FASTAPI BACKEND LAYER                             │
│  • Pydantic Schema Validation & Sanitization (Min 5, Max 1500 chars)                   │
│  • Token Verification & Patient Context Resolution                                    │
│  • Security Guardrails: CSP, X-Content-Type-Options, X-Frame-Options                   │
│  • Endpoints: POST /coach/analyze, GET /coach/patient-records-summary, /sample-profiles │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
┌──────────────────────────────────────────┐  ┌──────────────────────────────────────────┐
│  3A. DETERMINISTIC HEURISTIC ENGINE      │  │    3B. COGNITIVE REASONING ENGINE        │
│  (O(1) Deterministic Baseline)           │  │    (Google Gemini 2.5 Flash Grounded)    │
│  • Blood Pressure Discrepancy Evaluation │  │  • Contextual Gap Analysis Engine        │
│  • Lipid Panel & Statin Adherence Audits │  │  • Strict JSON Schema Formatting         │
│  • Historical Symptom Recurrence Checks  │  │  • Verified Record Citation Enforcer     │
│  • Sub-1ms Execution & Offline Fallback  │  │  • Shared Doctor-Patient Socratic Prompts│
└──────────────────────────────────────────┘  └──────────────────────────────────────────┘
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           4. DATA & OBSERVABILITY INFRASTRUCTURE                       │
│  [🗄️ Supabase EHR Storage]                [📡 Langfuse LLM Observability]              │
│  • Records Table (Lab Reports & Vitals)   • End-to-End Latency & Cost Tracking         │
│  • Document Chunks Table                  • Grounding Score & Hallucination Audit      │
│  • Patient Longitudinal Profiles          • Prompt Versioning & Quality Governance     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔁 2. End-to-End Decision Critique Workflow

```
[Patient Inputs Decision & Priorities]
               │
               ▼
[Validate Schema & Extract Live EHR Records from Supabase]
               │
               ▼
[Execute O(1) Deterministic Heuristic Analysis]
               │
               ▼
[Construct Grounded Clinical Context for Google Gemini 2.5 Flash]
               │
               ▼
[Synthesize Discrepancy into The 4 Core Cognitive Pillars]
 ├── Pillar 1: Overlooked Factors (Citing exact BP / LDL from records)
 ├── Pillar 2: Assumptions to Challenge (Contrasting subjective belief with clinical reality)
 ├── Pillar 3: Stated Priorities vs. Records (Identifying savings vs. emergency paradoxes)
 └── Pillar 4: Socratic Probing Questions (Empowering doctor-patient consultations)
               │
               ▼
[Record Telemetry & Grounding Score in Langfuse]
               │
               ▼
[Deliver Accessible, High-Contrast Synthesis to Patient UI]
```

---

## 🔒 3. Security & Cloud Run Runtime Topology

1. **Multi-Stage Container:** Docker builds production Vite assets and Python dependencies in separate builder stages, transferring only compiled artifacts into a lightweight `python:3.12-slim` runner.
2. **Non-Root Execution:** Container executes under unprivileged system user `appuser` (UID 10001, GID 10001).
3. **Stateless Scalability:** Cloud Run automatically scales from 0 to 10 instances with sub-3 second cold starts and dynamic `$PORT` binding.
