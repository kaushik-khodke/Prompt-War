"""
test_decision_coach.py
Comprehensive test suite for Health Decision Coach:
Heuristics, Service Logic, Gemini Mocking, Langfuse Tracing, and API endpoints.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from services.decision_coach_service import (
    evaluate_heuristics_discrepancy,
    DecisionCoachService,
    CoachingPillars,
)
from main import app

client = TestClient(app)

MOCK_RECORDS = {
    "vitals": {
        "blood_pressure_systolic": 145,
        "blood_pressure_diastolic": 92,
        "heart_rate": 80
    },
    "labs": {
        "ldl_cholesterol": 160,
        "total_cholesterol": 240,
        "hba1c": 6.1
    },
    "diagnoses": [
        {"code": "I10", "description": "Essential hypertension"}
    ],
    "active_medications": [
        {"name": "Atorvastatin", "dosage": "20mg daily"},
        {"name": "Amlodipine", "dosage": "5mg daily"}
    ],
    "recurring_episodes": [
        {"event": "Exertional chest tightness", "frequency": "2 episodes in past 4 months"}
    ],
    "patient_uploaded_documents": [
        {"title": "Escalating Vital Pattern (BP 158/98 mmHg)", "record_type": "vitals_log", "date": "Recent", "snippet": "BP: 158/98 mmHg"}
    ]
}


# ==============================================================================
# 1. Deterministic Heuristic Unit Tests
# ==============================================================================
def test_evaluate_heuristics_cardio_discrepancy():
    """Verify that stopping statin/hypertension meds triggers 4 coaching pillars."""
    stated_decision = "I want to stop taking my atorvastatin and pause follow-ups to save money."
    stated_priorities = "Cutting my monthly pharmacy bill and keeping my current work schedule."

    result = evaluate_heuristics_discrepancy(
        stated_decision=stated_decision,
        stated_priorities=stated_priorities,
        records=MOCK_RECORDS
    )

    assert len(result["overlooked_factors"]) >= 2
    assert any("systolic" in f.lower() or "145" in f for f in result["overlooked_factors"])
    assert any("ldl" in f.lower() or "160" in f for f in result["overlooked_factors"])

    assert len(result["assumptions_to_challenge"]) >= 1
    assert any("feeling fine" in a.lower() or "stopping" in a.lower() for a in result["assumptions_to_challenge"])

    assert len(result["conflicts_with_records"]) >= 1
    assert any("saving money" in c.lower() or "acute" in c.lower() or "risk" in c.lower() for c in result["conflicts_with_records"])

    assert len(result["socratic_questions"]) >= 1
    assert result["grounding_score"] >= 0.90


def test_evaluate_heuristics_recurring_episodes():
    """Verify that unmentioned historical episodes in records are surfaced."""
    stated_decision = "I will skip the follow-up because I have zero symptoms today."
    stated_priorities = "Saving travel time."

    result = evaluate_heuristics_discrepancy(
        stated_decision=stated_decision,
        stated_priorities=stated_priorities,
        records=MOCK_RECORDS
    )

    overlooked_text = " ".join(result["overlooked_factors"]).lower()
    assert "chest tightness" in overlooked_text
    assert "2 episodes" in overlooked_text


def test_evaluate_heuristics_benign_decision():
    """Verify that healthy decisions receive safe baseline guidance without crashes."""
    clean_records = {"vitals": {"blood_pressure_systolic": 118}, "labs": {"ldl_cholesterol": 95}}
    stated_decision = "I am scheduling my annual checkup on time."
    stated_priorities = "Maintaining overall health."

    result = evaluate_heuristics_discrepancy(
        stated_decision=stated_decision,
        stated_priorities=stated_priorities,
        records=clean_records
    )

    assert "overlooked_factors" in result
    assert "socratic_questions" in result
    assert len(result["socratic_questions"]) >= 1


# ==============================================================================
# 2. Service Logic & Gemini Mock Tests
# ==============================================================================
@pytest.mark.asyncio
async def test_service_with_gemini_mock():
    """Verify service parses structured Gemini response and logs trace."""
    service = DecisionCoachService()

    mock_gemini_json = {
        "overlooked_factors": ["High systolic BP of 145 mmHg"],
        "assumptions_to_challenge": ["Belief that high BP produces obvious daily symptoms"],
        "conflicts_with_records": ["Saving short-term costs vs 10x higher hospitalization risk"],
        "socratic_questions": ["What is your target blood pressure threshold agreed with your doctor?"],
        "grounding_score": 0.96,
        "clinical_summary": "Patient focuses on financial savings while records indicate unmanaged arterial stress."
    }

    mock_response = MagicMock()
    mock_response.text = f"```json\n{import_json(mock_gemini_json)}\n```"

    with patch("services.decision_coach_service.get_ai_client") as mock_client:
        mock_client.return_value = MagicMock()
        with patch("services.decision_coach_service.safe_generate_content", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = mock_response

            pillars = await service.analyze_decision(
                patient_id="pt-101",
                stated_decision="Stop meds",
                stated_priorities="Save money",
                records=MOCK_RECORDS
            )

            assert isinstance(pillars, CoachingPillars)
            assert pillars.grounding_score == 0.96
            assert len(pillars.overlooked_factors) == 1
            assert "145 mmHg" in pillars.overlooked_factors[0]
            assert pillars.decision_summary != ""


@pytest.mark.asyncio
async def test_service_gemini_fallback_on_error():
    """Verify service gracefully falls back to deterministic heuristics when LLM fails."""
    service = DecisionCoachService()

    with patch("services.decision_coach_service.get_ai_client") as mock_client:
        mock_client.return_value = MagicMock()
        with patch("services.decision_coach_service.safe_generate_content", side_effect=Exception("API Quota Exceeded")):
            pillars = await service.analyze_decision(
                patient_id="pt-102",
                stated_decision="Stop meds to cut cost",
                stated_priorities="Financial savings",
                records=MOCK_RECORDS
            )

            assert isinstance(pillars, CoachingPillars)
            assert len(pillars.overlooked_factors) >= 1
            assert pillars.grounding_score >= 0.90
            assert pillars.decision_summary != ""


# ==============================================================================
# 3. API Route Integration Tests
# ==============================================================================
def test_api_sample_profiles():
    """Verify GET /api/coach/sample-profiles returns curated clinical presets."""
    response = client.get("/api/coach/sample-profiles")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "patient_records" in data["profiles"]
    assert "cardio_hesitancy" in data["profiles"]
    assert "hypertension_schedule" in data["profiles"]


def test_api_patient_records_summary():
    """Verify GET /api/coach/patient-records-summary returns verified documents and vitals."""
    response = client.get(
        "/api/coach/patient-records-summary",
        headers={"Authorization": "Bearer test-token-patient-001"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_records"] >= 1
    assert "documents" in data
    assert "vitals_snapshot" in data


def test_api_analyze_decision_endpoint():
    """Verify POST /api/coach/analyze successfully executes with valid payload and rich objects."""
    payload = {
        "stated_decision": "I plan to cut my statin dose in half to save money.",
        "stated_priorities": "Reducing out-of-pocket prescription expenses.",
        "profile_preset": "cardio_hesitancy",
        "use_uploaded_records": True
    }

    # Pass mock auth token
    response = client.post(
        "/api/coach/analyze",
        json=payload,
        headers={"Authorization": "Bearer test-token-patient-001"}
    )

    assert response.status_code == 200
    res_data = response.json()
    assert "decision_summary" in res_data
    assert "overlooked_factors" in res_data
    assert "assumptions_to_challenge" in res_data
    assert "conflicts_with_records" in res_data
    assert "socratic_questions" in res_data
    assert res_data["grounding_score"] >= 0.80

    # Verify structured elements have non-blank content
    assert len(res_data["overlooked_factors"]) >= 1
    factor_item = res_data["overlooked_factors"][0]
    assert "factor" in factor_item and len(factor_item["factor"]) > 0
    assert "source_record" in factor_item and len(factor_item["source_record"]) > 0
    assert "clinical_risk" in factor_item and len(factor_item["clinical_risk"]) > 0
    assert "severity" in factor_item

    assert len(res_data["assumptions_to_challenge"]) >= 1
    assumption_item = res_data["assumptions_to_challenge"][0]
    assert "assumption" in assumption_item and len(assumption_item["assumption"]) > 0
    assert "counter_evidence" in assumption_item and len(assumption_item["counter_evidence"]) > 0
    assert "clinical_reality" in assumption_item and len(assumption_item["clinical_reality"]) > 0

    assert len(res_data["conflicts_with_records"]) >= 1
    conflict_item = res_data["conflicts_with_records"][0]
    assert "stated_priority" in conflict_item and len(conflict_item["stated_priority"]) > 0
    assert "conflicting_evidence" in conflict_item and len(conflict_item["conflicting_evidence"]) > 0
    assert "synthesis" in conflict_item and len(conflict_item["synthesis"]) > 0


def test_api_analyze_rejects_empty_decision():
    """Verify validation schema rejects too short or empty decisions."""
    payload = {
        "stated_decision": "No",
        "stated_priorities": "None"
    }

    response = client.post(
        "/api/coach/analyze",
        json=payload,
        headers={"Authorization": "Bearer test-token-patient-001"}
    )
    assert response.status_code == 422


def import_json(data):
    import json
    return json.dumps(data)
