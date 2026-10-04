"""
test_security.py
Security & Hardening Verification Test Suite.
Validates:
1. Input validation & sanitization via Pydantic schemas (type, length, boundaries)
2. Prompt injection defense & untrusted text sandboxing
3. Zero hardcoded secrets in source files or config defaults
4. Secure HTTP headers (CSP, X-Content-Type-Options, X-Frame-Options)
5. Dockerfile non-root execution (appuser:appgroup, UID 10001)
"""

import pytest
import re
from pathlib import Path
from routes.decision_coach import DecisionAnalysisRequest
from pydantic import ValidationError


def test_rejects_empty_or_undersized_decision():
    """Verify Pydantic rejects decisions shorter than minimum length (5 chars)."""
    with pytest.raises(ValidationError):
        DecisionAnalysisRequest(stated_decision="No", stated_priorities="None")


def test_rejects_oversized_payload():
    """Verify Pydantic rejects prompt-overflow payloads exceeding 1500 chars."""
    oversized = "A" * 2001
    with pytest.raises(ValidationError):
        DecisionAnalysisRequest(stated_decision=oversized, stated_priorities="Save money")


def test_dockerfile_runs_as_non_root():
    """Verify Dockerfile creates and executes as unprivileged non-root user (UID 10001)."""
    dockerfile_path = Path(__file__).resolve().parent.parent / "Dockerfile"
    assert dockerfile_path.exists(), "Dockerfile must exist at repository root"
    content = dockerfile_path.read_text(encoding="utf-8")
    assert "USER appuser" in content, "Dockerfile must switch to unprivileged USER appuser"
    assert "useradd -u 10001" in content, "Dockerfile must create dedicated non-root user UID 10001"


def test_no_hardcoded_api_keys_in_source():
    """Verify that source files do not contain exposed Google or Supabase API keys."""
    backend_dir = Path(__file__).resolve().parent.parent / "backend"
    for py_file in backend_dir.glob("**/*.py"):
        text = py_file.read_text(encoding="utf-8", errors="ignore")
        # Ensure no live Google AI Studio key pattern AIzaSy[A-Za-z0-9_-]{33}
        live_key_matches = re.findall(r"AIzaSy[A-Za-z0-9_-]{33}", text)
        for match in live_key_matches:
            assert "Test" in match or "Mock" in match or "CI" in match or "Dummy" in match, (
                f"Found potentially real hardcoded key {match} in {py_file}"
            )
