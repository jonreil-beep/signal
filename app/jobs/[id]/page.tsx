"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatBrief } from "@/lib/formatBrief";
import { CURRENT_PROMPT_VERSION } from "@/lib/prompts";
import type {
  TrackedJob, JobFitResult, TailoringBriefResult,
  OutreachResult, CoverLetterResult,
} from "@/types";

// ── normalizers ───────────────────────────────────────────────────────────────

function normalizeJobFitResult(raw: unknown): JobFitResult {
  const r = raw as Record<string, unknown>;
  if (!r.what_you_have && r.what_she_has) {
    r.what_you_have = r.what_she_has;
    delete r.what_she_has;
  }
  return r as unknown as JobFitResult;
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

  // generation states
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [clError, setClError] = useState("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachError, setOutreachError] = useState("");
  const [regenerateNote, setRegenerateNote] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<EmailState>("idle");

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
  const coverLetterRef = useRef<HTMLDivElement>(null);

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

      setJob({
        id: row.id as string,
        label: row.label as string,
        jobDescription: row.job_description as string,
        jobFitResult: normalizeJobFitResult(row.job_fit_result),
        tailoringResult: row.tailoring_result as TailoringBriefResult | null,
        outreachResult: normalizeOutreachResult(row.outreach_result),
        coverLetterResult: row.cover_letter_result as CoverLetterResult | null,
        resumeUpdateResult: null,
        interviewPrepResult: null,
        followUpResult: null,
        companyResearchResult: null,
        deadline: (row.deadline as string) ?? null,
        scoredAt: new Date(row.scored_at as string),
        applicationStatus: "Tracking" as const,
        notes: (row.notes as string) ?? "",
      });
      setLoading(false);
    }
    load();
  }, [jobId, router]);

  // ── poll until brief arrives ──────────────────────────────────────────────

  useEffect(() => {
    if (!job || job.tailoringResult) return;
    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data: row } = await supabase
        .from("tracked_jobs")
        .select("tailoring_result, cover_letter_result, outreach_result")
        .eq("id", jobId)
        .single();
      if (row?.tailoring_result) {
        setJob((prev) => prev ? {
          ...prev,
          tailoringResult: row.tailoring_result as TailoringBriefResult,
          coverLetterResult: (row.cover_letter_result as CoverLetterResult | null) ?? prev.coverLetterResult,
          outreachResult: normalizeOutreachResult(row.outreach_result) ?? prev.outreachResult,
        } : prev);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [job, jobId]);

  // ── mutations ─────────────────────────────────────────────────────────────

  function updateJob(patch: Partial<TrackedJob>) {
    setJob((prev) => prev ? { ...prev, ...patch } : prev);
  }

  async function saveToDb(patch: Record<string, unknown>) {
    const supabase = createClient();
    await supabase.from("tracked_jobs").update(patch).eq("id", jobId);
  }

  async function handleGenerateCoverLetter() {
    if (!job) return;
    setIsGeneratingCL(true);
    setClError("");
    updateJob({ coverLetterResult: null });
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: job.jobDescription,
          outreachAngle: job.tailoringResult?.outreach_angle,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
          jobId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClError(data.error ?? "Failed to generate. Please try again.");
      } else {
        const result = data as CoverLetterResult;
        updateJob({ coverLetterResult: result });
        await saveToDb({ cover_letter_result: result });
      }
    } catch {
      setClError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingCL(false);
    }
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
      }
    } catch {
      setOutreachError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingOutreach(false);
    }
  }

  async function handleRegenerate() {
    if (!job || !profileText || !job.jobDescription) return;
    setIsRegenerating(true);
    setRegenerateError("");
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: job.jobDescription,
          jobId,
          userNote: regenerateNote || undefined,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegenerateError(data.error ?? "Failed to regenerate. Please try again.");
      } else {
        const result = data as TailoringBriefResult;
        updateJob({ tailoringResult: result, coverLetterResult: null, outreachResult: null });
        await saveToDb({ tailoring_result: result, cover_letter_result: null, outreach_result: null });
        setRegenerateNote("");
        setShowAllLeads(false);
        setExpandedLead(null);
      }
    } catch {
      setRegenerateError("Network error. Check your connection and try again.");
    } finally {
      setIsRegenerating(false);
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
    if (!job || !profileText || isRescoring) return;
    setIsRescoring(true);
    setRescoreError("");
    try {
      const res = await fetch("/api/score-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: job.jobDescription,
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

  function scrollAndGenCoverLetter() {
    coverLetterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!job?.coverLetterResult && !isGeneratingCL) {
      setTimeout(() => handleGenerateCoverLetter(), 500);
    }
  }

  function scrollAndGenOutreach() {
    outreachRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!job?.outreachResult && !isGeneratingOutreach) {
      setTimeout(() => handleGenerateOutreach(), 500);
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

  if (!job) return null;

  const { jobFitResult, tailoringResult, coverLetterResult, outreachResult } = job;
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

  // Dimensions
  const dimensions = [
    { label: "Functional Fit",  score: jobFitResult.dimensions.functional_fit.score,  reasoning: jobFitResult.dimensions.functional_fit.reasoning },
    { label: "Seniority Fit",   score: jobFitResult.dimensions.seniority_fit.score,   reasoning: jobFitResult.dimensions.seniority_fit.reasoning },
    { label: "Industry Fit",    score: jobFitResult.dimensions.industry_fit.score,    reasoning: jobFitResult.dimensions.industry_fit.reasoning },
    { label: "Keyword Overlap", score: jobFitResult.dimensions.keyword_overlap.score, reasoning: jobFitResult.dimensions.keyword_overlap.reasoning },
  ];
  const lowestDimScore = Math.min(...dimensions.map(d => d.score));

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
            { id: "profile", label: "My Profile" },
            { id: "my-jobs", label: "My Jobs" },
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
            {copied ? "✓" : "Copy"}
          </button>
          <button
            onClick={handleEmailSend}
            disabled={emailState === "sending"}
            className="font-sans text-[13px] font-medium text-white bg-[#1C2333] rounded-[7px] hover:opacity-90 transition-opacity disabled:opacity-60 focus:outline-none"
            style={{ height: 30, padding: "0 12px", cursor: emailState === "sending" ? "default" : "pointer" }}
          >
            {emailState === "sent" ? "Sent ✓" : emailState === "error" ? "Error" : "Email →"}
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
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button
              onClick={handleEmailSend}
              disabled={emailState === "sending"}
              className="font-sans text-[13px] font-medium text-white bg-[#1C2333] rounded-[7px] hover:opacity-90 transition-opacity disabled:opacity-60 focus:outline-none"
              style={{ height: 32, padding: "0 14px", cursor: emailState === "sending" ? "default" : "pointer" }}
            >
              {emailState === "sending" ? "Sending…"
                : emailState === "sent" ? "Sent ✓"
                : emailState === "error" ? "Couldn't send"
                : "Email →"}
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
            <h1 className="font-sans font-medium text-[#1C2333]" style={{ fontSize: 28, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {job.label}
            </h1>
          </div>

          {/* ─ Score + recommendation ─ */}
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
          <p className="font-sans text-[#1C2333]"
            style={{ fontSize: briefReady ? 16 : 17, lineHeight: 1.55, letterSpacing: "-0.01em", maxWidth: 660, marginBottom: 20 }}>
            {decisionSummary}
            {!briefReady && (
              <span className="inline-flex items-center gap-1.5 ml-2 text-[rgba(28,35,51,0.40)] text-[13px]" style={{ verticalAlign: "middle" }}>
                <Spinner /> Building brief…
              </span>
            )}
          </p>

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
              See how this score was calculated {scoreOpen ? "↑" : "↓"}
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
                    <p className="font-sans text-[13px] text-[rgba(28,35,51,0.55)] leading-relaxed" style={{ marginTop: 6 }}>
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
              </div>
            )}
          </div>

          {/* ─ Action buttons ─ */}
          {briefReady && (
            <div className="flex flex-wrap gap-2" style={{ marginBottom: 28 }}>
              <button
                onClick={scrollToAddContext}
                className="font-sans text-[13px] font-medium text-[#1C2333] hover:opacity-70 transition-opacity focus:outline-none"
                style={{ height: 34, padding: "0 14px", border: "1px solid rgba(28,35,51,0.14)", borderRadius: 8, background: "rgba(28,35,51,0.03)", cursor: "pointer" }}
              >
                Add context
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
              <button
                onClick={scrollAndGenCoverLetter}
                className="font-sans text-[13px] font-medium text-[#1C2333] hover:opacity-70 transition-opacity focus:outline-none"
                style={{ height: 34, padding: "0 14px", border: "1px solid rgba(28,35,51,0.14)", borderRadius: 8, background: "rgba(28,35,51,0.03)", cursor: "pointer" }}
              >
                Create cover letter
              </button>
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
          <p className="font-sans text-[12px] text-[rgba(28,35,51,0.35)]" style={{ marginBottom: 32 }}>
            Based on your profile and this job description. Not a prediction of interview outcomes.
          </p>

          {/* ─ What you have / missing ─ */}
          {(haveItems.length > 0 || missingItems.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8" style={{ marginBottom: 32 }}>
              {haveItems.length > 0 && (
                <div>
                  <SectionLabel>What you have</SectionLabel>
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
                      {showAllHave ? "Show less ↑" : `Show all ${haveItems.length - 3} more ↓`}
                    </button>
                  )}
                </div>
              )}
              {missingItems.length > 0 && (
                <div>
                  <SectionLabel>What&apos;s missing</SectionLabel>
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
                      {showAllMissing ? "Show less ↑" : `Show all ${missingItems.length - 2} more ↓`}
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
                A hiring team may raise
              </p>
              <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed">
                {jobFitResult.recruiter_concern}
              </p>
            </div>
          )}

          {/* ─ Divider ─ */}
          <div style={{ borderTop: "1px solid rgba(28,35,51,0.09)", marginBottom: 48 }} />

          {/* ── APPLICATION BRIEF ─────────────────────────────────────────── */}

          {!briefReady ? (
            <div className="flex items-center gap-3">
              <Spinner />
              <p className="font-sans text-[14px] text-[rgba(28,35,51,0.50)]">Building your brief…</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>

              {/* Lead with — 3 cards, expandable detail, show all */}
              {leadStrengths.length > 0 && (
                <div>
                  <SectionLabel>Lead with</SectionLabel>
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
                              {expandedLead === i ? "Less ↑" : "How to frame →"}
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
                  <SectionLabel>Relevant terminology</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {tailoringResult.jd_language_to_mirror.map((p, i) => (
                      <span key={i} className="font-sans text-[13px] px-3 py-1.5 text-[#1C2333]"
                        style={{ background: "rgba(28,35,51,0.05)", borderRadius: 9999 }}>
                        &ldquo;{p.phrase}&rdquo;
                      </span>
                    ))}
                  </div>
                  <p className="font-sans text-[12px] text-[rgba(28,35,51,0.35)]" style={{ marginTop: 8 }}>
                    Use where accurate. Don&apos;t claim experience you don&apos;t have.
                  </p>
                </div>
              )}

              {/* Cover letter */}
              <div ref={coverLetterRef}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <SectionLabel>Cover letter</SectionLabel>
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={isGeneratingCL}
                    className="flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
                    style={{ color: "rgba(28,35,51,0.50)", background: "none", border: "none", cursor: isGeneratingCL ? "default" : "pointer", padding: 0 }}
                  >
                    {isGeneratingCL ? <><Spinner /> Generating…</> : coverLetterResult ? "Regenerate" : "Generate"}
                  </button>
                </div>
                {isGeneratingCL && <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)]">Writing your cover letter…</p>}
                {clError && !isGeneratingCL && <p className="font-sans text-[13px] text-[#8A7373]">{clError}</p>}
                {coverLetterResult && !isGeneratingCL && (
                  <div className="glass-card" style={{ borderRadius: 10, padding: "20px 24px" }}>
                    <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">
                      {coverLetterResult.cover_letter}
                    </p>
                  </div>
                )}
                {!coverLetterResult && !isGeneratingCL && !clError && (
                  <p className="font-sans text-[13px] text-[rgba(28,35,51,0.35)]">Generate a cover letter tailored to this role.</p>
                )}
              </div>

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
                  )}
                  {!outreachResult && !isGeneratingOutreach && !outreachError && (
                    <p className="font-sans text-[13px] text-[rgba(28,35,51,0.35)]">Generate email and LinkedIn outreach for this role.</p>
                  )}
                </div>
              )}

              {/* Update brief */}
              <div ref={updateBriefRef} style={{ borderTop: "1px solid rgba(28,35,51,0.08)", paddingTop: 32 }}>
                <SectionLabel>Add context</SectionLabel>
                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.50)]" style={{ marginBottom: 10 }}>
                  Add something Claro may have missed — a specific project, correction, or framing preference.
                </p>
                <textarea
                  value={regenerateNote}
                  onChange={(e) => setRegenerateNote(e.target.value)}
                  placeholder="e.g. I led the rebrand end-to-end, not just the visual side."
                  maxLength={400}
                  rows={2}
                  className="w-full font-sans text-[13px] text-[#1C2333] bg-[rgba(28,35,51,0.03)] rounded-[8px] px-3 py-2.5 resize-none border border-[rgba(28,35,51,0.08)] focus:border-[rgba(28,35,51,0.20)] focus:outline-none focus:ring-0 placeholder:text-[rgba(28,35,51,0.35)] leading-relaxed"
                />
                {regenerateError && (
                  <p className="font-sans text-[12px] text-[#8A7373]" style={{ marginTop: 4 }}>{regenerateError}</p>
                )}
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="mt-2 flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
                  style={{ color: "rgba(28,35,51,0.50)", background: "none", border: "none", cursor: isRegenerating ? "default" : "pointer", padding: 0 }}
                >
                  {isRegenerating ? <><Spinner /> Rebuilding…</> : "Rebuild →"}
                </button>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
