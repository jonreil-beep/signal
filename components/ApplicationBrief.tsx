"use client";

import { useState } from "react";
import type { TrackedJob } from "@/types";
import { formatBrief } from "@/lib/formatBrief";

interface ApplicationBriefProps {
  job: TrackedJob;
  onGoToPrep: (job: TrackedJob) => void;
  onClose: () => void;
}

const RECOMMENDATION_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  "Apply Now":                   { color: "#7A8B73", border: "1px solid rgba(122,139,115,0.3)",  bg: "rgba(122,139,115,0.08)"  },
  "Apply with Tailoring":        { color: "#9B8E73", border: "1px solid rgba(155,142,115,0.3)",  bg: "rgba(155,142,115,0.10)"  },
  "Stretch — Proceed Carefully": { color: "#8A7373", border: "1px solid rgba(138,115,115,0.3)",  bg: "rgba(138,115,115,0.10)"  },
  "Skip":                        { color: "rgba(28,35,51,0.45)", border: "1px solid rgba(28,35,51,0.12)", bg: "rgba(28,35,51,0.04)" },
};

const STATUS_LABEL_STYLES: Record<string, { bg: string; text: string }> = {
  "Tracking":     { bg: "rgba(28,35,51,0.04)",   text: "rgba(28,35,51,0.55)" },
  "Applied":      { bg: "rgba(28,35,51,0.06)",   text: "#1C2333"             },
  "Phone Screen": { bg: "rgba(155,142,115,0.10)", text: "#9B8E73"             },
  "Interview":    { bg: "rgba(122,139,115,0.08)", text: "#7A8B73"             },
  "Offer":        { bg: "rgba(122,139,115,0.12)", text: "#7A8B73"             },
  "Rejected":     { bg: "rgba(28,35,51,0.04)",   text: "rgba(28,35,51,0.35)" },
};

/* ── Close button ── */
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close brief"
      className="shrink-0 p-1.5 text-[rgba(28,35,51,0.35)] hover:text-[#1C2333] hover:bg-[rgba(28,35,51,0.04)] transition-colors rounded-[6px]"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

/* ── Section label ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 12 }}>
      {children}
    </p>
  );
}

type EmailState = "idle" | "sending" | "sent" | "error";

export default function ApplicationBrief({ job, onGoToPrep, onClose }: ApplicationBriefProps) {
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [sentToEmail, setSentToEmail] = useState("");

  const { jobFitResult, tailoringResult, applicationStatus } = job;
  const recStyle = RECOMMENDATION_STYLES[jobFitResult.recommendation] ??
    { color: "rgba(28,35,51,0.45)", border: "1px solid rgba(28,35,51,0.12)", bg: "rgba(28,35,51,0.04)" };
  const statusStyle = STATUS_LABEL_STYLES[applicationStatus] ??
    { bg: "rgba(28,35,51,0.04)", text: "rgba(28,35,51,0.55)" };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        formatBrief(job.label, jobFitResult, tailoringResult)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently no-op
    }
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
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Send failed");
      }
      setSentToEmail(data.email ?? "your email");
      setEmailState("sent");
      setTimeout(() => { setEmailState("idle"); setSentToEmail(""); }, 4000);
    } catch {
      setEmailState("error");
      setTimeout(() => setEmailState("idle"), 4000);
    }
  }

  /* ── Fallback state ── */
  if (!tailoringResult) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[rgba(28,35,51,0.08)]" style={{ padding: "28px 36px 24px" }}>
          <div className="min-w-0">
            <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 8 }}>
              Application Brief
            </p>
            <h2 className="font-sans font-medium text-[#1C2333] leading-snug truncate" style={{ fontSize: 24, letterSpacing: "-0.018em" }}>
              {jobFitResult.job_title || job.label}
            </h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* Fallback body */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
          <div className="w-12 h-12 bg-[rgba(28,35,51,0.04)] border border-[rgba(28,35,51,0.08)] rounded-[10px] flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[rgba(28,35,51,0.35)]" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-sans text-[15px] font-medium text-[#1C2333] mb-2">No brief yet</p>
          <p className="font-sans text-[14px] text-[rgba(28,35,51,0.55)] leading-relaxed mb-6 max-w-[280px]">
            Generate a tailoring brief first to unlock the full action plan.
          </p>
          <button
            onClick={() => onGoToPrep(job)}
            className="px-5 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity"
            style={{ height: 40 }}
          >
            Go to Prep →
          </button>
        </div>
      </div>
    );
  }

  /* ── Full brief ── */
  const {
    lead_strengths,
    jd_language_to_mirror,
    what_to_deemphasize,
    recruiter_concern_to_preempt,
    outreach_angle,
  } = tailoringResult;

  const actionPlan: string[] = [];
  lead_strengths.forEach((s) =>
    actionPlan.push(`Lead with ${s.strength} — ${s.framing_language}`)
  );
  actionPlan.push(
    `Address this directly: ${recruiter_concern_to_preempt.suggested_response}`
  );
  what_to_deemphasize.forEach((d) =>
    actionPlan.push(`De-emphasize ${d.item} — ${d.reason}`)
  );
  if (outreach_angle) actionPlan.push(`Outreach angle: ${outreach_angle}`);

  return (
    <div className="h-full flex flex-col">

      {/* ── Panel header ── */}
      <div className="flex items-start justify-between gap-3 border-b border-[rgba(28,35,51,0.08)]" style={{ padding: "28px 36px 24px" }}>
        <div className="min-w-0">
          <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 8 }}>
            Application Brief
          </p>
          <h2 className="font-sans font-medium text-[#1C2333] leading-snug" style={{ fontSize: 24, letterSpacing: "-0.018em", marginBottom: 8 }}>
            {jobFitResult.job_title || job.label}
          </h2>
          {/* Tag + status pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block font-sans text-[11px] px-2.5 py-0.5"
              style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "9999px" }}
            >
              {applicationStatus}
            </span>
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {/* ── Scrollable content ── */}
      <div
        className="flex-1 overflow-y-auto space-y-7"
        style={{ padding: "24px 36px", scrollbarWidth: "thin", scrollbarColor: "rgba(28,35,51,0.12) transparent" }}
      >

        {/* ── 1. Score + recommendation ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span
              className="font-sans font-medium tabular-nums text-[#1C2333]"
              style={{ fontSize: 76, lineHeight: 0.9, letterSpacing: "-0.05em" }}
            >
              {jobFitResult.overall_fit}
            </span>
            <span
              className="font-sans font-medium tabular-nums"
              style={{ fontSize: 24, letterSpacing: "-0.03em", color: "rgba(28,35,51,0.35)" }}
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

        {/* ── 2. Recruiter concern ── */}
        <div style={{ borderLeft: "2px solid #8A7373", paddingLeft: 16 }}>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8A7373", marginBottom: 8 }}>
            Recruiter Concern to Address
          </p>
          <p className="font-sans text-[14px] text-[#1C2333] leading-relaxed">
            {recruiter_concern_to_preempt.concern}
          </p>
        </div>

        {/* ── 3. Lead with these strengths ── */}
        <div>
          <SectionLabel>Lead with these strengths</SectionLabel>
          <div className="space-y-2.5">
            {lead_strengths.map((s, i) => (
              <div
                key={i}
                className="bg-white"
                style={{ borderRadius: 14, padding: "24px 28px", boxShadow: "0 1px 3px rgba(15,25,35,0.06), 0 8px 28px rgba(15,25,35,0.07)", border: "1px solid rgba(28,35,51,0.06)" }}
              >
                <p className="font-sans text-[14px] font-medium text-[#1C2333] mb-1.5">{s.strength}</p>
                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.65)] leading-snug mb-3">{s.framing_language}</p>
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="inline-block font-sans text-[11px] px-2.5 py-0.5"
                    style={{ background: "rgba(28,35,51,0.05)", color: "rgba(28,35,51,0.45)", borderRadius: "9999px" }}
                  >
                    {s.match_type}
                  </span>
                  <button
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(`${s.strength} — ${s.framing_language}`); } catch { /* no-op */ }
                    }}
                    style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    className="hover:text-[#1C2333] transition-colors"
                  >
                    Copy framing →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. Mirror this language ── */}
        {jd_language_to_mirror.length > 0 && (
          <div>
            <SectionLabel>Mirror this language</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {jd_language_to_mirror.map((p, i) => (
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

        {/* ── 5. Action plan ── */}
        <div>
          <SectionLabel>Your action plan</SectionLabel>
          <ol className="space-y-3">
            {actionPlan.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="shrink-0 font-sans font-medium text-[11px] text-white tabular-nums w-5 h-5 flex items-center justify-center"
                  style={{ background: "#1C2333", borderRadius: "9999px", fontSize: "10px" }}
                >
                  {i + 1}
                </span>
                <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)] leading-snug">{item}</p>
              </li>
            ))}
          </ol>
        </div>

      </div>

      {/* ── Footer actions ── */}
      <div className="border-t border-[rgba(28,35,51,0.08)] flex items-center gap-3" style={{ padding: "18px 36px 22px" }}>
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center font-sans font-medium text-[13px] text-[#1C2333] border border-[rgba(28,35,51,0.14)] rounded-[8px] hover:bg-[rgba(28,35,51,0.04)] transition-colors"
          style={{ height: 44, background: "white" }}
        >
          {copied ? "Copied ✓" : "Copy brief"}
        </button>
        <button
          onClick={handleEmailSend}
          disabled={emailState === "sending"}
          className={`flex-1 flex items-center justify-center font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] transition-opacity ${
            emailState === "sending"
              ? "opacity-60 cursor-not-allowed"
              : "hover:opacity-90"
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
  );
}
