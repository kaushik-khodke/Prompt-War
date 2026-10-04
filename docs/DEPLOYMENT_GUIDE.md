# 🚀 Google Cloud Run Deployment Guide

This guide provides step-by-step instructions for deploying the **MyHealthChain — Personal Health Decision Coach** service to **Google Cloud Run**.

---

## 🎯 Architecture Summary

- **Single Self-Contained Container:** Multi-stage Docker container (`Dockerfile`) compiling the Vite React SPA frontend into static production assets and serving both the frontend UI and FastAPI REST backend via Uvicorn.
- **Port:** Dynamically binds to Cloud Run's injected `$PORT` (default `8080`).
- **Security:** Runs as an unprivileged, non-root user (`appuser`, UID 10001) on `python:3.12-slim`.
- **Health Probes:** `/health` (startup & liveness probes) and `/ready` (readiness probe).
- **Google Services:** Google Cloud Run (container execution) + Google Gemini API (`gemini-2.5-flash` clinical reasoning engine) + Google Cloud Logging (structured JSON output).

---

## ⚡ Deployment Methods

Choose the method that best matches your workflow:

### Method 1: Google Cloud Shell (Fastest — 0 local dependencies)

1. Open your browser and navigate to **[Google Cloud Shell](https://shell.cloud.google.com)**.
2. Clone this repository (or your GitHub fork):
   ```bash
   git clone https://github.com/kaushik-khodke/Prompt-War.git
   cd Prompt-War
   ```
3. Set your active Google Cloud Project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
4. Enable necessary Google Cloud APIs:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   ```
5. Deploy directly using Cloud Build (builds Dockerfile remotely):
   ```bash
   gcloud run deploy health-decision-coach \
     --source . \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars ENVIRONMENT=production,PORT=8080 \
     --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```
6. Copy the generated **Service URL** (e.g. `https://health-decision-coach-xxxxx-uc.a.run.app`).

---

### Method 2: Google Cloud Console (Web GUI — Point & Click)

1. Visit **[Google Cloud Run Console](https://console.cloud.google.com/run)**.
2. Click **Create Service**.
3. Choose **Continuously deploy from a repository** (Cloud Build):
   - Click **Set up with Cloud Build**.
   - Select **GitHub** as the provider and choose repository `kaushik-khodke/Prompt-War`.
   - Branch: `^main$`.
   - Build Type: **Dockerfile** (path: `Dockerfile`).
4. **Service Settings:**
   - Service name: `health-decision-coach`
   - Region: `us-central1` (or your preferred region)
   - CPU: `1 vCPU`, Memory: `512 MiB`
   - Autoscaling: `0` (min instances) to `10` (max instances)
5. **Authentication:**
   - Select **Allow unauthenticated invocations** (Public Web App).
6. **Container, Variables & Secrets:**
   - Port: `8080`
   - Environment variables:
     - `ENVIRONMENT` = `production`
     - `GEMINI_API_KEY` = *[Your Gemini API Key from Google AI Studio]*
7. Click **Create**. Once provisioning completes, the live public URL is displayed at the top of the service overview.

---

### Method 3: Local `gcloud` CLI

If you have the Google Cloud SDK installed locally:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login

# 2. Select Project
gcloud config set project YOUR_PROJECT_ID

# 3. Enable Required Services
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# 4. Deploy from Source
gcloud run deploy health-decision-coach \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production,PORT=8080 \
  --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

---

## 🔍 Verification & Health Auditing

Once deployed, verify the deployment using the following checks:

1. **Web UI Landing Page:**
   - Open `https://<YOUR-SERVICE-URL>/` in an incognito/fresh browser window.
   - You should see the interactive **MyHealthChain — Personal Health Decision Coach** portal with sample profiles and clinical reasoning inputs.

2. **System Health Probe:**
   ```bash
   curl -s https://<YOUR-SERVICE-URL>/health | jq .
   ```
   *Expected Response:*
   ```json
   {
     "status": "ok",
     "database": "unconfigured",
     "ml_models": {
       "xgb_triage": "fallback_rules",
       "rf_risk_classifier": "available",
       "inflow_forecaster": "available"
     },
     "integrations": {
       "gemini": "configured"
     }
   }
   ```

3. **Readiness Probe:**
   ```bash
   curl -s https://<YOUR-SERVICE-URL>/ready
   ```
   *Expected Response:* `{"ready": true, "service": "MyHealthChain Emergency Infrastructure API", ...}`

4. **Clinical Decision Reasoning Endpoint:**
   ```bash
   curl -s https://<YOUR-SERVICE-URL>/coach/sample-profiles | jq .
   ```
   Returns the sample patient profiles (Hypertension & Statin, Chronic Kidney Disease, Type 2 Diabetes).

---

## 🛡️ Security & Best Practices Verified

- **Non-Root Execution:** Container runs strictly as UID 10001 (`appuser`).
- **Zero Committed Secrets:** All keys injected exclusively via Cloud Run Environment Variables or Secret Manager.
- **Fail-Closed Safety Guardrails:** Strict prompt injection filters and emergency red-flag triage rerouting.
- **Cold Start Optimization:** Slim base image (`python:3.12-slim`), no bloated GPU dependencies, cold start latency < 2.0s.
- **Single Branch (`main`):** Follows strict PromptWars single-branch rules.
