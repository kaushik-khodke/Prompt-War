"""
decision_coach.py
FastAPI Router for Health Decision Coach API.
Exposes context-aware decision critique and longitudinal record profiling endpoints.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from core.auth import get_current_patient
from services.decision_coach_service import DecisionCoachService, CoachingPillars

router = APIRouter(prefix="/coach", tags=["Health Decision Coach"])
coach_service = DecisionCoachService()

SAMPLE_PROFILES = {
    "cardio_hesitancy": {
        "title": "Cardiovascular Statin & Follow-up Hesitancy",
        "description": "Patient wants to skip annual echocardiogram and reduce statins because they 'feel healthy' and want to cut costs.",
        "stated_decision": "I plan to cancel my cardiology follow-up echocardiogram and take my atorvastatin only twice a week instead of daily.",
        "stated_priorities": "Saving money on consultation fees and avoiding missing weekday work shifts.",
        "records": {
            "vitals": {
                "blood_pressure_systolic": 142,
                "blood_pressure_diastolic": 90,
                "heart_rate": 78
            },
            "labs": {
                "ldl_cholesterol": 158,
                "total_cholesterol": 235,
                "hba1c": 5.9
            },
            "diagnoses": [
                {"code": "I10", "description": "Essential (primary) hypertension"},
                {"code": "E78.0", "description": "Pure hypercholesterolemia"}
            ],
            "active_medications": [
                {"name": "Atorvastatin", "dosage": "20mg daily", "purpose": "Plaque stabilization & LDL lowering"},
                {"name": "Lisinopril", "dosage": "10mg daily", "purpose": "Blood pressure control"}
            ],
            "recurring_episodes": [
                {"event": "Exertional dyspnea / shortness of breath", "frequency": "3 episodes in past 6 months"},
                {"event": "Unscheduled urgent care visit for elevated BP", "frequency": "1 episode in past 10 months"}
            ]
        }
    },
    "hypertension_schedule": {
        "title": "Hypertension Workload vs Monitoring Conflict",
        "description": "Patient intends to delay renal panel tests due to high-priority client travel.",
        "stated_decision": "I am putting off my comprehensive renal lab work and 24-hour BP monitoring until next quarter.",
        "stated_priorities": "Focusing completely on quarterly sales goals and business travel.",
        "records": {
            "vitals": {
                "blood_pressure_systolic": 148,
                "blood_pressure_diastolic": 94,
                "heart_rate": 82
            },
            "labs": {
                "serum_creatinine": 1.4,
                "estimated_gfr": 58,
                "microalbuminuria": "Trace positive"
            },
            "diagnoses": [
                {"code": "I12.9", "description": "Hypertensive chronic kidney disease, stage 3"}
            ],
            "active_medications": [
                {"name": "Amlodipine", "dosage": "5mg daily"},
                {"name": "Losartan", "dosage": "50mg daily"}
            ],
            "recurring_episodes": [
                {"event": "Morning occipital headache", "frequency": "Weekly for past 2 months"}
            ]
        }
    }
}


class DecisionAnalysisRequest(BaseModel):
    stated_decision: str = Field(..., min_length=5, max_length=1500, description="The specific decision the patient is considering")
    stated_priorities: str = Field(..., min_length=3, max_length=1000, description="What the patient claims they care about most (cost, schedule, comfort)")
    records: Optional[Dict[str, Any]] = Field(None, description="Optional custom longitudinal EHR record payload")
    profile_preset: Optional[str] = Field(None, description="Preset key (e.g. 'cardio_hesitancy') if using demo profile")


@router.post("/analyze", response_model=CoachingPillars)
async def analyze_health_decision(
    req: DecisionAnalysisRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient)
):
    """
    Analyzes patient's stated decision and priorities against longitudinal medical records.
    Surfaces overlooked factors, challenged assumptions, conflicts, and Socratic questions.
    """
    patient_id = current_patient.get("patient_id", "patient-demo")

    # Resolve records from request, preset, or fallback
    records_to_use = req.records
    if not records_to_use and req.profile_preset and req.profile_preset in SAMPLE_PROFILES:
        records_to_use = SAMPLE_PROFILES[req.profile_preset]["records"]
    elif not records_to_use:
        records_to_use = SAMPLE_PROFILES["cardio_hesitancy"]["records"]

    try:
        result = await coach_service.analyze_decision(
            patient_id=patient_id,
            stated_decision=req.stated_decision,
            stated_priorities=req.stated_priorities,
            records=records_to_use
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate decision coaching analysis: {str(e)}"
        )


@router.get("/sample-profiles")
async def get_sample_profiles():
    """
    Returns curated clinical scenarios demonstrating the Health Decision Coach capabilities.
    """
    return {
        "success": True,
        "profiles": SAMPLE_PROFILES
    }
