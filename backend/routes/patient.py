"""
patient.py
Patient Portal API Router
Secured endpoints for patient symptom analysis, longitudinal health insights,
and context-aware decision guidance.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from core.logger import logger
from core.config import settings
from core.auth import get_current_patient
from agents.safety_agent import SafetyAgent

router = APIRouter(prefix="/patient", tags=["Patient Portal"])
safety_agent = SafetyAgent()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Patient message or question")
    patient_id: Optional[str] = Field(None, description="Optional override, defaults to authenticated user")
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="Recent conversation turns")


class HealthAnalyzeRequest(BaseModel):
    document_text: Optional[str] = Field(None, max_length=50000)
    vitals: Optional[Dict[str, Any]] = None
    patient_id: Optional[str] = None


@router.post("/chat")
async def patient_chat(
    req: ChatRequest,
    current_patient: Dict[str, Any] = Depends(get_current_patient)
):
    """
    Symptom checker & health AI assistant endpoint with security guardrails and authentication.
    Resolves patient context from authenticated session instead of hardcoded IDs.
    """
    patient_id = req.patient_id or current_patient.get("patient_id") or current_patient.get("id")

    # 1. Run strict security & clinical triage guardrail check
    safety_result = await safety_agent.run(req.message, context={"patient_id": patient_id})
    if not safety_result.success:
        return {
            "success": False,
            "response": safety_result.message,
            "is_emergency": safety_result.data.get("is_emergency", False),
            "clinical_notice": "AI-Assisted Assessment — Decision support only.",
        }

    try:
        reply = None
        if settings.has_gemini:
            from ai_config import get_ai_client, safe_generate_content
            client = get_ai_client()
            if client:
                prompt = (
                    "You are an empathetic, clinical decision-support assistant for patients.\n"
                    "Analyze this patient's inquiry in context of their self-care and provide thoughtful guidance.\n"
                    f"Patient Inquiry: '{req.message}'\n\n"
                    "Structure your answer with:\n"
                    "1. Clinical context & explanation\n"
                    "2. Important questions to ask your physician\n"
                    "3. Warning symptoms that require immediate medical attention."
                )
                response = await safe_generate_content(prompt, task_type="text_fast", client=client)
                if hasattr(response, 'text') and response.text:
                    reply = response.text

        if not reply:
            reply = (
                f"Thank you for reaching out. Based on your description ('{req.message[:100]}...'), "
                "we recommend logging your current vitals and discussing these symptoms with your physician. "
                "If you experience sudden shortness of breath, severe chest pressure, or neurological symptoms, seek emergency care immediately."
            )

        logger.info("patient_chat_completed", context={"patient_id": patient_id, "message_length": len(req.message)})

        return {
            "success": True,
            "patient_id": patient_id,
            "response": reply,
            "clinical_notice": "AI-Assisted Assessment — Decision support only. Consult a physician for medical diagnosis.",
        }
    except Exception as e:
        logger.error("patient_chat_error", error=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process patient consultation inquiry safely."
        )
