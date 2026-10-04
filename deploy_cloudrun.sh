#!/usr/bin/env bash
# ==============================================================================
# Google Cloud Run Automated Deployment Script (Bash / Cloud Shell)
# ==============================================================================
set -e

SERVICE_NAME="${1:-health-decision-coach}"
REGION="${2:-us-central1}"

echo "=========================================================="
echo "  🩺 MyHealthChain — Google Cloud Run Deployment Wizard   "
echo "=========================================================="

if ! command -v gcloud &> /dev/null; then
    echo "⚠️ Error: gcloud command line tool not found in PATH."
    echo "Please run this script inside Google Cloud Shell or install Google Cloud SDK."
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
fi

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: Project ID is required."
    exit 1
fi

echo "✅ Using Project: $PROJECT_ID"
echo "✅ Target Region: $REGION"
echo "✅ Service Name:  $SERVICE_NAME"

echo "🔧 Enabling Cloud Run and Cloud Build APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project "$PROJECT_ID"

ENV_VARS="ENVIRONMENT=production,PORT=8080"
if [ -n "$GEMINI_API_KEY" ]; then
    ENV_VARS="$ENV_VARS,GEMINI_API_KEY=$GEMINI_API_KEY"
elif [ -n "$GOOGLE_API_KEY" ]; then
    ENV_VARS="$ENV_VARS,GEMINI_API_KEY=$GOOGLE_API_KEY"
fi

echo "🚀 Deploying to Google Cloud Run from source..."
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "$ENV_VARS"

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format "value(status.url)")

echo ""
echo "🎉 SUCCESS! Your service is live on Google Cloud Run!"
echo "🌐 Live Application URL: $SERVICE_URL"
echo "🩺 Health Status Probe:  $SERVICE_URL/health"
echo "📑 API Documentation:    $SERVICE_URL/docs"
