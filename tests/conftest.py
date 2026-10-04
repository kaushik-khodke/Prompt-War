"""
conftest.py
Global pytest configuration and fixtures for MyHealthChain test suite.
Configures test environment, path resolution, and mock dependencies.
"""

import sys
import os
from pathlib import Path

# Add backend and root to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(root_dir))

# Configure test environment variables
os.environ["ENVIRONMENT"] = "test"
os.environ["TESTING"] = "true"
os.environ["DEBUG"] = "false"
os.environ["GEMINI_API_KEY"] = "AIzaSyTestMockKeyForCIValidation12345"
os.environ["SUPABASE_URL"] = "https://mock-test-project.supabase.co"
os.environ["SUPABASE_KEY"] = "mock-supabase-test-key-for-unit-testing"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-mock-test-key"
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-mock-test-key"
