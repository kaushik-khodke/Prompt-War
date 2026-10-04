# ==============================================================================
# Stage 1: Build Production Frontend (Vite + React + TypeScript)
# ==============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Cache dependency layer
COPY frontend/package*.json ./
RUN npm ci --no-audit --prefer-offline || npm install --no-audit

# Build static SPA assets
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Build & Dependency Wheel Cache for Python Backend
# ==============================================================================
FROM python:3.12-slim AS python-builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ==============================================================================
# Stage 3: Production Non-Root Runtime Container (Optimized for Cloud Run)
# ==============================================================================
FROM python:3.12-slim AS runner

# Security: Create non-root system group and user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

WORKDIR /app

# Copy installed python wheels from python-builder
COPY --from=python-builder --chown=appuser:appgroup /root/.local /home/appuser/.local

# Copy backend source code with proper non-root ownership
COPY --chown=appuser:appgroup backend/ /app/

# Copy compiled frontend static assets from frontend-builder
COPY --from=frontend-builder --chown=appuser:appgroup /frontend/dist /app/static_dist

ENV PATH=/home/appuser/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

# Switch to unprivileged non-root execution
USER appuser

EXPOSE 8080

# Cloud Run binds to $PORT dynamically
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
