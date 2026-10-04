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
  ArrowRight,
  RefreshCw,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  Info,
  Flame,
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

  useEffect(() => {
    // Fetch available clinical demo scenarios
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
    fetchSamples();
  }, []);

  const handleSelectPreset = (key: string) => {
    setActivePreset(key);
    if (sampleProfiles[key]) {
      setStatedDecision(sampleProfiles[key].stated_decision);
      setStatedPriorities(sampleProfiles[key].stated_priorities);
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
      const token = sessionData?.session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        headers["Authorization"] = `Bearer test-token-patient`;
      }

      const resp = await fetch(`${API_BASE_URL}/coach/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          stated_decision: statedDecision,
          stated_priorities: statedPriorities,
          profile_preset: activePreset,
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "HIGH":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      case "MODERATE":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
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

        {/* Preset Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Choose a Clinical Demo Scenario or Enter Your Own:
          </label>
          <div className="flex flex-wrap gap-3">
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
                placeholder="E.g., I want to stop taking my metformin because my morning blood sugar was normal for 3 days."
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
                placeholder="E.g., I want to avoid doctor co-pays and have zero stomach discomfort during a conference."
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
                    Analyzing Against Records...
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
                    <p className="text-sm text-muted-foreground">{coachingResult.decision_summary}</p>
                  </div>
                </div>
                {coachingResult.grounding_audit && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
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
                          className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-foreground">{item.factor}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(
                                item.severity
                              )}`}
                            >
                              {item.severity}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary/70" />
                            <span>Source Record: {item.source_record}</span>
                          </div>
                          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                            <strong>Why it matters:</strong> {item.clinical_risk}
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
                          className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2 text-sm"
                        >
                          <div className="font-medium text-foreground">
                            <span className="text-purple-600 dark:text-purple-400 font-bold">Assumption: </span>
                            "{item.assumption}"
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong>Counter Evidence: </strong>
                            {item.counter_evidence}
                          </div>
                          <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-500/5 p-2 rounded-lg border border-purple-500/10">
                            <strong>Clinical Reality: </strong> {item.clinical_reality}
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
                          className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2 text-sm"
                        >
                          <div className="font-medium text-foreground">
                            <span className="text-rose-600 dark:text-rose-400 font-bold">Priority: </span>
                            "{item.stated_priority}"
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong>Contradiction in Records: </strong>
                            {item.conflicting_evidence}
                          </div>
                          <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                            <strong>Synthesis: </strong> {item.synthesis}
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
                        className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3 text-sm text-foreground"
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
