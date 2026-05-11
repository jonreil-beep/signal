"use client";

import { useState, useEffect } from "react";
import type { TrackedJob } from "@/types";
import { formatBrief } from "@/lib/formatBrief";

interface YourBriefModalProps {
  job: TrackedJob;
  onClose: () => void;
}

type EmailState = "idle" | "sending" | "sent" | "error";

const RECOMMENDATION_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  "Apply Now":                   { color: "#7A8B73", border: "1px solid rgba(122,139,115,0.3)",  bg: "rgba(122,139,115,0.08)"  },
  "Apply with Tailoring":        { color: "#9B8E73", border: "1px solid rgba(155,142,115,0.3)",  bg: "rgba(155,142,115,0.10)"  },
  "Stretch — Proceed Carefully": { color: "#8A7373", border: "1px solid rgba(138,115,115,0.3)",  bg: "rgba(138,115,115,0.10)"  },
  "Skip":                        { color: "rgba(28,35,51,0.45)", border: "1px solid rgba(28,35,51,0.12)", bg: "rgba(28,35,51,0.04)" },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)", marginBottom: 12 }}>
      {children}
    </p>
  );
}

export default function YourBriefModal({ job, onClose }: YourBriefModalProps) {
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [sentToEmail, setSentToEmail] = useState("");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const { jobFitResult, tailoringResult } = job;
  const recStyle = RECOMMENDATION_STYLES[jobFitResult.recommendation] ??
    { color: "rgba(28,35,51,0.45)", border: "1px solid rgba(28,35,51,0.12)", bg: "rgba(28,35,51,0.04)" };

  // Action plan assembled from tailoring data (same logic as ApplicationBrief)
  const actionPlan: string[] = [];
  if (tailoringResult) {
    const { lead_strengths, recruiter_concern_to_preempt, what_to_deemphasize, outreach_angle } = tailoringResult;
    lead_strengths.forEach((s) => actionPlan.push(`Lead with ${s.strength} — ${s.framing_language}`));
    actionPlan.push(`Address this directly: ${recruiter_concern_to_preempt.suggested_response}`);
    what_to_deemphasize.forEach((d) => actionPlan.push(`De-emphasize ${d.item} — ${d.reason}`));
    if (outreach_angle) actionPlan.push(`Outreach angle: ${outreach_angle}`);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatBrief(job.label, jobFitResult, tailoringResult));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — silently no-op */ }
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

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(28,35,51,0.18)", animation: "scrimIn 240ms var(--easing) forwards" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container — centres the panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Your brief"
          className="flex flex-col bg-white overflow-hidden"
          style={{
            width: "min(680px, 92vw)",
            maxHeight: "80vh",
            borderRadius: 14,
            boxShadow: "var(--shadow-pop)",
            pointerEvents: "auto",
            animation: "modalIn 200ms var(--easing) forwards",
          }}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between gap-3 shrink-0"
            style={{ padding: "28px 32px 20px", borderBottom: "1px solid var(--line)" }}
          >
            <div className="min-w-0">
              <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)", marginBottom: 6 }}>
                Your Brief
              </p>
              <h2 style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 20, color: "var(--fg)", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                {jobFitResult.job_title || job.label}
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
              gap: 28,
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(28,35,51,0.12) transparent",
            }}
          >
            {/* 1. Fit score + recommendation */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span
                  className="font-sans font-medium tabular-nums text-[#1C2333]"
                  style={{ fontSize: 64, lineHeight: 0.9, letterSpacing: "-0.05em" }}
                >
                  {jobFitResult.overall_fit}
                </span>
                <span
                  className="font-sans font-medium tabular-nums"
                  style={{ fontSize: 20, letterSpacing: "-0.03em", color: "rgba(28,35,51,0.35)" }}
                >
                  /10
                </span>
              </div>
              <span
                className="font-sans text-[12px] font-medium px-3 py-1"
                style={{ color: recStyle.color, border: recStyle.border, background: recStyle.bg, borderRadius: "9999px" }}
              >
                {jobFitResult.recommendation}
              </span>
            </div>

            {/* 2. Recruiter concern */}
            {tailoringResult && (
              <div style={{ borderLeft: "2px solid var(--status-stretch)", paddingLeft: 16 }}>
                <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--status-stretch)", marginBottom: 8 }}>
                  Recruiter Concern to Address
                </p>
                <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed">
                  {tailoringResult.recruiter_concern_to_preempt.concern}
                </p>
              </div>
            )}

            {/* 3. Lead strengths */}
            {tailoringResult && tailoringResult.lead_strengths.length > 0 && (
              <div>
                <SectionLabel>Lead with these strengths</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tailoringResult.lead_strengths.map((s, i) => (
                    <div
                      key={i}
                      className="bg-white"
                      style={{ borderRadius: 10, padding: "16px 20px", border: "1px solid rgba(28,35,51,0.08)", boxShadow: "0 1px 2px rgba(15,25,35,0.04)" }}
                    >
                      <p className="font-sans text-[14px] font-medium text-[#1C2333] mb-1">{s.strength}</p>
                      <p className="font-sans text-[13px] text-[rgba(28,35,51,0.65)] leading-snug">{s.framing_language}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Mirror this language */}
            {tailoringResult && tailoringResult.jd_language_to_mirror.length > 0 && (
              <div>
                <SectionLabel>Mirror this language</SectionLabel>
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
              </div>
            )}

            {/* 5. Action plan */}
            {actionPlan.length > 0 && (
              <div>
                <SectionLabel>Your action plan</SectionLabel>
                <ol style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {actionPlan.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="shrink-0 font-sans font-medium text-white flex items-center justify-center tabular-nums"
                        style={{ width: 20, height: 20, background: "#1C2333", borderRadius: "9999px", fontSize: "10px", lineHeight: 1 }}
                      >
                        {i + 1}
                      </span>
                      <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)] leading-snug">{item}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div
            className="shrink-0 flex items-center gap-3"
            style={{ padding: "16px 32px 20px", borderTop: "1px solid var(--line)" }}
          >
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center font-sans font-medium text-[13px] text-[#1C2333] border border-[rgba(28,35,51,0.14)] rounded-[8px] hover:bg-[rgba(28,35,51,0.04)] transition-colors"
              style={{ height: 44, background: "white" }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button
              onClick={handleEmailSend}
              disabled={emailState === "sending"}
              className={`flex-1 flex items-center justify-center font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] transition-opacity ${
                emailState === "sending" ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
              }`}
              style={{ height: 44 }}
            >
              {emailState === "sending" && "Sending…"}
              {emailState === "sent"    && `Sent to ${sentToEmail} ✓`}
              {emailState === "error"   && "Couldn't send — try copying"}
              {emailState === "idle"    && "Email this →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
