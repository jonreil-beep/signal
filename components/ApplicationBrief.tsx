"use client";

import { useState } from "react";
import type { TrackedJob } from "@/types";
import { formatBrief } from "@/lib/formatBrief";

interface ApplicationBriefProps {
  job: TrackedJob;
  onGoToPrep: (job: TrackedJob) => void;
  onClose: () => void;
}

const RECOMMENDATION_STYLES: Record<string, { color: string; border: string }> = {
  "Apply Now":                   { color: "#2D6A4F", border: "1px solid #2D6A4F" },
  "Apply with Tailoring":        { color: "#A86B2D", border: "1px solid #A86B2D" },
  "Stretch — Proceed Carefully": { color: "#C4622D", border: "1px solid #C4622D" },
  "Skip":                        { color: "#6B6660", border: "1px solid #6B6660" },
};

const STATUS_LABEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Tracking":     { bg: "bg-[#FDF7EA]",                      text: "text-[#4A3C34]",  border: "border border-[rgba(26,26,26,0.15)]" },
  "Applied":      { bg: "bg-[rgba(26,26,26,0.04)]",          text: "text-[#231812]",  border: "border-0" },
  "Phone Screen": { bg: "bg-[rgba(138,133,127,0.10)]",       text: "text-[#4A3C34]",  border: "border-0" },
  "Interview":    { bg: "bg-[rgba(45,106,79,0.08)]",         text: "text-[#2D6A4F]",  border: "border-0" },
  "Offer":        { bg: "bg-[rgba(45,106,79,0.12)]",         text: "text-[#2D6A4F]",  border: "border-0" },
  "Rejected":     { bg: "bg-[rgba(107,102,96,0.08)]",        text: "text-[#6B6660]",  border: "border-0" },
};

/* ── Close button ── */
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close brief"
      className="shrink-0 p-1.5 text-[#8A857F] hover:text-[#4A3C34] hover:bg-[rgba(26,26,26,0.04)] transition-colors"
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
    <p className="font-jetbrains-mono text-[10px] uppercase tracking-[0.10em] text-[#8A857F] mb-3">
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
    { color: "#8A857F", border: "1px solid #8A857F" };
  const statusStyle = STATUS_LABEL_STYLES[applicationStatus] ??
    { bg: "bg-[rgba(26,26,26,0.04)]", text: "text-[#4A3C34]", border: "border-0" };

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
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-5 border-b border-[rgba(26,26,26,0.08)]">
          <div className="min-w-0">
            <p className="font-jetbrains-mono text-[10px] uppercase tracking-[0.10em] text-[#8A857F] mb-1">
              Application Brief
            </p>
            <h2 className="font-sans text-[17px] font-[600] text-[#231812] leading-snug truncate">
              {jobFitResult.job_title || job.label}
            </h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* Fallback body */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
          <div className="w-12 h-12 bg-[rgba(26,26,26,0.04)] border border-[rgba(26,26,26,0.08)] flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#8A857F]" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-sans text-[15px] font-[500] text-[#231812] mb-2">No brief yet</p>
          <p className="font-sans text-[14px] text-[#4A3C34] leading-relaxed mb-6 max-w-[280px]">
            Generate a tailoring brief first to unlock the full action plan.
          </p>
          <button
            onClick={() => onGoToPrep(job)}
            className="px-5 py-2.5 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
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
      <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-5 border-b border-[rgba(26,26,26,0.08)]">
        <div className="min-w-0">
          <p className="font-jetbrains-mono text-[10px] uppercase tracking-[0.10em] text-[#8A857F] mb-1">
            Application Brief
          </p>
          <h2 className="font-sans text-[17px] font-[600] text-[#231812] leading-snug">
            {jobFitResult.job_title || job.label}
          </h2>
          {/* Status badge */}
          <span className={`inline-block mt-2 font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[2px] ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
            {applicationStatus}
          </span>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {/* ── Scrollable content ── */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6 space-y-7"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(26,26,26,0.12) transparent" }}
      >

        {/* ── 1. Score + recommendation ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-instrument-serif text-[48px] leading-none text-[#231812]">
            {jobFitResult.overall_fit}
            <span className="font-sans text-[16px] font-normal text-[#8A857F] ml-1">/10</span>
          </span>
          <span
            className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[2px]"
            style={{ color: recStyle.color, border: recStyle.border }}
          >
            {jobFitResult.recommendation}
          </span>
        </div>

        {/* ── 2. Recruiter concern ── */}
        <div style={{ borderLeft: "2px solid #A86B2D", paddingLeft: "16px" }}>
          <p className="font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#A86B2D] mb-2">
            Recruiter Concern to Address
          </p>
          <p className="font-sans text-[14px] text-[#4A3C34] leading-relaxed">
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
                className="border border-[rgba(26,26,26,0.08)] bg-[#F6F0E4] p-4"
              >
                <p className="font-sans text-[14px] font-[500] text-[#231812] mb-1">{s.strength}</p>
                <p className="font-sans text-[13px] text-[#4A3C34] leading-snug">{s.framing_language}</p>
                <span className="inline-block mt-2 font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[2px] bg-[rgba(26,26,26,0.04)] text-[#8A857F]">
                  {s.match_type}
                </span>
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
                  className="font-sans text-[13px] px-3 py-1.5 border border-[rgba(26,26,26,0.12)] bg-[#F6F0E4] text-[#4A3C34]"
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
                <span className="shrink-0 font-jetbrains-mono text-[10px] text-[#8A857F] pt-0.5 tabular-nums w-5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="font-sans text-[14px] text-[#4A3C34] leading-snug">{item}</p>
              </li>
            ))}
          </ol>
        </div>

      </div>

      {/* ── Footer actions ── */}
      <div className="px-6 py-4 border-t border-[rgba(26,26,26,0.08)] flex items-center gap-3 flex-wrap">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] rounded-[2px] hover:bg-[#3D2A22] transition-colors min-w-[100px] justify-center"
        >
          {copied ? "Copied ✓" : "Copy brief"}
        </button>
        <button
          onClick={handleEmailSend}
          disabled={emailState === "sending"}
          className={`flex items-center gap-1.5 px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] rounded-[2px] transition-colors ${
            emailState === "sending"
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-[#3D2A22]"
          }`}
        >
          {emailState === "sending" && "Sending…"}
          {emailState === "sent"    && `Sent to ${sentToEmail} ✓`}
          {emailState === "error"   && "Couldn't send — try copying"}
          {emailState === "idle"    && "Email me this →"}
        </button>
      </div>
    </div>
  );
}
