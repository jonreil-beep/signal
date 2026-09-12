"use client";

import { useState, useEffect } from "react";
import type { TrackedJob, CoverLetterResult, OutreachResult } from "@/types";
import { formatBrief } from "@/lib/formatBrief";

interface YourBriefModalProps {
  job: TrackedJob;
  profileText: string;
  writingSample?: string;
  pivotTarget?: string;
  onClose: () => void;
  onCoverLetterChange: (jobId: string, result: CoverLetterResult | null) => void;
  onOutreachChange: (jobId: string, result: OutreachResult | null) => void;
  onBriefRegenerate: (jobId: string, result: import("@/types").TailoringBriefResult) => void;
}

type EmailState = "idle" | "sending" | "sent" | "error";

const RECOMMENDATION_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  "Apply Now":                   { color: "#7A8B73", border: "none", bg: "rgba(122,139,115,0.08)"  },
  "Apply with Tailoring":        { color: "#9B8E73", border: "none", bg: "rgba(155,142,115,0.10)"  },
  "Stretch — Proceed Carefully": { color: "#8A7373", border: "none", bg: "rgba(138,115,115,0.10)"  },
  "Skip":                        { color: "rgba(28,35,51,0.45)", border: "none", bg: "rgba(28,35,51,0.04)" },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "var(--fg-3)", marginBottom: 12 }}>
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

export default function YourBriefModal({
  job, profileText, writingSample, pivotTarget,
  onClose, onCoverLetterChange, onOutreachChange, onBriefRegenerate,
}: YourBriefModalProps) {
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [sentToEmail, setSentToEmail] = useState("");

  // Cover letter
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [clError, setClError] = useState("");

  // Outreach
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachError, setOutreachError] = useState("");

  // Regenerate brief
  const [regenerateNote, setRegenerateNote] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const { jobFitResult, tailoringResult, coverLetterResult, outreachResult } = job;
  const recStyle = RECOMMENDATION_STYLES[jobFitResult.recommendation] ??
    { color: "rgba(28,35,51,0.45)", border: "1px solid rgba(28,35,51,0.12)", bg: "rgba(28,35,51,0.04)" };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatBrief(job.label, jobFitResult, tailoringResult));
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
        body: JSON.stringify({ jobId: job.id }),
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

  async function handleGenerateCoverLetter() {
    setIsGeneratingCL(true);
    setClError("");
    onCoverLetterChange(job.id, null);
    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobId: job.id,
          outreachAngle: tailoringResult?.outreach_angle,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setClError(data.error ?? "Failed to generate. Please try again.");
      } else {
        onCoverLetterChange(job.id, data as CoverLetterResult);
      }
    } catch {
      setClError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingCL(false);
    }
  }

  async function handleGenerateOutreach() {
    setIsGeneratingOutreach(true);
    setOutreachError("");
    onOutreachChange(job.id, null);
    try {
      const response = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outreachAngle: tailoringResult?.outreach_angle,
          resumeText: profileText,
          jobId: job.id,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setOutreachError(data.error ?? "Failed to generate. Please try again.");
      } else {
        onOutreachChange(job.id, data as OutreachResult);
      }
    } catch {
      setOutreachError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingOutreach(false);
    }
  }

  async function handleRegenerate() {
    if (!profileText || !job.jobDescription) return;
    setIsRegenerating(true);
    setRegenerateError("");
    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobId: job.id,
          userNote: regenerateNote || undefined,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRegenerateError(data.error ?? "Failed to regenerate. Please try again.");
      } else {
        onBriefRegenerate(job.id, data as import("@/types").TailoringBriefResult);
        setRegenerateNote("");
      }
    } catch {
      setRegenerateError("Network error. Check your connection and try again.");
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(28,35,51,0.18)", animation: "scrimIn 240ms var(--easing) forwards" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Your brief"
          className="flex flex-col overflow-hidden"
          style={{
            width: "min(680px, 92vw)",
            maxHeight: "85vh",
            borderRadius: 14,
            boxShadow: "var(--shadow-pop)",
            pointerEvents: "auto",
            animation: "modalIn 200ms var(--easing) forwards",
            background: [
              "radial-gradient(ellipse 90% 55% at 100% 0%, rgba(255, 150, 70, 0.16) 0%, transparent 60%)",
              "radial-gradient(ellipse 80% 60% at 0% 100%, rgba(100, 110, 220, 0.14) 0%, transparent 60%)",
              "radial-gradient(ellipse 70% 50% at 90% 75%, rgba(215, 90, 150, 0.11) 0%, transparent 55%)",
              "#F9F7F5",
            ].join(", "),
          }}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between gap-3 shrink-0"
            style={{ padding: "28px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
          >
            <div className="min-w-0">
              <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "var(--fg-3)", marginBottom: 6 }}>
                Your Brief
              </p>
              <h2 style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 20, color: "var(--fg)", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                {job.label}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 flex items-center justify-center rounded-[6px] hover:bg-[rgba(28,35,51,0.06)] transition-colors focus:outline-none"
              style={{ width: 32, height: 32, color: "var(--fg-3)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: "24px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 32,
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(28,35,51,0.12) transparent",
            }}
          >
            {/* ── Fit score + recommendation ── */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span className="font-sans font-medium tabular-nums text-[#1C2333]" style={{ fontSize: 64, lineHeight: 0.9, letterSpacing: "-0.05em" }}>
                  {jobFitResult.overall_fit}
                </span>
                <span className="font-sans font-medium tabular-nums" style={{ fontSize: 20, letterSpacing: "-0.03em", color: "rgba(28,35,51,0.35)" }}>
                  /10
                </span>
              </div>
              <span className="font-sans text-[12px] font-medium px-3 py-1" style={{ color: recStyle.color, border: recStyle.border, background: recStyle.bg, borderRadius: "9999px" }}>
                {jobFitResult.recommendation}
              </span>
            </div>

            {tailoringResult && (
              <>
                {/* ── Bottom Line ── */}
                {tailoringResult.honest_take && (
                  <div>
                    <SectionLabel>Bottom Line</SectionLabel>
                    <p className="font-sans font-medium text-[#1C2333]" style={{ fontSize: 24, lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                      {tailoringResult.honest_take}
                    </p>
                  </div>
                )}

                {/* ── Recruiter concern ── */}
                <div style={{ borderLeft: "2px solid var(--status-stretch)", paddingLeft: 16 }}>
                  <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "var(--status-stretch)", marginBottom: 8 }}>
                    Recruiter Concern to Address
                  </p>
                  <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed">
                    {tailoringResult.recruiter_concern_to_preempt.concern}
                  </p>
                </div>

                {/* ── Lead strengths ── */}
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

                {/* ── Mirror this language ── */}
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

                {/* ── Cover Letter ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel>Cover Letter</SectionLabel>
                    <button
                      onClick={handleGenerateCoverLetter}
                      disabled={isGeneratingCL}
                      className="flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40"
                      style={{ color: "rgba(28,35,51,0.55)", background: "none", border: "none", cursor: isGeneratingCL ? "default" : "pointer", padding: 0 }}
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
                      <p className="font-sans text-[13px] text-[#1C2333] leading-relaxed whitespace-pre-wrap">{coverLetterResult.cover_letter}</p>
                    </div>
                  )}
                  {!coverLetterResult && !isGeneratingCL && !clError && (
                    <p className="font-sans text-[13px] text-[rgba(28,35,51,0.35)]">Generate a cover letter tailored to this role.</p>
                  )}
                </div>

                {/* ── Outreach ── */}
                {tailoringResult.outreach_angle && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <SectionLabel>Outreach</SectionLabel>
                      <button
                        onClick={handleGenerateOutreach}
                        disabled={isGeneratingOutreach}
                        className="flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40"
                        style={{ color: "rgba(28,35,51,0.55)", background: "none", border: "none", cursor: isGeneratingOutreach ? "default" : "pointer", padding: 0 }}
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
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

                {/* ── Regenerate brief ── */}
                <div style={{ borderTop: "1px solid rgba(28,35,51,0.08)", paddingTop: 24 }}>
                  <SectionLabel>Regenerate brief</SectionLabel>
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
                    className="mt-2 flex items-center gap-1.5 font-sans text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40"
                    style={{ color: "rgba(28,35,51,0.55)", background: "none", border: "none", cursor: isRegenerating ? "default" : "pointer", padding: 0 }}
                  >
                    {isRegenerating ? <><Spinner /> Rebuilding…</> : "Rebuild brief"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sticky footer */}
          <div
            className="shrink-0 flex items-center gap-3"
            style={{ padding: "16px 32px 20px", borderTop: "1px solid rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
          >
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center font-sans font-medium text-[13px] text-[#1C2333] border border-[rgba(28,35,51,0.14)] rounded-[8px] hover:bg-[rgba(28,35,51,0.04)] transition-colors btn-shadow-glass"
              style={{ height: 44, background: "white" }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button
              onClick={handleEmailSend}
              disabled={emailState === "sending"}
              className={`flex-1 flex items-center justify-center font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] transition-opacity btn-shadow-dark ${
                emailState === "sending" ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
              }`}
              style={{ height: 44 }}
            >
              {emailState === "sending" && "Sending…"}
              {emailState === "sent"    && `Sent to ${sentToEmail} ✓`}
              {emailState === "error"   && "Couldn't send. Try copying."}
              {emailState === "idle"    && "Email this →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
