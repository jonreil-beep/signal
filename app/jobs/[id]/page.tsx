"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatBrief } from "@/lib/formatBrief";
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

const NEXT_ACTION: Record<string, string> = {
  "Pursue":         "Draft outreach. The cover letter and LinkedIn message are ready below.",
  "Consider":       "Review the positioning notes below before drafting. The framing matters here.",
  "Lower priority": "Clarify the gaps before investing time. Address the concern below first.",
};

const APP_BG = [
  "radial-gradient(ellipse 70% 60% at 95% 5%, rgba(255,150,70,0.18) 0%, transparent 65%)",
  "radial-gradient(ellipse 70% 65% at 5% 95%, rgba(100,110,220,0.16) 0%, transparent 65%)",
  "radial-gradient(ellipse 55% 55% at 95% 60%, rgba(215,90,150,0.13) 0%, transparent 58%)",
  "#F5F3F0",
].join(", ");

// ── small components ──────────────────────────────────────────────────────────

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

type EmailState = "idle" | "sending" | "sent" | "error";

// ── page ──────────────────────────────────────────────────────────────────────

export default function BriefingPage() {
  const params = useParams();
  const jobId = params.id as string;
  const router = useRouter();

  const [job, setJob] = useState<TrackedJob | null>(null);
  const [profileText, setProfileText] = useState("");
  const [writingSample, setWritingSample] = useState("");
  const [pivotTarget, setPivotTarget] = useState("");
  const [loading, setLoading] = useState(true);

  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [clError, setClError] = useState("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachError, setOutreachError] = useState("");
  const [regenerateNote, setRegenerateNote] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<EmailState>("idle");

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }

      const userId = session.user.id;
      const [{ data: row }, { data: profile }] = await Promise.all([
        supabase.from("tracked_jobs").select("*").eq("id", jobId).eq("user_id", userId).single(),
        supabase.from("profiles").select("resume_text").eq("id", userId).single(),
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
          jobFitResult: {
            overall_fit: job.jobFitResult.overall_fit,
            recommendation: job.jobFitResult.recommendation,
            summary: job.jobFitResult.summary,
            what_you_have: job.jobFitResult.what_you_have,
            whats_missing: job.jobFitResult.whats_missing,
            recruiter_concern: job.jobFitResult.recruiter_concern,
          },
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
  const nextAction = NEXT_ACTION[jobFitResult.recommendation] ?? "";

  const dimensions = [
    { label: "Function",  key: "functional_fit",  score: jobFitResult.dimensions.functional_fit.score,  reasoning: jobFitResult.dimensions.functional_fit.reasoning },
    { label: "Seniority", key: "seniority_fit",   score: jobFitResult.dimensions.seniority_fit.score,   reasoning: jobFitResult.dimensions.seniority_fit.reasoning },
    { label: "Industry",  key: "industry_fit",    score: jobFitResult.dimensions.industry_fit.score,    reasoning: jobFitResult.dimensions.industry_fit.reasoning },
    { label: "Keywords",  key: "keyword_overlap", score: jobFitResult.dimensions.keyword_overlap.score, reasoning: jobFitResult.dimensions.keyword_overlap.reasoning },
  ];

  const hasRecruiterConcern =
    !!jobFitResult.recruiter_concern &&
    jobFitResult.recruiter_concern !== "None identified";

  const briefReady = !!tailoringResult;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: APP_BG }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between"
        style={{
          padding: "0 40px",
          height: 56,
          background: "rgba(245,243,240,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(28,35,51,0.07)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-sans text-[13px] text-[rgba(28,35,51,0.50)] hover:text-[#1C2333] transition-colors"
          style={{ fontWeight: 500, textDecoration: "none", flexShrink: 0 }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M13 5H1M1 5L5 1M1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Jobs
        </Link>

        <p
          className="font-sans font-medium text-[#1C2333] truncate text-center"
          style={{ fontSize: 14, letterSpacing: "-0.01em", maxWidth: "52vw" }}
        >
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

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main
        className="flex-1 mx-auto w-full"
        style={{ maxWidth: 960, padding: "56px 40px 120px" }}
      >

        {/* ══ A. DECISION SUMMARY ══════════════════════════════════════════ */}

        {/* Score + recommendation */}
        <div className="flex items-center gap-4 flex-wrap" style={{ marginBottom: 24 }}>
          <div className="flex items-baseline gap-2">
            <span
              className="font-sans font-medium tabular-nums text-[#1C2333]"
              style={{ fontSize: 80, lineHeight: 0.85, letterSpacing: "-0.05em" }}
            >
              {jobFitResult.overall_fit}
            </span>
            <span
              className="font-sans font-medium tabular-nums"
              style={{ fontSize: 24, letterSpacing: "-0.03em", color: "rgba(28,35,51,0.30)" }}
            >
              /10
            </span>
          </div>
          <span
            className="font-sans text-[13px] font-medium px-3 py-1.5 rounded-full"
            style={{ color: recStyle.color, background: recStyle.bg }}
          >
            {jobFitResult.recommendation}
          </span>
        </div>

        {/* Your match, explained */}
        {jobFitResult.summary && (
          <p
            className="font-sans text-[#1C2333]"
            style={{ fontSize: 18, lineHeight: 1.55, letterSpacing: "-0.01em", maxWidth: 640, marginBottom: 20 }}
          >
            {jobFitResult.summary}
          </p>
        )}

        {/* Primary next action */}
        {nextAction && (
          <div
            className="flex items-start gap-3"
            style={{ marginBottom: 12 }}
          >
            <span
              className="font-sans text-[13px] font-medium text-[rgba(28,35,51,0.40)] uppercase"
              style={{ letterSpacing: "0.06em", lineHeight: 1.6, flexShrink: 0, paddingTop: 1 }}
            >
              Next
            </span>
            <p className="font-sans text-[14px] font-medium text-[#1C2333]" style={{ lineHeight: 1.55 }}>
              {nextAction}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <p
          className="font-sans text-[12px] text-[rgba(28,35,51,0.35)]"
          style={{ marginBottom: 40 }}
        >
          Based on your profile and this job description. Not a prediction of interview outcomes.
        </p>

        {/* ══ B. SCORE BREAKDOWN ═══════════════════════════════════════════ */}

        {/* Dimensions */}
        <div className="grid grid-cols-4 gap-3" style={{ marginBottom: 32 }}>
          {dimensions.map(({ label, score }) => (
            <div key={label} className="glass-card" style={{ borderRadius: 10, padding: "14px 16px" }}>
              <p
                className="font-sans font-medium text-[rgba(28,35,51,0.45)]"
                style={{ fontSize: 11, letterSpacing: "0.01em", marginBottom: 8 }}
              >
                {label}
              </p>
              <p
                className="font-sans font-medium tabular-nums text-[#1C2333]"
                style={{ fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1 }}
              >
                {score}
                <span style={{ fontSize: 12, color: "rgba(28,35,51,0.35)", marginLeft: 2 }}>/10</span>
              </p>
            </div>
          ))}
        </div>

        {/* What you have / what's missing */}
        {(jobFitResult.what_you_have?.length > 0 || jobFitResult.whats_missing?.length > 0) && (
          <div className="grid grid-cols-2 gap-x-12 gap-y-6" style={{ marginBottom: 32 }}>
            {jobFitResult.what_you_have?.length > 0 && (
              <div>
                <SectionLabel>What you have</SectionLabel>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
                  {jobFitResult.what_you_have.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 font-sans text-[14px] text-[#1C2333] leading-snug">
                      <span style={{ color: "#7A8B73", marginTop: 3, flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {jobFitResult.whats_missing?.length > 0 && (
              <div>
                <SectionLabel>What&apos;s missing</SectionLabel>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
                  {jobFitResult.whats_missing.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 font-sans text-[14px] text-[rgba(28,35,51,0.65)] leading-snug">
                      <span style={{ color: "rgba(28,35,51,0.30)", marginTop: 3, flexShrink: 0 }}>–</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Hiring team concern */}
        {hasRecruiterConcern && (
          <div style={{ borderLeft: "2px solid #C9A87A", paddingLeft: 16, marginBottom: 40 }}>
            <p
              style={{
                fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11,
                letterSpacing: "0.07em", color: "#9B8E73", marginBottom: 8, textTransform: "uppercase",
              }}
            >
              A hiring team may raise
            </p>
            <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed">
              {jobFitResult.recruiter_concern}
            </p>
          </div>
        )}

        {/* divider */}
        <div style={{ borderTop: "1px solid rgba(28,35,51,0.09)", marginBottom: 48 }} />

        {/* ══ C. APPLICATION BRIEF ═════════════════════════════════════════ */}

        {!briefReady ? (
          <div className="flex items-center gap-3">
            <Spinner />
            <p className="font-sans text-[14px] text-[rgba(28,35,51,0.50)]">Building your brief…</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>

            {/* Bottom Line */}
            {tailoringResult.honest_take && (
              <div>
                <SectionLabel>Bottom line</SectionLabel>
                <p
                  className="font-sans font-medium text-[#1C2333]"
                  style={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.02em", maxWidth: 680 }}
                >
                  {tailoringResult.honest_take}
                </p>
              </div>
            )}

            {/* Lead with */}
            {tailoringResult.lead_strengths.length > 0 && (
              <div>
                <SectionLabel>Lead with</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {tailoringResult.lead_strengths.map((s, i) => (
                    <div key={i} className="glass-card" style={{ borderRadius: 10, padding: "16px 20px" }}>
                      <p className="font-sans text-[14px] font-medium text-[#1C2333]" style={{ marginBottom: 6 }}>
                        {s.strength}
                      </p>
                      <p className="font-sans text-[13px] text-[rgba(28,35,51,0.60)] leading-snug">
                        {s.framing_language}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relevant terminology */}
            {tailoringResult.jd_language_to_mirror.length > 0 && (
              <div>
                <SectionLabel>Relevant terminology</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {tailoringResult.jd_language_to_mirror.map((p, i) => (
                    <span
                      key={i}
                      className="font-sans text-[13px] px-3 py-1.5 text-[#1C2333]"
                      style={{ background: "rgba(28,35,51,0.05)", borderRadius: "9999px" }}
                    >
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
            <div>
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
              {isGeneratingCL && (
                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)]">Writing your cover letter…</p>
              )}
              {clError && !isGeneratingCL && (
                <p className="font-sans text-[13px] text-[#8A7373]">{clError}</p>
              )}
              {coverLetterResult && !isGeneratingCL && (
                <div className="glass-card" style={{ borderRadius: 10, padding: "20px 24px" }}>
                  <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">
                    {coverLetterResult.cover_letter}
                  </p>
                </div>
              )}
              {!coverLetterResult && !isGeneratingCL && !clError && (
                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.35)]">
                  Generate a cover letter tailored to this role.
                </p>
              )}
            </div>

            {/* Outreach */}
            {tailoringResult.outreach_angle && (
              <div>
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
                {isGeneratingOutreach && (
                  <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)]">Drafting outreach messages…</p>
                )}
                {outreachError && !isGeneratingOutreach && (
                  <p className="font-sans text-[13px] text-[#8A7373]">{outreachError}</p>
                )}
                {outreachResult && !isGeneratingOutreach && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="glass-card" style={{ borderRadius: 10, padding: "20px 24px" }}>
                      <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.06em", color: "rgba(28,35,51,0.40)", marginBottom: 10 }}>
                        EMAIL
                      </p>
                      <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">
                        {outreachResult.email}
                      </p>
                    </div>
                    <div className="glass-card" style={{ borderRadius: 10, padding: "20px 24px" }}>
                      <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.06em", color: "rgba(28,35,51,0.40)", marginBottom: 10 }}>
                        LINKEDIN
                      </p>
                      <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">
                        {outreachResult.linkedin_message}
                      </p>
                    </div>
                  </div>
                )}
                {!outreachResult && !isGeneratingOutreach && !outreachError && (
                  <p className="font-sans text-[13px] text-[rgba(28,35,51,0.35)]">
                    Generate email and LinkedIn outreach for this role.
                  </p>
                )}
              </div>
            )}

            {/* Update brief */}
            <div style={{ borderTop: "1px solid rgba(28,35,51,0.08)", paddingTop: 32 }}>
              <SectionLabel>Update brief</SectionLabel>
              <p className="font-sans text-[13px] text-[rgba(28,35,51,0.50)]" style={{ marginBottom: 10 }}>
                Add context Claro may have missed — a specific project, correction, or framing preference.
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
                <p className="font-sans text-[12px] text-[#8A7373]" style={{ marginTop: 4 }}>
                  {regenerateError}
                </p>
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
  );
}
