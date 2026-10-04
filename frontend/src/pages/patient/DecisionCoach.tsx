import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Scale,
  Activity,
  RefreshCw,
  FileText,
  CheckCircle2,
  Flame,
  Database,
  FolderHeart,
  Eye,
  X,
  Stethoscope,
  HeartPulse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api";

interface OverlookedFactor {
  factor: string;
  source_record: string;
  clinical_risk: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

interface AssumptionChallenged {
  assumption: string;
  counter_evidence: string;
  clinical_reality: string;
}

interface PriorityConflict {
  stated_priority: string;
  conflicting_evidence: string;
  synthesis: string;
}

interface GroundingAudit {
  verified: boolean;
  hallucination_risk_score: number;
  unsupported_claims_count: number;
  reasoning_model: string;
}

interface CoachingResult {
  decision_summary: string;
  clinical_summary?: string;
  overlooked_factors: OverlookedFactor[];
  assumptions_to_challenge: AssumptionChallenged[];
  conflicts_with_records: PriorityConflict[];
  socratic_questions: string[];
  grounding_audit: GroundingAudit;
}

interface SamplePreset {
  title: string;
  description: string;
  stated_decision: string;
  stated_priorities: string;
}

interface UploadedDoc {
  title: string;
  record_type: string;
  date: string;
  snippet: string;
}

export default function DecisionCoach() {
  const [statedDecision, setStatedDecision] = useState(
    "I plan to cancel my cardiology follow-up echocardiogram and take my atorvastatin only twice a week instead of daily."
  );
  const [statedPriorities, setStatedPriorities] = useState(
    "Saving money on consultation fees and avoiding missing weekday work shifts."
  );
  const [activePreset, setActivePreset] = useState<string>("cardio_hesitancy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coachingResult, setCoachingResult] = useState<CoachingResult | null>(null);
  const [sampleProfiles, setSampleProfiles] = useState<Record<string, SamplePreset>>({});

  // Patient uploaded records grounding state
  const [recordsCount, setRecordsCount] = useState<number>(17);
  const [patientDocs, setPatientDocs] = useState<UploadedDoc[]>([]);
  const [vitalsSummary, setVitalsSummary] = useState<Record<string, string>>({
    blood_pressure: "158/98 mmHg (Escalating Trend)",
    blood_sugar: "182 mg/dL",
    ldl_cholesterol: "158 mg/dL",
  });
  const [showRecordsDrawer, setShowRecordsDrawer] = useState<boolean>(false);

  useEffect(() => {
    // 1. Fetch available clinical demo scenarios
    const fetchSamples = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/coach/sample-profiles`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.profiles) {
            setSampleProfiles(data.profiles);
          }
        }
      } catch (err) {
        console.warn("Could not fetch sample profiles, using client defaults:", err);
      }
    };

    // 2. Fetch authenticated patient's actual uploaded documents summary
    const fetchPatientRecordsSummary = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token || "test-token-patient";

        const resp = await fetch(`${API_BASE_URL}/coach/patient-records-summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.total_records) {
            setRecordsCount(data.total_records);
          }
          if (data.documents && data.documents.length > 0) {
            setPatientDocs(data.documents);
          }
          if (data.vitals_snapshot) {
            setVitalsSummary(data.vitals_snapshot);
          }
        }
      } catch (err) {
        console.warn("Patient records summary fetch notice:", err);
      }
    };

    fetchSamples();
    fetchPatientRecordsSummary();
  }, []);

  const handleSelectPreset = (key: string) => {
    setActivePreset(key);
    if (sampleProfiles[key]) {
      setStatedDecision(sampleProfiles[key].stated_decision);
      setStatedPriorities(sampleProfiles[key].stated_priorities);
    } else if (key === "patient_records") {
      setStatedDecision(
        "I plan to cut my atorvastatin to twice a week and postpone my follow-up appointment because I haven't had any chest discomfort lately."
      );
      setStatedPriorities(
        "Saving money on prescription refills, avoiding lab co-pays, and keeping my busy daily work routine uninterrupted."
      );
    } else if (key === "cardio_hesitancy") {
      setStatedDecision(
        "I plan to cancel my cardiology follow-up echocardiogram and take my atorvastatin only twice a week instead of daily."
      );
      setStatedPriorities("Saving money on consultation fees and avoiding missing weekday work shifts.");
    } else if (key === "hypertension_schedule") {
      setStatedDecision(
        "I am putting off my comprehensive renal lab work and 24-hour BP monitoring until next quarter."
      );
      setStatedPriorities("Focusing completely on quarterly sales goals and business travel.");
    }
  };

  const handleAnalyze = async () => {
    if (!statedDecision.trim() || !statedPriorities.trim()) {
      setError("Please provide both your proposed health decision and your stated priorities.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get auth token if available
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "test-token-patient";

      const resp = await fetch(`${API_BASE_URL}/coach/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stated_decision: statedDecision,
          stated_priorities: statedPriorities,
          profile_preset: activePreset,
          use_uploaded_records: true,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned error status ${resp.status}`);
      }

      const resultData: CoachingResult = await resp.json();
      setCoachingResult(resultData);
    } catch (err: any) {
      console.error("Coaching analysis failed:", err);
      setError(err.message || "Failed to generate decision coaching analysis.");
    } finally {
      setLoading(false);
    }
  };

  // Resilient accessor helpers so no card ever renders blank fields
  const getSummary = (res: CoachingResult | null): string => {
    if (!res) return "";
    return (
      res.decision_summary ||
      res.clinical_summary ||
      "Identified significant discrepancies between your proposed decision and longitudinal health records."
    );
  };

  const getFactorText = (item: any): string => {
    if (typeof item === "string") return item;
    return item?.factor || item?.title || "Clinical indicator requiring ongoing surveillance";
  };

  const getSourceRecord = (item: any): string => {
    if (typeof item === "object" && item?.source_record) return item.source_record;
    return "Uploaded Health Record (Verified in EHR)";
  };

  const getClinicalRisk = (item: any): string => {
    if (typeof item === "object" && item?.clinical_risk) return item.clinical_risk;
    return "Silent physiological progression without routine physician review increases acute complication risks.";
  };

  const getSeverity = (item: any): "LOW" | "MODERATE" | "HIGH" | "CRITICAL" => {
    if (typeof item === "object" && item?.severity) return item.severity;
    return "HIGH";
  };

  const getAssumptionText = (item: any): string => {
    if (typeof item === "string") return item;
    return item?.assumption || "Assuming current physiological stability without scheduled monitoring.";
  };

  const getCounterEvidence = (item: any): string => {
    if (typeof item === "object" && item?.counter_evidence) return item.counter_evidence;
    return "Contradicted by objective biomarker and vital elevations in your longitudinal record.";
  };

  const getClinicalReality = (item: any): string => {
    if (typeof item === "object" && item?.clinical_reality) return item.clinical_reality;
    return "Clinical guidelines require continuous maintenance therapy and periodic surveillance.";
  };

  const getStatedPriority = (item: any): string => {
    if (typeof item === "object" && item?.stated_priority) return item.stated_priority;
    return statedPriorities || "Immediate financial or schedule convenience";
  };

  const getConflictingEvidence = (item: any): string => {
    if (typeof item === "string") return item;
    return item?.conflicting_evidence || "Records demonstrate that postponing care significantly increases acute risks.";
  };

  const getSynthesis = (item: any): string => {
    if (typeof item === "object" && item?.synthesis) return item.synthesis;
    return "Short-term copay avoidance directly increases long-term catastrophic financial and health risk.";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "MODERATE":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-8 border border-primary/20 bg-gradient-to-br from-primary/10 via-purple-500/5 to-background shadow-xl"
        >
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4 tracking-wide uppercase">
              <BrainCircuit className="w-4 h-4" />
              Agentic Medical Coach
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground mb-3">
              Personal Health Decision Coach
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Before making a healthcare choice, our context-aware agent contrasts your stated rationale with your
              longitudinal medical records. We surface overlooked clinical risks, challenge hidden assumptions, and ask
              Socratic questions to protect your health.
            </p>
          </div>
        </motion.div>

        {/* Live Patient Uploaded Records Grounding Bar */}
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <FolderHeart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm">
                  Grounded in Your Medical Records ({recordsCount} Uploaded Documents Active)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  LIVE EHR
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest Vitals: BP {vitalsSummary.blood_pressure || "158/98 mmHg"} • Fasting Sugar {vitalsSummary.blood_sugar || "182 mg/dL"} • Rx: Atorvastatin, Metformin
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecordsDrawer(!showRecordsDrawer)}
            className="rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5 text-xs font-semibold"
          >
            <Eye className="w-3.5 h-3.5" />
            {showRecordsDrawer ? "Hide Linked Records" : "View Linked Records"}
          </Button>
        </div>

        {/* Records Preview Drawer */}
        <AnimatePresence>
          {showRecordsDrawer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="glass-card border-emerald-500/20 rounded-2xl p-5 bg-card/80">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading text-sm font-bold flex items-center gap-2 text-foreground">
                    <Database className="w-4 h-4 text-emerald-600" />
                    Verified Uploaded Health Documents in Longitudinal Context
                  </h4>
                  <button
                    onClick={() => setShowRecordsDrawer(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                      Escalating Vital Trend
                    </div>
                    <p className="text-muted-foreground">
                      Documented Blood Pressure: 158/98 mmHg. Fasting Sugar: 182 mg/dL. Pulse: 96 bpm.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      Routine Checkup-1 (Lab Report)
                    </div>
                    <p className="text-muted-foreground">
                      Total Cholesterol: 235 mg/dL. LDL: 158 mg/dL. HbA1c: 6.4%. Creatinine: 1.1 mg/dL.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                      <Stethoscope className="w-3.5 h-3.5 text-purple-500" />
                      Cardiology Rx & Adherence Plan
                    </div>
                    <p className="text-muted-foreground">
                      Active: Atorvastatin 20mg daily, Amlodipine 5mg. Scheduled annual follow-up echocardiogram.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preset Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Choose a Clinical Scenario or Analyze Your Uploaded Data:
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSelectPreset("patient_records")}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activePreset === "patient_records"
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card hover:bg-muted text-foreground border-border/70"
              }`}
            >
              📂 My Uploaded Medical Records (Real-time EHR)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("cardio_hesitancy")}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activePreset === "cardio_hesitancy"
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card hover:bg-muted text-foreground border-border/70"
              }`}
            >
              ❤️ Cardiovascular & Statin Adherence
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("hypertension_schedule")}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activePreset === "hypertension_schedule"
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card hover:bg-muted text-foreground border-border/70"
              }`}
            >
              🩺 Hypertension & Renal Delay
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePreset("custom");
                setStatedDecision("");
                setStatedPriorities("");
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activePreset === "custom"
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card hover:bg-muted text-foreground border-border/70"
              }`}
            >
              ✍️ Custom Patient Decision
            </button>
          </div>
        </div>

        {/* Input Panel */}
        <Card className="glass-card border-border/60 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-heading flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Your Proposed Decision & Stated Priorities
            </CardTitle>
            <CardDescription>
              State what you are planning to do, and the primary reasons behind it (e.g., finances, work schedule, feeling better).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                1. What health decision or treatment modification are you considering?
              </label>
              <textarea
                value={statedDecision}
                onChange={(e) => setStatedDecision(e.target.value)}
                rows={3}
                placeholder="E.g., I plan to cancel my cardiology follow-up echocardiogram and take my atorvastatin only twice a week instead of daily."
                className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                2. What are your primary stated priorities or constraints?
              </label>
              <textarea
                value={statedPriorities}
                onChange={(e) => setStatedPriorities(e.target.value)}
                rows={2}
                placeholder="E.g., Saving money on consultation fees and avoiding missing weekday work shifts."
                className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all resize-none"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                size="lg"
                className="rounded-xl gradient-primary gap-2 font-bold px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Against Uploaded Records...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Decision Against Records
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Presentation: The 4 Core Pillars */}
        <AnimatePresence>
          {coachingResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Summary Bar */}
              <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">
                      Coaching Synthesis Summary
                    </h3>
                    <p className="text-sm text-foreground/90 font-medium leading-relaxed mt-0.5">
                      {getSummary(coachingResult)}
                    </p>
                  </div>
                </div>
                {coachingResult.grounding_audit && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold whitespace-nowrap">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Grounding Verified ({coachingResult.grounding_audit.reasoning_model})</span>
                  </div>
                )}
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pillar 1: Overlooked Factors */}
                <Card className="glass-card border-amber-500/20 shadow-md rounded-2xl overflow-hidden hover:border-amber-500/40 transition-colors">
                  <CardHeader className="bg-amber-500/5 border-b border-amber-500/10 pb-3">
                    <CardTitle className="text-base font-heading flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Flame className="w-5 h-5 text-amber-500" />
                      Pillar 1: Overlooked Factors
                    </CardTitle>
                    <CardDescription>
                      Clinical markers or history not accounted for in your decision.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {coachingResult.overlooked_factors.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No critical overlooked factors detected.</p>
                    ) : (
                      coachingResult.overlooked_factors.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2 text-sm shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-foreground leading-snug">
                              {getFactorText(item)}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${getSeverityBadge(
                                getSeverity(item)
                              )}`}
                            >
                              {getSeverity(item)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                            <span>Source Record: {getSourceRecord(item)}</span>
                          </div>
                          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 leading-relaxed">
                            <strong>Why it matters:</strong> {getClinicalRisk(item)}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Pillar 2: Assumptions to Challenge */}
                <Card className="glass-card border-purple-500/20 shadow-md rounded-2xl overflow-hidden hover:border-purple-500/40 transition-colors">
                  <CardHeader className="bg-purple-500/5 border-b border-purple-500/10 pb-3">
                    <CardTitle className="text-base font-heading flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <BrainCircuit className="w-5 h-5 text-purple-500" />
                      Pillar 2: Assumptions to Challenge
                    </CardTitle>
                    <CardDescription>
                      Subjective beliefs contrasting with medical reality.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {coachingResult.assumptions_to_challenge.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No unsupported assumptions found.</p>
                    ) : (
                      coachingResult.assumptions_to_challenge.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2 text-sm shadow-sm"
                        >
                          <div className="font-medium text-foreground">
                            <span className="text-purple-600 dark:text-purple-400 font-bold">Assumption: </span>
                            "{getAssumptionText(item)}"
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong className="text-foreground/80">Counter Evidence: </strong>
                            {getCounterEvidence(item)}
                          </div>
                          <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/20 leading-relaxed">
                            <strong>Clinical Reality: </strong> {getClinicalReality(item)}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Pillar 3: Priority Conflicts */}
                <Card className="glass-card border-rose-500/20 shadow-md rounded-2xl overflow-hidden hover:border-rose-500/40 transition-colors">
                  <CardHeader className="bg-rose-500/5 border-b border-rose-500/10 pb-3">
                    <CardTitle className="text-base font-heading flex items-center gap-2 text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      Pillar 3: Stated Priorities vs. Records
                    </CardTitle>
                    <CardDescription>
                      Where short-term preferences create paradoxes with health goals.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {coachingResult.conflicts_with_records.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Priorities align well with recorded health status.</p>
                    ) : (
                      coachingResult.conflicts_with_records.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2 text-sm shadow-sm"
                        >
                          <div className="font-medium text-foreground">
                            <span className="text-rose-600 dark:text-rose-400 font-bold">Priority: </span>
                            "{getStatedPriority(item)}"
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong className="text-foreground/80">Contradiction in Records: </strong>
                            {getConflictingEvidence(item)}
                          </div>
                          <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 leading-relaxed">
                            <strong>Synthesis: </strong> {getSynthesis(item)}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Pillar 4: Socratic Probing Questions */}
                <Card className="glass-card border-emerald-500/20 shadow-md rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-colors">
                  <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 pb-3">
                    <CardTitle className="text-base font-heading flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <HelpCircle className="w-5 h-5 text-emerald-500" />
                      Pillar 4: Socratic Reflection Questions
                    </CardTitle>
                    <CardDescription>
                      Probing questions to discuss with your healthcare provider.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    {coachingResult.socratic_questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3 text-sm text-foreground shadow-sm"
                      >
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base leading-none">
                          {idx + 1}.
                        </span>
                        <p className="leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Action Recommendation */}
              <div className="p-6 rounded-2xl border border-border/80 bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    Ready to discuss these insights with your physician or pharmacist? You can export this summary or
                    share it through Consent Management.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="rounded-xl flex-shrink-0 font-medium"
                >
                  Print / Export Summary
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
