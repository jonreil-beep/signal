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

// ── helpers (same as page.tsx) ──────────────────────────────────────────────

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

// ── small shared bits ────────────────────────────────────────────────────────

const RECOMMENDATION_STYLES: Record<string, { color: string; bg: string }> = {
  "Apply Now":                   { color: "#7A8B73", bg: "rgba(122,139,115,0.08)" },
  "Apply with Tailoring":        { color: "#9B8E73", bg: "rgba(155,142,115,0.10)" },
  "Stretch — Proceed Carefully": { color: "#8A7373", bg: "rgba(138,115,115,0.10)" },
  "Skip":                        { color: "rgba(28,35,51,0.45)", bg: "rgba(28,35,51,0.04)" },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", marginBottom: 12 }}>
      {children}
    </p>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="31.4" strokeDashoffset="10" opacity="0.3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

type EmailState = "idle" | "sending" | "sent" | "error";

export default function BriefPage() {
  const params = useParams();
  const jobId = params.id as string;
  const router = useRouter();

  const [job, setJob] = useState<TrackedJob | null>(null);
  const [profileText, setProfileText] = useState("");
  const [writingSample, setWritingSample] = useState("");
  const [pivotTarget, setPivotTarget] = useState("");
  const [loading, setLoading] = useState(true);

  // CL
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [clError, setClError] = useState("");

  // Outreach
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachError, setOutreachError] = useState("");

  // Regenerate
  const [regenerateNote, setRegenerateNote] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");

  // Footer
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [sentToEmail, setSentToEmail] = useState("");

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

  // ── helpers ───────────────────────────────────────────────────────────────

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
      const response = await fetch("/api/generate-cover-letter", {
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
      const data = await response.json();
      if (!response.ok) {
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
      const response = await fetch("/api/generate-outreach", {
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
      const data = await response.json();
      if (!response.ok) {
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
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: job.jobDescription,
          userNote: regenerateNote || undefined,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
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
      await navigator.clipboard.writeText(formatBrief(job.label, job.jobFitResult, job.tailoringResult));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
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
      setSentToEmail(data.email ?? "your email");
      setEmailState("sent");
      setTimeout(() => { setEmailState("idle"); setSentToEmail(""); }, 4000);
    } catch {
      setEmailState("error");
      setTimeout(() => setEmailState("idle"), 4000);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  const bgGradient = [
    "radial-gradient(ellipse 70% 60% at 95% 5%, rgba(255,150,70,0.18) 0%, transparent 65%)",
    "radial-gradient(ellipse 70% 65% at 5% 95%, rgba(100,110,220,0.16) 0%, transparent 65%)",
    "radial-gradient(ellipse 55% 55% at 95% 60%, rgba(215,90,150,0.13) 0%, transparent 58%)",
    "#F5F3F0",
  ].join(", ");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bgGradient }}>
        <Spinner />
      </div>
    );
  }

  if (!job) return null;

  const { jobFitResult, tailoringResult, coverLetterResult, outreachResult } = job;
  const recStyle = RECOMMENDATION_STYLES[jobFitResult.recommendation] ??
    { color: "rgba(28,35,51,0.45)", bg: "rgba(28,35,51,0.04)" };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgGradient }}>

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between"
        style={{
          padding: "0 40px",
          height: 56,
          background: "rgba(245,243,240,0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(28,35,51,0.07)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-sans text-[13px] text-[rgba(28,35,51,0.55)] hover:text-[#1C2333] transition-colors"
          style={{ fontWeight: 500 }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M13 5H1M1 5L5 1M1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Jobs
        </Link>

        <p
          className="font-sans font-medium text-[#1C2333] truncate max-w-[50vw] text-center"
          style={{ fontSize: 14, letterSpacing: "-0.01em" }}
        >
          {job.label}
        </p>

        {/* Copy + Email */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="font-sans text-[13px] font-medium text-[rgba(28,35,51,0.55)] hover:text-[#1C2333] transition-colors focus:outline-none"
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
            {emailState === "sending" && "Sending…"}
            {emailState === "sent"    && `Sent ✓`}
            {emailState === "error"   && "Couldn't send"}
            {emailState === "idle"    && "Email →"}
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 mx-auto w-full" style={{ maxWidth: 720, padding: "56px 40px 120px" }}>

        {/* Score + recommendation */}
        <div className="flex items-center gap-4 flex-wrap mb-10">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-medium tabular-nums text-[#1C2333]" style={{ fontSize: 72, lineHeight: 0.9, letterSpacing: "-0.05em" }}>
              {jobFitResult.overall_fit}
            </span>
            <span className="font-sans font-medium tabular-nums" style={{ fontSize: 22, letterSpacing: "-0.03em", color: "rgba(28,35,51,0.35)" }}>
              /10
            </span>
          </div>
          <span className="font-sans text-[12px] font-medium px-3 py-1.5" style={{ color: recStyle.color, background: recStyle.bg, borderRadius: "9999px" }}>
            {jobFitResult.recommendation}
          </span>
        </div>

        {tailoringResult ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

            {/* Bottom Line */}
            {tailoringResult.honest_take && (
              <div>
                <SectionLabel>Bottom Line</SectionLabel>
                <p className="font-sans font-medium text-[#1C2333]" style={{ fontSize: 26, lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                  {tailoringResult.honest_take}
                </p>
              </div>
            )}

            {/* Recruiter concern */}
            <div style={{ borderLeft: "2px solid #C9A87A", paddingLeft: 16 }}>
              <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "#9B8E73", marginBottom: 8 }}>
                Recruiter Concern
              </p>
              <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed">
                {tailoringResult.recruiter_concern_to_preempt.concern}
              </p>
            </div>

            {/* Lead strengths */}
            {tailoringResult.lead_strengths.length > 0 && (
              <div>
                <SectionLabel>Lead with these strengths</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tailoringResult.lead_strengths.map((s, i) => (
                    <div key={i} className="glass-card" style={{ borderRadius: 10, padding: "16px 20px" }}>
                      <p className="font-sans text-[14px] font-medium text-[#1C2333] mb-1">{s.strength}</p>
                      <p className="font-sans text-[13px] text-[rgba(28,35,51,0.65)] leading-snug">{s.framing_language}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mirror this language */}
            {tailoringResult.jd_language_to_mirror.length > 0 && (
              <div>
                <SectionLabel>Mirror this language</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {tailoringResult.jd_language_to_mirror.map((p, i) => (
                    <span key={i} className="font-sans text-[13px] px-3 py-1.5 text-[#1C2333]" style={{ background: "rgba(28,35,51,0.05)", borderRadius: "9999px" }}>
                      &ldquo;{p.phrase}&rdquo;
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cover Letter */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Cover Letter</SectionLabel>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isGeneratingCL}
                  className="flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
                  style={{ color: "rgba(28,35,51,0.55)", background: "none", border: "none", cursor: isGeneratingCL ? "default" : "pointer", padding: 0 }}
                >
                  {isGeneratingCL ? <><Spinner /> Generating…</> : coverLetterResult ? "Regenerate" : "Generate"}
                </button>
              </div>
              {isGeneratingCL && <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)]">Writing your cover letter…</p>}
              {clError && !isGeneratingCL && <p className="font-sans text-[13px] text-[#8A7373]">{clError}</p>}
              {coverLetterResult && !isGeneratingCL && (
                <div className="glass-card" style={{ borderRadius: 10, padding: "20px 24px" }}>
                  <p className="font-sans text-[13px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">{coverLetterResult.cover_letter}</p>
                </div>
              )}
              {!coverLetterResult && !isGeneratingCL && !clError && (
                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.35)]">Generate a cover letter tailored to this role.</p>
              )}
            </div>

            {/* Outreach */}
            {tailoringResult.outreach_angle && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Outreach</SectionLabel>
                  <button
                    onClick={handleGenerateOutreach}
                    disabled={isGeneratingOutreach}
                    className="flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
                    style={{ color: "rgba(28,35,51,0.55)", background: "none", border: "none", cursor: isGeneratingOutreach ? "default" : "pointer", padding: 0 }}
                  >
                    {isGeneratingOutreach ? <><Spinner /> Generating…</> : outreachResult ? "Regenerate" : "Generate"}
                  </button>
                </div>
                {isGeneratingOutreach && <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)]">Drafting outreach messages…</p>}
                {outreachError && !isGeneratingOutreach && <p className="font-sans text-[13px] text-[#8A7373]">{outreachError}</p>}
                {outreachResult && !isGeneratingOutreach && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="glass-card" style={{ borderRadius: 10, padding: "20px 24px" }}>
                      <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 10 }}>EMAIL</p>
                      <p className="font-sans text-[13px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">{outreachResult.email}</p>
                    </div>
                    <div className="glass-card" style={{ borderRadius: 10, padding: "20px 24px" }}>
                      <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 10 }}>LINKEDIN</p>
                      <p className="font-sans text-[13px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">{outreachResult.linkedin_message}</p>
                    </div>
                  </div>
                )}
                {!outreachResult && !isGeneratingOutreach && !outreachError && (
                  <p className="font-sans text-[13px] text-[rgba(28,35,51,0.35)]">Generate email and LinkedIn outreach for this role.</p>
                )}
              </div>
            )}

            {/* Regenerate */}
            <div style={{ borderTop: "1px solid rgba(28,35,51,0.08)", paddingTop: 32 }}>
              <SectionLabel>Rebuild brief</SectionLabel>
              <textarea
                value={regenerateNote}
                onChange={(e) => setRegenerateNote(e.target.value)}
                placeholder="Anything to correct or add? (optional)"
                maxLength={300}
                rows={2}
                className="w-full font-sans text-[13px] text-[#1C2333] bg-[rgba(28,35,51,0.03)] rounded-[8px] px-3 py-2.5 resize-none border border-[rgba(28,35,51,0.08)] focus:border-[rgba(28,35,51,0.20)] focus:outline-none focus:ring-0 placeholder:text-[rgba(28,35,51,0.35)] leading-relaxed"
              />
              {regenerateError && <p className="font-sans text-[12px] text-[#8A7373] mt-1">{regenerateError}</p>}
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="mt-2 flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
                style={{ color: "rgba(28,35,51,0.55)", background: "none", border: "none", cursor: isRegenerating ? "default" : "pointer", padding: 0 }}
              >
                {isRegenerating ? <><Spinner /> Rebuilding…</> : "Rebuild →"}
              </button>
            </div>

          </div>
        ) : (
          <div style={{ paddingTop: 8 }}>
            <p className="font-sans text-[14px] text-[rgba(28,35,51,0.55)]">Brief is still generating — check back in a moment.</p>
          </div>
        )}
      </main>

    </div>
  );
}
