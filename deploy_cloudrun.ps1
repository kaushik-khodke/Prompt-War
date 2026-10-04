# ==============================================================================
# Google Cloud Run Automated Deployment Script (PowerShell)
# ==============================================================================
[CmdletBinding()]
param(
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [string]$ServiceName = "health-decision-coach",
    [string]$GeminiApiKey = ""
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🩺 MyHealthChain — Google Cloud Run Deployment Wizard   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify gcloud CLI availability
$gcloudCmd = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudCmd) {
    Write-Host "`n⚠️ Google Cloud SDK (gcloud) is not detected in your PATH." -ForegroundColor Yellow
    Write-Host "You can deploy in under 2 minutes using Google Cloud Shell with ZERO local installs:" -ForegroundColor White
    Write-Host "  1. Open: https://shell.cloud.google.com" -ForegroundColor Cyan
    Write-Host "  2. Run: git clone https://github.com/kaushik-khodke/Prompt-War.git && cd Prompt-War" -ForegroundColor White
    Write-Host "  3. Run: gcloud run deploy health-decision-coach --source . --region us-central1 --allow-unauthenticated" -ForegroundColor Green
    Write-Host "`nAlternatively, install the Google Cloud SDK locally from:" -ForegroundColor White
    Write-Host "  https://cloud.google.com/sdk/docs/install" -ForegroundColor Cyan
    exit 1
}

# 2. Resolve Project ID
if (-not $ProjectId) {
    $ProjectId = gcloud config get-value project 2>$null
    if (-not $ProjectId -or $ProjectId -eq "(unset)") {
        $ProjectId = Read-Host "Enter your Google Cloud Project ID"
    }
}

if (-not $ProjectId) {
    Write-Host "❌ Error: Google Cloud Project ID is required." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Using Project: $ProjectId" -ForegroundColor Green
Write-Host "✅ Target Region: $Region" -ForegroundColor Green
Write-Host "✅ Service Name:  $ServiceName" -ForegroundColor Green

# 3. Check for Gemini API key
if (-not $GeminiApiKey) {
    if ($env:GEMINI_API_KEY) {
        $GeminiApiKey = $env:GEMINI_API_KEY
    } elseif ($env:GOOGLE_API_KEY) {
        $GeminiApiKey = $env:GOOGLE_API_KEY
    }
}

# 4. Enable Required GCP APIs
Write-Host "`n🔧 Enabling Cloud Run and Cloud Build APIs..." -ForegroundColor Cyan
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project $ProjectId

# 5. Build and Deploy Container via Cloud Build
Write-Host "`n🚀 Deploying container directly to Google Cloud Run from source..." -ForegroundColor Cyan

$envVars = "ENVIRONMENT=production,PORT=8080"
if ($GeminiApiKey) {
    $envVars += ",GEMINI_API_KEY=$GeminiApiKey"
}

gcloud run deploy $ServiceName `
    --source . `
    --project $ProjectId `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars $envVars

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 SUCCESS! Your service is live on Google Cloud Run!" -ForegroundColor Green
    $serviceUrl = gcloud run services describe $ServiceName --project $ProjectId --region $Region --format "value(status.url)" 2>$null
    if ($serviceUrl) {
        Write-Host "🌐 Live Application URL: $serviceUrl" -ForegroundColor Cyan
        Write-Host "🩺 Health Status Probe:  $serviceUrl/health" -ForegroundColor White
        Write-Host "📑 API Documentation:    $serviceUrl/docs" -ForegroundColor White
    }
} else {
    Write-Host "`n❌ Deployment failed. Please review the gcloud log output above." -ForegroundColor Red
}
