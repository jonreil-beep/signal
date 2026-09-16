"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchWithSession } from "@/lib/fetchWithSession";
import { formatBrief } from "@/lib/formatBrief";
import { deriveBeforeYouApplyActions } from "@/lib/beforeYouApply";
import LoadingState from "@/components/LoadingState";
import { CURRENT_PROMPT_VERSION } from "@/lib/prompts";
import type {
  TrackedJob, JobFitResult, TailoringBriefResult,
  OutreachResult, ResumeUpdateResult, CandidateNote,
} from "@/types";

// ── normalizers / validators ──────────────────────────────────────────────────

type ValidateJobFitResult =
  | { valid: true; result: JobFitResult }
  | { valid: false; reason: string };

function validateJobFitResult(raw: unknown): ValidateJobFitResult {
  if (!raw || typeof raw !== "object") return { valid: false, reason: "Not an object" };
  const r = { ...(raw as Record<string, unknown>) };

  // Legacy field rename
  if (!r.what_you_have && r.what_she_has) {
    r.what_you_have = r.what_she_has;
    delete r.what_she_has;
  }

  const fit = typeof r.overall_fit === "number" ? r.overall_fit : Number(r.overall_fit);
  if (!Number.isFinite(fit) || fit < 1 || fit > 10) return { valid: false, reason: "Invalid overall_fit" };
  if (typeof r.summary !== "string" || !r.summary.trim()) return { valid: false, reason: "Missing summary" };
  if (!Array.isArray(r.what_you_have)) return { valid: false, reason: "Missing what_you_have" };
  if (!Array.isArray(r.whats_missing)) return { valid: false, reason: "Missing whats_missing" };
  if (!r.recommendation) return { valid: false, reason: "Missing recommendation" };

  const dims = r.dimensions as Record<string, unknown> | undefined;
  if (!dims || typeof dims !== "object") return { valid: false, reason: "Missing dimensions" };
  for (const key of ["functional_fit", "seniority_fit", "industry_fit", "keyword_overlap"] as const) {
    const d = dims[key] as Record<string, unknown> | undefined;
    if (!d || typeof d.score !== "number" || typeof d.reasoning !== "string") {
      return { valid: false, reason: `Invalid dimension: ${key}` };
    }
  }

  return { valid: true, result: r as unknown as JobFitResult };
}

function normalizeOutreachResult(raw: unknown): OutreachResult | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.email === "string" && r.email.trimStart().startsWith("{")) {
    try {
      const parsed = JSON.parse(r.email) as Record<string, unknown>;
      if (typeof parsed.email === "string" && typeof parsed.linkedin_message === "string") {
        return parsed as unknown as OutreachResult;
      }
    } catch { /* not JSON */ }
  }
  return r as unknown as OutreachResult;
}

// ── constants ─────────────────────────────────────────────────────────────────

const REC_STYLES: Record<string, { color: string; bg: string }> = {
  "Pursue":         { color: "#7A8B73", bg: "rgba(122,139,115,0.10)" },
  "Consider":       { color: "#9B8E73", bg: "rgba(155,142,115,0.10)" },
  "Lower priority": { color: "#8A7373", bg: "rgba(138,115,115,0.10)" },
};

const APP_BG = [
  "radial-gradient(ellipse 70% 60% at 95% 5%, rgba(255,150,70,0.18) 0%, transparent 65%)",
  "radial-gradient(ellipse 70% 65% at 5% 95%, rgba(100,110,220,0.16) 0%, transparent 65%)",
  "radial-gradient(ellipse 55% 55% at 95% 60%, rgba(215,90,150,0.13) 0%, transparent 58%)",
  "#F5F3F0",
].join(", ");

type EmailState = "idle" | "sending" | "sent" | "error";

// ── small UI components ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11,
      letterSpacing: "0.07em", color: "rgba(28,35,51,0.40)", marginBottom: 12,
      textTransform: "uppercase",
    }}>
      {children}
    </p>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="31.4" strokeDashoffset="10" opacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ScoreBar({ score, fill }: { score: number; fill: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative" style={{ height: 6, background: "rgba(28,35,51,0.08)", borderRadius: 3 }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: 6, background: fill, borderRadius: 3, width: `${score * 10}%` }} />
      </div>
      <span className="font-sans font-medium tabular-nums text-[#1C2333]"
        style={{ fontSize: 18, letterSpacing: "-0.03em", lineHeight: 1, width: 24, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

function Brandmark() {
  return (
    <div style={{
      width: 18, height: 18, background: "#1C2333", borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ color: "#fff", fontSize: 10, fontWeight: 600, fontFamily: "var(--font-geist-sans)", lineHeight: 1 }}>C</span>
    </div>
  );
}

function verifyExcerpt(excerpt: string, source: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  return normalize(source).includes(normalize(excerpt));
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function BriefingPage() {
  const params = useParams();
  const jobId = params.id as string;
  const router = useRouter();

  const [job, setJob] = useState<TrackedJob | null>(null);
  const [profileText, setProfileText] = useState("");
  const [writingSample, setWritingSample] = useState("");
  const [pivotTarget, setPivotTarget] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAnalysisStale, setIsAnalysisStale] = useState(false);
  const [isVersionStale, setIsVersionStale] = useState(false);
  const [isRescoring, setIsRescoring] = useState(false);
  const [rescoreError, setRescoreError] = useState("");

  const [jobFitValidationError, setJobFitValidationError] = useState<string | null>(null);
  const [recoveryJobDescription, setRecoveryJobDescription] = useState("");
  const [isRecoveryRescoring, setIsRecoveryRescoring] = useState(false);
  const [recoveryRescoreError, setRecoveryRescoreError] = useState("");

  // brief generation status
  type BriefStatus = "pending" | "generating" | "succeeded" | "failed";
  const [briefStatus, setBriefStatus] = useState<BriefStatus>("pending");
  const [briefError, setBriefError] = useState("");
  const briefRetryInFlight = useRef(false);
  const [isRetrying, setIsRetrying] = useState(false);
  // Monotonically-increasing generation counter; stale async writes check this before mutating state
  const activeGenId = useRef(0);
  const hasTriggeredGeneration = useRef(false);

  // generation states
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachError, setOutreachError] = useState("");
  const [regenerateNote, setRegenerateNote] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<EmailState>("idle");

  // resume suggestions
  const [isGeneratingResumeUpdates, setIsGeneratingResumeUpdates] = useState(false);
  const [resumeUpdateError, setResumeUpdateError] = useState("");

  // what changed after brief regeneration
  const [regenerateChanges, setRegenerateChanges] = useState<string[] | null>(null);
  // true when score succeeded but subsequent brief generation failed
  const [briefStaleAfterRescore, setBriefStaleAfterRescore] = useState(false);
  // which generated drafts belong to a previous assessment
  const [staleDrafts, setStaleDrafts] = useState<{ outreach: boolean; resumeSuggestions: boolean }>({ outreach: false, resumeSuggestions: false });

  // UI disclosure states
  const [scoreOpen, setScoreOpen] = useState(false);
  const [showAllHave, setShowAllHave] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [showAllLeads, setShowAllLeads] = useState(false);
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // scroll refs
  const updateBriefRef = useRef<HTMLDivElement>(null);
  const outreachRef = useRef<HTMLDivElement>(null);
  const resumeUpdateRef = useRef<HTMLDivElement>(null);

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }

      const userId = session.user.id;
      setUserEmail(session.user.email ?? "");

      const [{ data: row }, { data: profile }] = await Promise.all([
        supabase.from("tracked_jobs").select("*").eq("id", jobId).eq("user_id", userId).single(),
        supabase.from("profiles").select("resume_text, updated_at").eq("id", userId).single(),
      ]);

      if (!row) { router.push("/"); return; }

      try {
        const saved = localStorage.getItem("signal_profile");
        if (saved) {
          const p = JSON.parse(saved) as { writingSample?: string; pivotTarget?: string };
          if (p.writingSample) setWritingSample(p.writingSample);
          if (p.pivotTarget) setPivotTarget(p.pivotTarget);
        }
      } catch { /* ignore */ }

      setProfileText(profile?.resume_text ?? "");

      // Detect stale analysis: profile updated after job was scored
      if (profile?.updated_at && row?.scored_at) {
        const profileUpdated = new Date(profile.updated_at as string);
        const jobScored = new Date(row.scored_at as string);
        setIsAnalysisStale(profileUpdated > jobScored);
      }

      // Detect stale analysis: scoring prompt version changed since this job was scored
      const savedFit = row?.job_fit_result as { prompt_version?: string } | null;
      if (savedFit && savedFit.prompt_version !== CURRENT_PROMPT_VERSION) {
        setIsVersionStale(true);
      }

      const tailoringResult = row.tailoring_result as TailoringBriefResult | null;
      const fitValidation = validateJobFitResult(row.job_fit_result);
      if (!fitValidation.valid) {
        setJobFitValidationError(fitValidation.reason);
        setRecoveryJobDescription(row.job_description as string ?? "");
        setLoading(false);
        return;
      }
      setJob({
        id: row.id as string,
        label: row.label as string,
        jobDescription: row.job_description as string,
        jobFitResult: fitValidation.result,
        tailoringResult,
        outreachResult: normalizeOutreachResult(row.outreach_result),
        coverLetterResult: row.cover_letter_result as import("@/types").CoverLetterResult | null,
        resumeUpdateResult: row.resume_update_result as ResumeUpdateResult | null,
        interviewPrepResult: null,
        followUpResult: null,
        companyResearchResult: null,
        deadline: (row.deadline as string) ?? null,
        scoredAt: new Date(row.scored_at as string),
        applicationStatus: "Tracking" as const,
        notes: (row.notes as string) ?? "",
        candidateContext: (row.candidate_context as CandidateNote[] | null) ?? [],
      });
      setBriefStatus(tailoringResult ? "succeeded" : "pending");
      setLoading(false);
    }
    load();
  }, [jobId, router]);

  // ── initial brief generation ───────────────────────────────────────────────
  // The briefing page is responsible for triggering its own generation.
  // Fires once when the job loads with no tailoring result; retry is handled separately.

  useEffect(() => {
    if (!job || briefStatus !== "pending" || hasTriggeredGeneration.current) return;
    hasTriggeredGeneration.current = true;
    const genId = ++activeGenId.current;
    setBriefStatus("generating");
    const startMs = Date.now();
    console.log("[brief-gen]", { stage: "start", jobId });
    void (async () => {
      try {
        const supabase = createClient();
        // Quick check: a previous session may have already written the result
        const { data: existing } = await supabase
          .from("tracked_jobs").select("tailoring_result").eq("id", jobId).single();
        if (activeGenId.current !== genId) return;
        if (existing?.tailoring_result) {
          setJob((prev) => prev ? { ...prev, tailoringResult: existing.tailoring_result as TailoringBriefResult } : prev);
          setBriefStatus("succeeded");
          return;
        }
        const res = await fetchWithSession("/api/tailor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText: profileText, jobId }),
        });
        if (activeGenId.current !== genId) return;
        if (res.ok) {
          const data = await res.json() as TailoringBriefResult;
          if (activeGenId.current !== genId) return;
          await supabase.from("tracked_jobs").update({ tailoring_result: data }).eq("id", jobId);
          if (activeGenId.current !== genId) return;
          setJob((prev) => prev ? { ...prev, tailoringResult: data } : prev);
          setBriefStatus("succeeded");
          console.log("[brief-gen]", { stage: "done", durationMs: Date.now() - startMs });
        } else {
          const errData = await res.json().catch(() => ({})) as { error?: string };
          if (activeGenId.current !== genId) return;
          setBriefStatus("failed");
          setBriefError(res.status === 401
            ? "Session expired. Refresh the page."
            : (errData.error ?? "Brief generation failed. Try again."));
          console.log("[brief-gen]", { stage: "fail", status: res.status, durationMs: Date.now() - startMs });
        }
      } catch {
        if (activeGenId.current !== genId) return;
        setBriefStatus("failed");
        setBriefError("Network error. Check your connection and try again.");
        console.error("[brief-gen]", { stage: "error" });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

  // ── generation timeout ─────────────────────────────────────────────────────
  useEffect(() => {
    if (briefStatus !== "generating") return;
    const timer = setTimeout(() => {
      setBriefStatus((s) => s === "generating" ? "failed" : s);
      setBriefError((e) => e || "This is taking longer than expected. Try again.");
    }, 90_000);
    return () => clearTimeout(timer);
  }, [briefStatus]);

  async function handleRetryBrief() {
    if (briefRetryInFlight.current) return;
    briefRetryInFlight.current = true;
    setIsRetrying(true);
    setBriefError("");
    setBriefStatus("generating");
    const genId = ++activeGenId.current;
    try {
      const supabase = createClient();

      // Check DB first — original request may have completed while user waited
      const { data: existing } = await supabase
        .from("tracked_jobs")
        .select("tailoring_result")
        .eq("id", jobId)
        .single();
      if (activeGenId.current !== genId) return;
      if (existing?.tailoring_result) {
        setJob((prev) => prev ? { ...prev, tailoringResult: existing.tailoring_result as TailoringBriefResult } : prev);
        setBriefStatus("succeeded");
        return;
      }

      const res = await fetchWithSession("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobId }),
      });
      if (activeGenId.current !== genId) return;
      if (res.ok) {
        const data = await res.json() as TailoringBriefResult;
        if (activeGenId.current !== genId) return;
        await supabase.from("tracked_jobs").update({ tailoring_result: data }).eq("id", jobId);
        if (activeGenId.current !== genId) return;
        setJob((prev) => prev ? { ...prev, tailoringResult: data } : prev);
        setBriefStatus("succeeded");
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        if (activeGenId.current !== genId) return;
        setBriefStatus("failed");
        setBriefError(res.status === 401
          ? "Session expired. Refresh the page."
          : (err.error ?? "Brief generation failed. Try again."));
      }
    } catch {
      if (activeGenId.current !== genId) return;
      setBriefStatus("failed");
      setBriefError("Network error. Check your connection and try again.");
    } finally {
      briefRetryInFlight.current = false;
      setIsRetrying(false);
    }
  }

  // ── mutations ─────────────────────────────────────────────────────────────

  function updateJob(patch: Partial<TrackedJob>) {
    setJob((prev) => prev ? { ...prev, ...patch } : prev);
  }

  async function saveToDb(patch: Record<string, unknown>) {
    const supabase = createClient();
    await supabase.from("tracked_jobs").update(patch).eq("id", jobId);
  }


  async function handleGenerateOutreach() {
    if (!job) return;
    setIsGeneratingOutreach(true);
    setOutreachError("");
    updateJob({ outreachResult: null });
    try {
      const res = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outreachAngle: job.tailoringResult?.outreach_angle,
          resumeText: profileText,
          jobDescription: job.jobDescription,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
          jobId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOutreachError(data.error ?? "Failed to generate. Please try again.");
      } else {
        const result = data as OutreachResult;
        updateJob({ outreachResult: result });
        await saveToDb({ outreach_result: result });
        setStaleDrafts(prev => ({ ...prev, outreach: false }));
      }
    } catch {
      setOutreachError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingOutreach(false);
    }
  }

  async function handleRegenerate() {
    if (!job || !profileText || !job.jobDescription) return;
    const prevFit = job.jobFitResult;
    const prevTailoring = job.tailoringResult;
    setIsRegenerating(true);
    setRegenerateError("");
    setRegenerateChanges(null);
    setBriefStaleAfterRescore(false);

    // Accumulate: append new note to existing context (do not replace)
    const newNote: CandidateNote | null = regenerateNote.trim()
      ? { text: regenerateNote.trim(), addedAt: new Date().toISOString() }
      : null;
    const allContext: CandidateNote[] = [
      ...(job.candidateContext ?? []),
      ...(newNote ? [newNote] : []),
    ];

    try {
      // Step 1: Full reassessment — all accumulated context included as corrections
      const scoreRes = await fetch("/api/score-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: job.jobDescription,
          corrections: allContext.length > 0
            ? allContext.map(n => ({ item: "candidate context", evidence: n.text }))
            : undefined,
        }),
      });
      const scoreData = await scoreRes.json();
      if (!scoreRes.ok) {
        setRegenerateError(scoreData.error ?? "Reassessment failed. Please try again.");
        return;
      }
      const newFit = scoreData as JobFitResult;

      // Persist new score + accumulated context before calling /api/tailor
      updateJob({ jobFitResult: newFit, candidateContext: allContext });
      await saveToDb({
        job_fit_result: newFit,
        scored_at: new Date().toISOString(),
        candidate_context: allContext,
      });

      // Step 2: Regenerate brief from updated score; pass context summary as userNote
      const contextNote = allContext.length > 0
        ? allContext.map(n => n.text).join("; ")
        : undefined;
      const tailorRes = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: job.jobDescription,
          jobId,
          userNote: contextNote,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
        }),
      });
      const tailorData = await tailorRes.json();
      if (!tailorRes.ok) {
        // Score is saved; brief will be stale until retried — preserve all drafts
        setBriefStaleAfterRescore(true);
        setRegenerateError("Assessment updated. Brief couldn't refresh — use Retry below.");
        return;
      }
      const newTailoring = tailorData as TailoringBriefResult;

      // Preserve drafts — mark stale instead of clearing
      updateJob({ tailoringResult: newTailoring });
      await saveToDb({ tailoring_result: newTailoring });
      setStaleDrafts({
        outreach: !!job.outreachResult,
        resumeSuggestions: !!job.resumeUpdateResult,
      });

      setRegenerateNote("");
      setShowAllLeads(false);
      setExpandedLead(null);

      // Surface what changed
      const changes: string[] = [];
      const scoreDelta = newFit.overall_fit - prevFit.overall_fit;
      if (scoreDelta !== 0) {
        changes.push(`score ${scoreDelta > 0 ? "+" : ""}${scoreDelta} (${prevFit.overall_fit} → ${newFit.overall_fit})`);
      }
      if (prevFit.recommendation !== newFit.recommendation) {
        changes.push(`recommendation: ${newFit.recommendation}`);
      }
      const resolved = [...(prevFit.whats_missing ?? [])]
        .filter(x => !(newFit.whats_missing ?? []).includes(x)).length;
      if (resolved > 0) changes.push(`${resolved} requirement${resolved > 1 ? "s" : ""} addressed`);
      if (prevTailoring?.lead_strengths?.[0]?.strength !== newTailoring.lead_strengths?.[0]?.strength) {
        changes.push("experience to highlight");
      }
      setRegenerateChanges(changes.length > 0 ? changes : ["assessment updated"]);
    } catch {
      setRegenerateError("Network error. Check your connection and try again.");
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleRetryBriefAfterRescore() {
    if (!job || !profileText) return;
    setIsRegenerating(true);
    setRegenerateError("");
    const contextNote = job.candidateContext?.length > 0
      ? job.candidateContext.map(n => n.text).join("; ")
      : undefined;
    try {
      const tailorRes = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: job.jobDescription,
          jobId,
          userNote: contextNote,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
        }),
      });
      const tailorData = await tailorRes.json();
      if (!tailorRes.ok) {
        setRegenerateError(tailorData.error ?? "Brief refresh failed. Try again.");
        return;
      }
      const newTailoring = tailorData as TailoringBriefResult;
      updateJob({ tailoringResult: newTailoring });
      await saveToDb({ tailoring_result: newTailoring });
      setStaleDrafts({
        outreach: !!job.outreachResult,
        resumeSuggestions: !!job.resumeUpdateResult,
      });
      setBriefStaleAfterRescore(false);
      setRegenerateNote("");
      setRegenerateChanges(["brief refreshed"]);
      setShowAllLeads(false);
      setExpandedLead(null);
    } catch {
      setRegenerateError("Network error. Check your connection and try again.");
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleGenerateResumeUpdates() {
    if (!job || !profileText) return;
    setIsGeneratingResumeUpdates(true);
    setResumeUpdateError("");
    updateJob({ resumeUpdateResult: null });
    try {
      const res = await fetch("/api/suggest-resume-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: job.jobDescription,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
          jobId,
        }),
      });
      const data = await res.json() as ResumeUpdateResult & { error?: string };
      if (!res.ok) {
        setResumeUpdateError(data.error ?? "Failed to generate. Please try again.");
      } else {
        updateJob({ resumeUpdateResult: data });
        await saveToDb({ resume_update_result: data });
        setStaleDrafts(prev => ({ ...prev, resumeSuggestions: false }));
      }
    } catch {
      setResumeUpdateError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingResumeUpdates(false);
    }
  }

  async function handleCopy() {
    if (!job) return;
    try {
      await navigator.clipboard.writeText(
        formatBrief(job.label, job.jobFitResult, job.tailoringResult)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* unavailable */ }
  }

  async function handleEmailSend() {
    if (emailState === "sending") return;
    setEmailState("sending");
    try {
      const res = await fetch("/api/send-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json() as { success?: boolean; email?: string; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Send failed");
      setEmailState("sent");
      setTimeout(() => setEmailState("idle"), 4000);
    } catch {
      setEmailState("error");
      setTimeout(() => setEmailState("idle"), 4000);
    }
  }

  async function handleRescore() {
    if (!job || isRescoring) return;
    if (!profileText) {
      setRescoreError("Add your profile before re-scoring.");
      return;
    }
    setIsRescoring(true);
    setRescoreError("");
    try {
      const existingContext = job.candidateContext ?? [];
      const res = await fetch("/api/score-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: job.jobDescription,
          corrections: existingContext.length > 0
            ? existingContext.map(n => ({ item: "candidate context", evidence: n.text }))
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRescoreError(data.error ?? "Re-scoring failed. Please try again.");
      } else {
        const result = data as JobFitResult;
        updateJob({ jobFitResult: result });
        await saveToDb({ job_fit_result: result, scored_at: new Date().toISOString() });
        setIsAnalysisStale(false);
        setIsVersionStale(false);
      }
    } catch {
      setRescoreError("Network error. Check your connection and try again.");
    } finally {
      setIsRescoring(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  // ── scroll helpers ────────────────────────────────────────────────────────

  function scrollToAddContext() {
    updateBriefRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      updateBriefRef.current?.querySelector("textarea")?.focus();
    }, 400);
  }


  function scrollAndGenResumeUpdates() {
    resumeUpdateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!job?.resumeUpdateResult && !isGeneratingResumeUpdates) {
      setTimeout(() => handleGenerateResumeUpdates(), 500);
    }
  }

  function scrollAndGenOutreach() {
    outreachRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!job?.outreachResult && !isGeneratingOutreach) {
      setTimeout(() => handleGenerateOutreach(), 500);
    }
  }

  async function handleRecoveryRescore() {
    if (!recoveryJobDescription || !profileText) return;
    setIsRecoveryRescoring(true);
    setRecoveryRescoreError("");
    try {
      const res = await fetch("/api/score-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobDescription: recoveryJobDescription }),
      });
      const data = await res.json() as JobFitResult & { error?: string };
      if (!res.ok) {
        setRecoveryRescoreError(data.error ?? "Re-scoring failed. Try again.");
      } else {
        const fitValidation = validateJobFitResult(data);
        if (!fitValidation.valid) {
          setRecoveryRescoreError("Re-score returned an unexpected format. Try again.");
          return;
        }
        const supabase = createClient();
        await supabase.from("tracked_jobs").update({ job_fit_result: data }).eq("id", jobId);
        setJob({
          id: jobId,
          label: recoveryJobDescription.slice(0, 60),
          jobDescription: recoveryJobDescription,
          jobFitResult: fitValidation.result,
          tailoringResult: null,
          outreachResult: null,
          coverLetterResult: null,
          resumeUpdateResult: null,
          interviewPrepResult: null,
          followUpResult: null,
          companyResearchResult: null,
          deadline: null,
          scoredAt: new Date(),
          applicationStatus: "Tracking" as const,
          notes: "",
          candidateContext: [],
        });
        setJobFitValidationError(null);
        setBriefStatus("pending");
        setRecoveryJobDescription("");
      }
    } catch {
      setRecoveryRescoreError("Network error. Check your connection and try again.");
    } finally {
      setIsRecoveryRescoring(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: APP_BG }}>
        <Spinner />
      </div>
    );
  }

  if (jobFitValidationError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: APP_BG }}>
        <div className="glass-card" style={{ borderRadius: 14, padding: "40px 44px", maxWidth: 480 }}>
          <p className="font-sans font-medium text-[#1C2333] text-[16px] mb-2">Analysis needs updating</p>
          <p className="font-sans text-[14px] text-[rgba(28,35,51,0.55)] leading-relaxed mb-6">
            This score was saved in an older format and can&apos;t be displayed. Re-score the job to get a fresh analysis.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            {recoveryJobDescription && profileText ? (
              <button
                onClick={() => void handleRecoveryRescore()}
                disabled={isRecoveryRescoring}
                className="font-sans text-[13px] font-medium text-white bg-[#1C2333] rounded-[8px] px-4 py-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity btn-shadow-dark"
              >
                {isRecoveryRescoring ? "Re-scoring…" : "Re-score this job"}
              </button>
            ) : recoveryJobDescription && !profileText ? (
              <p className="font-sans text-[13px] text-[rgba(28,35,51,0.55)]">Add your profile to re-score.</p>
            ) : null}
            <Link
              href="/"
              className="font-sans text-[13px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors"
            >
              ← Back to jobs
            </Link>
          </div>
          {recoveryRescoreError && (
            <p className="font-sans text-[12px] text-[#8A7373] mt-3">{recoveryRescoreError}</p>
          )}
        </div>
      </div>
    );
  }

  if (!job) return null;

  const { jobFitResult, tailoringResult, outreachResult } = job;
  const recStyle = REC_STYLES[jobFitResult.recommendation] ?? { color: "rgba(28,35,51,0.45)", bg: "rgba(28,35,51,0.05)" };
  const briefReady = !!tailoringResult;

  // Single decision summary — honest_take when ready, summary while loading
  const decisionSummary = (briefReady && tailoringResult.honest_take)
    ? tailoringResult.honest_take
    : jobFitResult.summary;

  // Evidence visibility
  const haveItems = jobFitResult.what_you_have ?? [];
  const missingItems = jobFitResult.whats_missing ?? [];
  const visibleHave = showAllHave ? haveItems : haveItems.slice(0, 3);
  const visibleMissing = showAllMissing ? missingItems : missingItems.slice(0, 2);
  const hasRecruiterConcern = !!jobFitResult.recruiter_concern && jobFitResult.recruiter_concern !== "None identified";

  // Lead strengths visibility
  const leadStrengths = tailoringResult?.lead_strengths ?? [];
  const visibleLeads = showAllLeads ? leadStrengths : leadStrengths.slice(0, 3);

  // Dimensions — guard against missing/malformed data from legacy or failed scores
  const dims = jobFitResult.dimensions ?? null;
  const dimensions = dims ? [
    { label: "Functional Fit",  score: dims.functional_fit?.score  ?? 0, reasoning: dims.functional_fit?.reasoning  ?? "" },
    { label: "Seniority Fit",   score: dims.seniority_fit?.score   ?? 0, reasoning: dims.seniority_fit?.reasoning   ?? "" },
    { label: "Industry Fit",    score: dims.industry_fit?.score    ?? 0, reasoning: dims.industry_fit?.reasoning    ?? "" },
    { label: "Keyword Overlap", score: dims.keyword_overlap?.score ?? 0, reasoning: dims.keyword_overlap?.reasoning ?? "" },
  ] : [];
  const lowestDimScore = dimensions.length > 0 ? Math.min(...dimensions.map(d => d.score)) : 0;

  function dimFill(score: number) {
    if (score >= 7) return "#7A8B73";
    if (score >= 5) return "#9B8E73";
    return "#8A7373";
  }

  // Nav helpers
  function navTo(tab: string) {
    try { sessionStorage.setItem("signal-active-tab", tab); } catch { /* ignore */ }
    router.push("/");
  }

  // Before you apply — shared derivation keeps page and email advice in sync
  const sharedBeforeActions = deriveBeforeYouApplyActions(jobFitResult, tailoringResult);
  // Attach page-specific CTAs
  const shownBeforeActions = sharedBeforeActions.map((a) =>
    a.ctaLabel === "Draft outreach →"
      ? { ...a, onCtaClick: scrollAndGenOutreach }
      : a
  );

  return (
    <div className="min-h-screen flex" style={{ background: APP_BG }}>

      {/* ── DESKTOP SIDEBAR ────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-30 glass-sidebar">
        {/* Logo */}
        <div style={{ padding: "28px 24px 32px" }}>
          <button
            onClick={() => navTo("my-jobs")}
            className="flex items-center focus:outline-none"
            style={{ gap: 8, background: "none", border: "none", cursor: "pointer" }}
          >
            <Brandmark />
            <span style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 15, letterSpacing: "-0.01em", color: "#1C2333" }}>
              Claro
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {([
            { id: "my-jobs", label: "My Jobs" },
            { id: "profile", label: "My Profile" },
          ] as const).map(item => (
            <button
              key={item.id}
              onClick={() => navTo(item.id)}
              className="w-full flex items-center text-left transition-colors px-3 rounded-[7px] text-[rgba(28,35,51,0.65)] hover:text-[#1C2333] hover:bg-white/35 focus:outline-none"
              style={{ gap: 10, paddingTop: 9, paddingBottom: 9 }}
            >
              <span style={{ width: 16, height: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(28,35,51,0.32)" }}>
                {item.id === "profile" ? (
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
                    <path d="M6 6.5a3 3 0 100-6 3 3 0 000 6zM1 13.5a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
                    <path d="M1 1.5h12M1 5.5h12M1 9.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </span>
              <span style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14, fontWeight: 400 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "0 24px 24px" }}>
          {userEmail && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <p className="truncate" style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12, color: "rgba(28,35,51,0.45)" }}>
                {userEmail}
              </p>
              <button
                onClick={handleSignOut}
                style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12, color: "rgba(28,35,51,0.45)", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                className="hover:text-[#1C2333] transition-colors focus:outline-none"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ─────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 z-30 flex items-center justify-between px-4 glass-topbar">
        <button
          onClick={() => navTo("my-jobs")}
          className="flex items-center gap-2 font-sans text-[13px] text-[rgba(28,35,51,0.50)] hover:text-[#1C2333] transition-colors focus:outline-none"
          style={{ fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M13 5H1M1 5L5 1M1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Jobs
        </button>

        <p className="font-sans font-medium text-[#1C2333] truncate text-center" style={{ fontSize: 13, maxWidth: "50vw" }}>
          {job.label}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="font-sans text-[13px] font-medium text-[rgba(28,35,51,0.50)] hover:text-[#1C2333] transition-colors focus:outline-none"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
          >
            {copied ? "✓" : "Copy brief"}
          </button>
          <button
            onClick={handleEmailSend}
            disabled={emailState === "sending"}
            className="font-sans text-[13px] font-medium text-white bg-[#1C2333] rounded-[7px] hover:opacity-90 transition-opacity disabled:opacity-60 focus:outline-none"
            style={{ height: 30, padding: "0 12px", cursor: emailState === "sending" ? "default" : "pointer" }}
          >
            {emailState === "sending" ? "Sending…"
              : emailState === "sent" ? `Sent to ${userEmail} ✓`
              : emailState === "error" ? "Couldn't send"
              : "Email me the brief"}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-60 overflow-x-hidden">
        {/* Mobile spacer */}
        <div className="h-14 lg:hidden" />

        {/* Desktop topbar */}
        <header
          className="hidden lg:flex sticky top-0 z-20 items-center justify-between"
          style={{
            padding: "0 40px",
            height: 56,
            background: "rgba(245,243,240,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(28,35,51,0.07)",
          }}
        >
          <p className="font-sans font-medium text-[#1C2333] truncate" style={{ fontSize: 14, letterSpacing: "-0.01em", maxWidth: "60vw" }}>
            {job.label}
          </p>
          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            <button
              onClick={handleCopy}
              className="font-sans text-[13px] font-medium text-[rgba(28,35,51,0.50)] hover:text-[#1C2333] transition-colors focus:outline-none"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
            >
              {copied ? "Copied ✓" : "Copy brief"}
            </button>
            <button
              onClick={handleEmailSend}
              disabled={emailState === "sending"}
              className="font-sans text-[13px] font-medium text-white bg-[#1C2333] rounded-[7px] hover:opacity-90 transition-opacity disabled:opacity-60 focus:outline-none"
              style={{ height: 32, padding: "0 14px", cursor: emailState === "sending" ? "default" : "pointer" }}
            >
              {emailState === "sending" ? "Sending…"
                : emailState === "sent" ? `Sent to ${userEmail} ✓`
                : emailState === "error" ? "Couldn't send"
                : "Email me the brief"}
            </button>
          </div>
        </header>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <main className="mx-auto w-full" style={{ maxWidth: 920, padding: "48px 32px 120px" }}>

          {/* ─ Content header: company + role ─ */}
          <div style={{ marginBottom: 32 }}>
            {jobFitResult.company && (
              <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)]" style={{ marginBottom: 4 }}>
                {jobFitResult.company}
              </p>
            )}
            <h1 className="font-sans font-semibold text-[#1C2333]" style={{ fontSize: 28, letterSpacing: "-0.015em", lineHeight: 1.2 }}>
              {job.label}
            </h1>
          </div>

          {/* ─ Score + recommendation ─ */}
          <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.07em", color: "rgba(28,35,51,0.40)", textTransform: "uppercase", marginBottom: 8 }}>
            Profile match
          </p>
          <div className="flex items-center gap-4 flex-wrap" style={{ marginBottom: 20 }}>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans font-medium tabular-nums text-[#1C2333]"
                style={{ fontSize: 72, lineHeight: 0.88, letterSpacing: "-0.05em" }}>
                {jobFitResult.overall_fit}
              </span>
              <span className="font-sans font-medium tabular-nums"
                style={{ fontSize: 22, letterSpacing: "-0.03em", color: "rgba(28,35,51,0.30)" }}>
                /10
              </span>
            </div>
            <span className="font-sans text-[13px] font-medium px-3 py-1.5 rounded-full"
              style={{ color: recStyle.color, background: recStyle.bg }}>
              {jobFitResult.recommendation}
            </span>
          </div>

          {/* ─ Decision summary (single source of truth) ─ */}
          <p className="font-serif text-[#1C2333]"
            style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.45, letterSpacing: "-0.015em", marginBottom: 20 }}>
            {decisionSummary}
          </p>

          {/* ─ Brief status — single prominent area ─ */}
          {briefStatus === "generating" && (
            <div style={{ marginBottom: 20 }}>
              <LoadingState steps={[
                "Identifying what to lead with…",
                "Looking for your strongest signals…",
                "Considering what a recruiter would notice…",
                "Finding the right framing for your background…",
                "Building the application angle…",
                "Shaping the strategy…",
              ]} />
            </div>
          )}
          {briefStatus === "failed" && (
            <div className="flex items-center gap-3" style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, background: "rgba(28,35,51,0.04)" }}>
              <p className="font-sans text-[13px] text-[rgba(28,35,51,0.65)] flex-1">
                {briefError || "Brief generation failed."}
              </p>
              {!!profileText && (
                <button
                  onClick={() => void handleRetryBrief()}
                  disabled={isRetrying}
                  className="shrink-0 font-sans text-[12px] font-medium text-white bg-[#1C2333] rounded-[7px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  style={{ height: 30, padding: "0 12px" }}
                >
                  {isRetrying ? "Retrying…" : "Retry"}
                </button>
              )}
            </div>
          )}

          {/* ─ Before you apply ─ */}
          {shownBeforeActions.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Before you apply</SectionLabel>
              <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
                {shownBeforeActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-sans text-[14px]" style={{ color: "rgba(28,35,51,0.30)", marginTop: 2, flexShrink: 0 }}>·</span>
                    <p className="font-sans text-[14px] text-[#1C2333] leading-snug">
                      {action.text}
                      {"onCtaClick" in action && action.ctaLabel && (
                        <>
                          {" "}
                          <button
                            onClick={(action as { onCtaClick: () => void }).onCtaClick}
                            className="font-sans text-[13px] font-medium text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] underline transition-colors focus:outline-none"
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          >
                            {action.ctaLabel}
                          </button>
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ─ How this score was calculated (collapsible) ─ */}
          <div style={{ marginBottom: 28 }}>
            <button
              onClick={() => setScoreOpen(v => !v)}
              className="flex items-center gap-1.5 font-sans text-[13px] font-medium text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors focus:outline-none"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.5 }}>
                <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.4 2.4l1.06 1.06M8.54 8.54l1.06 1.06M9.6 2.4L8.54 3.46M3.46 8.54L2.4 9.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Why this score? {scoreOpen ? "↑" : "↓"}
            </button>

            {scoreOpen && (
              <div className="mt-4 space-y-5">
                {dimensions.map(({ label, score, reasoning }) => (
                  <div key={label}>
                    <div className="flex items-baseline justify-between gap-2" style={{ marginBottom: 8 }}>
                      <p className="font-sans text-[12px] text-[rgba(28,35,51,0.55)]">{label}</p>
                      {score === lowestDimScore && (
                        <span style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 10, letterSpacing: "0.01em", color: "#8A7373" }}>
                          Pulling score down
                        </span>
                      )}
                    </div>
                    <ScoreBar score={score} fill={dimFill(score)} />
                    <p className="font-sans text-[15px] text-[rgba(28,35,51,0.65)] leading-relaxed" style={{ marginTop: 6 }}>
                      {reasoning}
                    </p>
                  </div>
                ))}
                {jobFitResult.mismatch_types?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {jobFitResult.mismatch_types.map((t) => (
                      <span key={t} className="font-sans text-[12px] px-2.5 py-1 text-[rgba(28,35,51,0.45)]"
                        style={{ background: "rgba(28,35,51,0.05)", borderRadius: 9999 }}>
                        {t === "title" ? "Title mismatch"
                          : t === "comp" ? "Comp gap likely"
                          : t === "scope" ? "Scope mismatch"
                          : t === "domain" ? "Domain mismatch"
                          : "Functional mismatch"}
                      </span>
                    ))}
                  </div>
                )}

                {jobFitResult.evidence_items && jobFitResult.evidence_items.length > 0 && (
                  <div>
                    <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.07em", color: "rgba(28,35,51,0.40)", marginBottom: 10, textTransform: "uppercase" }}>
                      Findings
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {jobFitResult.evidence_items.map((ev, i) => {
                        const typeColors: Record<string, string> = {
                          demonstrated:        "#7A8B73",
                          not_demonstrated:    "#9B8E73",
                          confirmed_gap:       "#8A7373",
                          needs_clarification: "#9B8E73",
                        };
                        const typeLabels: Record<string, string> = {
                          demonstrated:        "Verified",
                          not_demonstrated:    "Not shown",
                          confirmed_gap:       "Gap",
                          needs_clarification: "Needs follow-up",
                        };
                        const col = typeColors[ev.type] ?? "rgba(28,35,51,0.45)";
                        return (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "0 12px", alignItems: "start" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 2 }}>
                              <span className="inline-block font-sans text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none" style={{ color: col, background: `${col}18`, whiteSpace: "nowrap" }}>
                                {typeLabels[ev.type] ?? ev.type}
                              </span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <p className="font-sans text-[15px] text-[rgba(28,35,51,0.75)] leading-snug">{ev.text}</p>
                              {ev.requirement && (
                                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)] leading-snug">
                                  JD requirement: {ev.requirement}
                                </p>
                              )}
                              {ev.resume_evidence && ev.type === "demonstrated" && verifyExcerpt(ev.resume_evidence, profileText) ? (
                                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.50)] leading-snug italic">
                                  <span className="not-italic text-[rgba(28,35,51,0.40)] mr-1">From resume:</span>
                                  &ldquo;{ev.resume_evidence}&rdquo;
                                </p>
                              ) : ev.resume_evidence ? (
                                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.50)] leading-snug">
                                  <span className="text-[rgba(28,35,51,0.40)] mr-1">Model summary:</span>
                                  {ev.resume_evidence}
                                </p>
                              ) : !ev.requirement ? (
                                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.40)] leading-snug">
                                  Source unavailable
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─ Action buttons ─ */}
          {briefReady && (
            <div className="flex flex-wrap gap-2" style={{ marginBottom: 28 }}>
              <button
                onClick={scrollAndGenResumeUpdates}
                className="font-sans text-[13px] font-medium text-[#1C2333] hover:opacity-70 transition-opacity focus:outline-none"
                style={{ height: 34, padding: "0 14px", border: "1px solid rgba(28,35,51,0.14)", borderRadius: 8, background: "rgba(28,35,51,0.03)", cursor: "pointer" }}
              >
                Suggested resume changes
              </button>
              <button
                onClick={scrollToAddContext}
                className="font-sans text-[13px] font-medium text-[#1C2333] hover:opacity-70 transition-opacity focus:outline-none"
                style={{ height: 34, padding: "0 14px", border: "1px solid rgba(28,35,51,0.14)", borderRadius: 8, background: "rgba(28,35,51,0.03)", cursor: "pointer" }}
              >
                Add experience or correct details
              </button>
              {tailoringResult?.outreach_angle && (
                <button
                  onClick={scrollAndGenOutreach}
                  className="font-sans text-[13px] font-medium text-[#1C2333] hover:opacity-70 transition-opacity focus:outline-none"
                  style={{ height: 34, padding: "0 14px", border: "1px solid rgba(28,35,51,0.14)", borderRadius: 8, background: "rgba(28,35,51,0.03)", cursor: "pointer" }}
                >
                  Draft outreach
                </button>
              )}
            </div>
          )}

          {/* ─ Stale analysis warning ─ */}
          {(isAnalysisStale || isVersionStale) && (
            <div style={{ borderLeft: "2px solid #9B8E73", paddingLeft: 14, marginBottom: 20 }}>
              <p className="font-sans text-[13px] text-[rgba(28,35,51,0.65)] leading-snug">
                {isVersionStale
                  ? "The scoring model has been updated since this job was analyzed. Re-score to get the latest assessment."
                  : "Your profile was updated after this job was scored. This analysis may not reflect your current background."}{" "}
                <button
                  onClick={handleRescore}
                  disabled={isRescoring}
                  className="font-sans text-[13px] text-[#9B8E73] hover:text-[#1C2333] transition-colors focus:outline-none disabled:opacity-50"
                  style={{ background: "none", border: "none", padding: 0, cursor: isRescoring ? "default" : "pointer", textDecoration: "underline" }}
                >
                  {isRescoring ? "Re-scoring…" : "Update analysis →"}
                </button>
              </p>
              {rescoreError && (
                <p className="font-sans text-[12px] text-[#8A7373] mt-1">{rescoreError}</p>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p className="font-sans text-[13px] text-[rgba(28,35,51,0.40)]" style={{ marginBottom: 32 }}>
            This compares your profile with the job description. It doesn&apos;t predict whether you&apos;ll get an interview.
          </p>

          {/* ─ What you have / missing ─ */}
          {(haveItems.length > 0 || missingItems.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8" style={{ marginBottom: 32 }}>
              {haveItems.length > 0 && (
                <div>
                  <SectionLabel>Relevant experience</SectionLabel>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
                    {visibleHave.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 font-sans text-[14px] text-[#1C2333] leading-snug">
                        <span style={{ color: "#7A8B73", marginTop: 3, flexShrink: 0 }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {haveItems.length > 3 && (
                    <button
                      onClick={() => setShowAllHave(v => !v)}
                      className="font-sans text-[12px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors focus:outline-none"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 10 }}
                    >
                      {showAllHave ? "Show fewer ↑" : `Show ${haveItems.length - 3} more ↓`}
                    </button>
                  )}
                </div>
              )}
              {missingItems.length > 0 && (
                <div>
                  <SectionLabel>Requirements to review</SectionLabel>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
                    {visibleMissing.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 font-sans text-[14px] text-[rgba(28,35,51,0.65)] leading-snug">
                        <span style={{ color: "rgba(28,35,51,0.30)", marginTop: 3, flexShrink: 0 }}>–</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {missingItems.length > 2 && (
                    <button
                      onClick={() => setShowAllMissing(v => !v)}
                      className="font-sans text-[12px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors focus:outline-none"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 10 }}
                    >
                      {showAllMissing ? "Show fewer ↑" : `Show ${missingItems.length - 2} more ↓`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─ Recruiter concern ─ */}
          {hasRecruiterConcern && (
            <div style={{ borderLeft: "2px solid #C9A87A", paddingLeft: 16, marginBottom: 40 }}>
              <p style={{
                fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11,
                letterSpacing: "0.07em", color: "#9B8E73", marginBottom: 8, textTransform: "uppercase",
              }}>
                A question to prepare for
              </p>
              <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed">
                {jobFitResult.recruiter_concern}
              </p>
            </div>
          )}

          {/* ─ Divider ─ */}
          <div style={{ borderTop: "1px solid rgba(28,35,51,0.09)", marginBottom: 48 }} />

          {/* ── APPLICATION BRIEF ─────────────────────────────────────────── */}

          {briefReady && (
            <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>

              {/* Stale-brief notice after partial reassessment failure */}
              {briefStaleAfterRescore && (
                <div style={{ borderLeft: "2px solid #9B8E73", paddingLeft: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)] leading-snug">
                    Assessment updated. This brief reflects the earlier findings — retry to refresh it.
                  </p>
                  <button
                    onClick={() => void handleRetryBriefAfterRescore()}
                    disabled={isRegenerating}
                    className="shrink-0 font-sans text-[13px] font-medium text-white bg-[#1C2333] rounded-[7px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity focus:outline-none"
                    style={{ height: 32, padding: "0 14px" }}
                  >
                    {isRegenerating ? "Retrying…" : "Retry brief →"}
                  </button>
                </div>
              )}

              {/* Lead with — 3 cards, expandable detail, show all */}
              {leadStrengths.length > 0 && (
                <div>
                  <SectionLabel>Experience to highlight</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {visibleLeads.map((s, i) => (
                      <div key={i} className="glass-card" style={{ borderRadius: 10, padding: "16px 20px" }}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-sans text-[14px] font-medium text-[#1C2333]">{s.strength}</p>
                          {s.framing_language && (
                            <button
                              onClick={() => setExpandedLead(expandedLead === i ? null : i)}
                              className="shrink-0 font-sans text-[12px] text-[rgba(28,35,51,0.40)] hover:text-[#1C2333] transition-colors focus:outline-none"
                              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              {expandedLead === i ? "Less ↑" : "See suggested wording →"}
                            </button>
                          )}
                        </div>
                        {expandedLead === i && s.framing_language && (
                          <p className="font-sans text-[13px] text-[rgba(28,35,51,0.60)] leading-snug" style={{ marginTop: 10 }}>
                            {s.framing_language}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {leadStrengths.length > 3 && (
                    <button
                      onClick={() => setShowAllLeads(v => !v)}
                      className="font-sans text-[12px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors focus:outline-none"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 12 }}
                    >
                      {showAllLeads ? "Show less ↑" : `Show ${leadStrengths.length - 3} more ↓`}
                    </button>
                  )}
                </div>
              )}

              {/* Relevant terminology */}
              {tailoringResult.jd_language_to_mirror.length > 0 && (
                <div>
                  <SectionLabel>Terms from the job description</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {tailoringResult.jd_language_to_mirror.map((p, i) => (
                      <span key={i} className="font-sans text-[13px] px-3 py-1.5 text-[#1C2333]"
                        style={{ background: "rgba(28,35,51,0.05)", borderRadius: 9999 }}>
                        &ldquo;{p.phrase}&rdquo;
                      </span>
                    ))}
                  </div>
                  <p className="font-sans text-[12px] text-[rgba(28,35,51,0.35)]" style={{ marginTop: 8 }}>
                    Use these terms where they describe work you&apos;ve done.
                  </p>
                </div>
              )}

              {/* Outreach */}
              {tailoringResult.outreach_angle && (
                <div ref={outreachRef}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <SectionLabel>Outreach</SectionLabel>
                    <button
                      onClick={handleGenerateOutreach}
                      disabled={isGeneratingOutreach}
                      className="flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
                      style={{ color: "rgba(28,35,51,0.50)", background: "none", border: "none", cursor: isGeneratingOutreach ? "default" : "pointer", padding: 0 }}
                    >
                      {isGeneratingOutreach ? <><Spinner /> Generating…</> : outreachResult ? "Regenerate" : "Generate"}
                    </button>
                  </div>
                  {isGeneratingOutreach && <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)]">Drafting outreach messages…</p>}
                  {outreachError && !isGeneratingOutreach && <p className="font-sans text-[13px] text-[#8A7373]">{outreachError}</p>}
                  {outreachResult && !isGeneratingOutreach && (
                    <div>
                      {staleDrafts.outreach && (
                        <p className="font-sans text-[13px] text-[rgba(28,35,51,0.50)]" style={{ marginBottom: 8 }}>
                          Based on the earlier assessment. Regenerate to reflect the updated findings.
                        </p>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div className="glass-card" style={{ borderRadius: 10, padding: "20px 24px" }}>
                          <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.06em", color: "rgba(28,35,51,0.40)", marginBottom: 10 }}>EMAIL</p>
                          <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">{outreachResult.email}</p>
                        </div>
                        <div className="glass-card" style={{ borderRadius: 10, padding: "20px 24px" }}>
                          <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.06em", color: "rgba(28,35,51,0.40)", marginBottom: 10 }}>LINKEDIN</p>
                          <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">{outreachResult.linkedin_message}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {!outreachResult && !isGeneratingOutreach && !outreachError && (
                    <p className="font-sans text-[13px] text-[rgba(28,35,51,0.35)]">Generate email and LinkedIn outreach for this role.</p>
                  )}
                </div>
              )}

              {/* Suggested resume changes */}
              <div ref={resumeUpdateRef} style={{ borderTop: "1px solid rgba(28,35,51,0.08)", paddingTop: 32 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <SectionLabel>Suggested resume changes</SectionLabel>
                  <button
                    onClick={handleGenerateResumeUpdates}
                    disabled={isGeneratingResumeUpdates}
                    className="flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
                    style={{ color: "rgba(28,35,51,0.50)", background: "none", border: "none", cursor: isGeneratingResumeUpdates ? "default" : "pointer", padding: 0 }}
                  >
                    {isGeneratingResumeUpdates
                      ? <><Spinner /> Generating…</>
                      : job.resumeUpdateResult ? "Regenerate" : "Generate"}
                  </button>
                </div>
                {isGeneratingResumeUpdates && (
                  <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)]">Generating resume suggestions…</p>
                )}
                {resumeUpdateError && !isGeneratingResumeUpdates && (
                  <p className="font-sans text-[13px] text-[#8A7373]">{resumeUpdateError}</p>
                )}
                {job.resumeUpdateResult && !isGeneratingResumeUpdates && (
                  <div>
                  {staleDrafts.resumeSuggestions && (
                    <p className="font-sans text-[13px] text-[rgba(28,35,51,0.50)]" style={{ marginBottom: 8 }}>
                      Based on the earlier assessment. Regenerate to reflect the updated findings.
                    </p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {job.resumeUpdateResult.summary_rewrite && (
                      <div className="glass-card" style={{ borderRadius: 10, padding: "16px 20px" }}>
                        <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.06em", color: "rgba(28,35,51,0.40)", marginBottom: 8 }}>SUMMARY REWRITE</p>
                        <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed">{job.resumeUpdateResult.summary_rewrite}</p>
                      </div>
                    )}
                    {job.resumeUpdateResult.bullet_updates?.length > 0 && (
                      <div className="glass-card" style={{ borderRadius: 10, padding: "16px 20px" }}>
                        <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.06em", color: "rgba(28,35,51,0.40)", marginBottom: 10 }}>BULLET UPDATES</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {job.resumeUpdateResult.bullet_updates.map((b, i) => (
                            <div key={i}>
                              <p className="font-sans text-[12px] text-[rgba(28,35,51,0.40)]" style={{ marginBottom: 3 }}>Before: {b.original}</p>
                              <p className="font-sans text-[13px] text-[#1C2333] leading-snug">After: {b.suggested}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {job.resumeUpdateResult.keywords_to_weave_in?.length > 0 && (
                      <div>
                        <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.07em", color: "rgba(28,35,51,0.40)", marginBottom: 8, textTransform: "uppercase" }}>Keywords to work in</p>
                        <div className="flex flex-wrap gap-2">
                          {job.resumeUpdateResult.keywords_to_weave_in.map((k, i) => (
                            <span key={i} className="font-sans text-[12px] px-2.5 py-1 text-[#1C2333]"
                              style={{ background: "rgba(28,35,51,0.05)", borderRadius: 9999 }}>
                              {k.keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                )}
                {!job.resumeUpdateResult && !isGeneratingResumeUpdates && !resumeUpdateError && (
                  <p className="font-sans text-[13px] text-[rgba(28,35,51,0.35)]">
                    Get specific, copy-paste resume edits tailored to this job description.
                  </p>
                )}
              </div>

              {/* Add experience or correct details */}
              <div ref={updateBriefRef} style={{ borderTop: "1px solid rgba(28,35,51,0.08)", paddingTop: 32 }}>
                <SectionLabel>Add experience or correct details</SectionLabel>
                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.50)]" style={{ marginBottom: 10 }}>
                  A resume doesn&apos;t always include every relevant project. Add experience or correct a detail for Claro to consider.
                </p>
                {job.candidateContext && job.candidateContext.length > 0 && (
                  <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                    <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.06em", color: "rgba(28,35,51,0.40)", marginBottom: 4 }}>PREVIOUSLY SUBMITTED</p>
                    {job.candidateContext.map((note, i) => (
                      <p key={i} className="font-sans text-[13px] text-[rgba(28,35,51,0.55)] leading-snug">— {note.text}</p>
                    ))}
                  </div>
                )}
                <textarea
                  value={regenerateNote}
                  onChange={(e) => setRegenerateNote(e.target.value)}
                  placeholder="For example: I managed a team of six"
                  maxLength={5000}
                  rows={2}
                  className="w-full font-sans text-[13px] text-[#1C2333] bg-[rgba(28,35,51,0.03)] rounded-[8px] px-3 py-2.5 resize-none border border-[rgba(28,35,51,0.08)] focus:border-[rgba(28,35,51,0.20)] focus:outline-none focus:ring-0 placeholder:text-[rgba(28,35,51,0.35)] leading-relaxed"
                />
                <p className="font-sans text-[11px] text-right" style={{ marginTop: 2, color: regenerateNote.length > 4800 ? "#8A7373" : "rgba(28,35,51,0.30)" }}>
                  {regenerateNote.length}/5000
                </p>
                {regenerateError && (
                  <p className="font-sans text-[12px] text-[#8A7373]" style={{ marginTop: 4 }}>{regenerateError}</p>
                )}
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="mt-2 flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
                  style={{ color: "rgba(28,35,51,0.50)", background: "none", border: "none", cursor: isRegenerating ? "default" : "pointer", padding: 0 }}
                >
                  {isRegenerating ? <><Spinner /> Updating…</> : "Update assessment →"}
                </button>
                {!isRegenerating && regenerateChanges && (
                  <p className="font-sans text-[12px] text-[rgba(28,35,51,0.50)]" style={{ marginTop: 6 }}>
                    Updated: {regenerateChanges.join(", ")} ✓
                  </p>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
