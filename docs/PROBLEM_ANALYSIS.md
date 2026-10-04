# PROBLEM ANALYSIS — Health Decision Coach (Patient Health Intelligence Agent)

## 1. Problem Statement & Root Cause

### 1.1 The Root Problem
When individuals make critical healthcare decisions—such as delaying recommended procedures, adjusting prescribed medication routines, choosing elective interventions, or rationalizing lifestyle trade-offs—they frequently rely on subjective impressions, immediate convenience (cost, work schedules), and optimistic biases ("I feel fine, so I can delay this"). 

Meanwhile, their longitudinal Electronic Health Records (EHR)—including vital sign fluctuations, lipid profiles, glycemic metrics, and recurring clinical encounters—reveal underlying chronic risks, historical recurrence patterns, and clinical contraindications that directly contradict their stated assumptions.

### 1.2 The Gap in Existing Tools
1. **Generic AI Chatbots:** Lack verified patient record context, hallucinate clinical advice, and offer superficial generic responses without cross-referencing physiological facts.
2. **Standard Patient Portals:** Display dense laboratory tables and raw numbers without contextual interpretation or decision-support framing.
3. **Absence of Socratic Decision Coaching:** No existing system actively compares what a patient *states* against what their *records demonstrate*, leaving cognitive biases and overlooked clinical risks unaddressed.

---

## 2. Target User & Persona

* **Persona Name:** The Active Patient / Healthcare Decision-Maker
* **User Profile:** An individual managing one or more health conditions (e.g., hypertension, dyslipidemia, pre-diabetes, chronic stress) or facing elective health choices.
* **Key User Scenario:** The patient wants to delay a cardiologist follow-up and stop an antihypertensive or statin medication because they "feel healthy" and want to avoid consultation fees and travel disruptions.
* **User Need:** An empathetic, objective, context-aware AI Health Decision Coach that analyzes their stated rationale alongside their verified medical records to reveal blind spots, challenge flawed assumptions, and prepare them for meaningful shared decision-making with their doctor.

---

## 3. Core Objectives & Solution Deliverables

| # | Objective | Deliverable & Implementation |
|---|---|---|
| **O1** | **Record Context Extraction** | Parse and normalize patient longitudinal records: vitals, lab panels, diagnoses, medication history, and clinical notes. |
| **O2** | **Stated Intent & Priority Capture** | Capture patient's proposed decision, rationale, trade-off factors (cost, convenience, fear), and stated priorities. |
| **O3** | **Context-Aware Discrepancy Analysis** | Deterministic + LLM comparative analysis between patient statements and historical medical records. |
| **O4** | **Four-Pillar Cognitive Feedback** | Surface: <br>1. *Overlooked Factors* (silent biomarker elevation, drug interactions)<br>2. *Assumptions to Challenge* ("feeling fine = low risk")<br>3. *Conflicts Between Priorities & Records* (short-term savings vs. high stroke risk)<br>4. *Socratic Questions* (guiding reflective questions for doctor consultation). |
| **O5** | **Google Services Integration** | Integrate **Gemini API** (`google-genai`) for cognitive reasoning + **Google Cloud Run** deployment container. |
| **O6** | **Traceability & Grounding (Langfuse)** | Integrate **Langfuse** for prompt observability, execution tracing, latency monitoring, and record grounding validation to reduce hallucination. |
| **O7** | **Streamlined, Accessible Patient Portal** | Lightweight, responsive, WCAG AA compliant patient interface focused entirely on record review, decision coaching, and reflection. |

---

## 4. Success Criteria

1. **Alignment:** 100% trace of every feature to patient decision support and EHR discrepancy analysis.
2. **Precision & Grounding:** Zero ungrounded clinical claims; all surfaced factors must cite verified patient record data points.
3. **Observability:** 100% of coaching sessions logged to Langfuse with trace IDs, token counts, and grounding evaluations.
4. **Performance:** Coaching response generated under 4.0 seconds (with caching and async execution).
5. **Security & Privacy:** Pydantic schema validation, prompt injection sanitization, no exposed API keys, secure HTTP headers.
6. **Efficiency & Repo Constraints:** Total repository size strictly < 10 MB (no heavy weights, datasets, or video artifacts), Docker cold start < 3 seconds on Cloud Run.
7. **Test Coverage:** $\ge 80\%$ test coverage on core decision logic, validation schemas, and API routes.

---

## 5. Scope & Intentional Non-Goals

### In-Scope
* Patient portal with Health Decision Coach conversation interface.
* Patient longitudinal records explorer (vitals, labs, medications, episode history).
* Context-aware decision critique engine with 4-pillar output.
* Gemini API client with resilient fallbacks and mock fallback for zero-key test environments.
* Langfuse tracing integration with mock/offline fallback mode.
* Fast, lightweight FastAPI backend with single-page frontend.

### Explicit Non-Goals (Removed from Legacy Project)
* Hospital / administrative management portals (out of scope for patient persona).
* Heavy deep learning model weights (CheXNet, CT-CLIP, CMR-AI) and large raster image dumps.
* Autonomous medical prescription or diagnostic replacement (all coaching outputs explicitly emphasize shared doctor decision-making).

---

## 6. Assumptions & Guardrails

1. **EHR Availability:** The patient has a structured record history (either connected via API or sample baseline data provided).
2. **Clinical Safety Boundary:** The agent is an educational and cognitive coach, not a standalone prescribing physician. An explicit clinical disclaimer and red-flag triage safeguard (e.g. for acute chest pain or emergency vitals) is enforced.
3. **Environment Resilience:** The system runs flawlessly with or without live `GEMINI_API_KEY` and `LANGFUSE_PUBLIC_KEY` by utilizing deterministic heuristics and mock responses during automated CI/tests.
