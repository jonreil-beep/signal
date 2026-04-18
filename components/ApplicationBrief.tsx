"use client";

import { useState } from "react";
import type { TrackedJob } from "@/types";
import { formatBrief } from "@/lib/formatBrief";

interface ApplicationBriefProps {
  job: TrackedJob;
  onGoToPrep: (job: TrackedJob) => void;
  onClose: () => void;
}

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string }> = {
  "Apply Now":                   { bg: "bg-[rgba(75,155,126,0.10)]",  text: "text-[#4B9B7E]" },
  "Apply with Tailoring":        { bg: "bg-[rgba(124,139,154,0.10)]", text: "text-[#7C8B9A]" },
  "Stretch — Proceed Carefully": { bg: "bg-[rgba(176,144,110,0.10)]", text: "text-[#B0906E]" },
  "Skip":                        { bg: "bg-[rgba(163,163,163,0.10)]", text: "text-[#A3A3A3]" },
};

const STATUS_LABEL_STYLES: Record<string, { bg: string; text: string }> = {
  "Tracking":     { bg: "bg-white border border-[#E5E7EB]",          text: "text-[#374151]" },
  "Applied":      { bg: "bg-[rgba(55,65,81,0.08)]",                   text: "text-[#374151]" },
  "Phone Screen": { bg: "bg-[rgba(124,139,154,0.08)]",                text: "text-[#7C8B9A]" },
  "Interview":    { bg: "bg-[rgba(75,155,126,0.08)]",                 text: "text-[#4B9B7E]" },
  "Offer":        { bg: "bg-[rgba(75,155,126,0.12)]",                 text: "text-[#4B9B7E]" },
  "Rejected":     { bg: "bg-[rgba(163,163,163,0.08)]",                text: "text-[#9CA3AF]" },
};

function scoreColor(score: number) {
  if (score >= 7) return "text-[#4B9B7E]";
  if (score >= 5) return "text-[#B0906E]";
  return "text-[#C45C5C]";
}

/* ── Close button ── */
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close brief"
      className="shrink-0 p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
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
    <p className="text-[11px] font-[500] tracking-[0.05em] uppercase text-[#9CA3AF] mb-3">
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
    { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]" };
  const statusStyle = STATUS_LABEL_STYLES[applicationStatus] ??
    { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]" };

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
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-5 border-b border-[#F3F4F6]">
          <div className="min-w-0">
            <p className="text-[11px] font-[500] uppercase tracking-[0.05em] text-[#9CA3AF] mb-1">
              Application Brief
            </p>
            <h2 className="text-[17px] font-[600] text-[#111827] leading-snug truncate">
              {jobFitResult.job_title || job.label}
            </h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* Fallback body */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9CA3AF]" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-[15px] font-[500] text-[#111827] mb-2">No brief yet</p>
          <p className="text-[14px] text-[#6B7280] leading-relaxed mb-6 max-w-[280px]">
            Generate a tailoring brief first to unlock the full action plan.
          </p>
          <button
            onClick={() => onGoToPrep(job)}
            className="px-5 py-2.5 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[14px] font-[500] rounded-full hover:from-[#3A3A3C] hover:to-[#242424] transition-colors"
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
      <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-5 border-b border-[#F3F4F6]">
        <div className="min-w-0">
          <p className="text-[11px] font-[500] uppercase tracking-[0.05em] text-[#9CA3AF] mb-1">
            Application Brief
          </p>
          <h2 className="text-[17px] font-[600] text-[#111827] leading-snug">
            {jobFitResult.job_title || job.label}
          </h2>
          {/* Status badge */}
          <span className={`inline-block mt-2 text-[11px] font-[500] px-2.5 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
            {applicationStatus}
          </span>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {/* ── Scrollable content ── */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6 space-y-7"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#D1D5DB transparent" }}
      >

        {/* ── 1. Score + recommendation ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[28px] font-[600] tabular-nums leading-none ${scoreColor(jobFitResult.overall_fit)}`}>
            {jobFitResult.overall_fit}
            <span className="text-[14px] font-normal text-[#9CA3AF]">/10</span>
          </span>
          <span className={`text-[12px] font-[500] px-2.5 py-0.5 rounded-full ${recStyle.bg} ${recStyle.text}`}>
            {jobFitResult.recommendation}
          </span>
        </div>

        {/* ── 2. Recruiter concern ── */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(124,139,154,0.04)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <p className="text-[11px] font-[500] tracking-[0.05em] uppercase text-[#7C8B9A] mb-2">
            ▸ Recruiter Concern to Address
          </p>
          <p className="text-[14px] text-[#374151] leading-relaxed">
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
                className="rounded-xl p-4 bg-white"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}
              >
                <p className="text-[14px] font-[500] text-[#111827] mb-1">{s.strength}</p>
                <p className="text-[13px] text-[#6B7280] leading-snug">{s.framing_language}</p>
                <span className="inline-block mt-2 text-[11px] font-[400] px-2 py-0.5 rounded-full bg-[rgba(55,65,81,0.06)] text-[#9CA3AF]">
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
                  className="text-[13px] font-[400] px-3 py-1.5 rounded-full bg-[#F3F4F6] text-[#374151]"
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
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#374151] text-white text-[11px] font-[500] flex items-center justify-center mt-0.5 tabular-nums">
                  {i + 1}
                </span>
                <p className="text-[14px] text-[#374151] leading-snug">{item}</p>
              </li>
            ))}
          </ol>
        </div>

      </div>

      {/* ── Footer actions ── */}
      <div className="px-6 py-4 border-t border-[#F3F4F6] flex items-center gap-3 flex-wrap">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[13px] font-[500] rounded-full hover:from-[#3A3A3C] hover:to-[#242424] transition-colors min-w-[100px] justify-center"
        >
          {copied ? "Copied ✓" : "Copy brief"}
        </button>
        <button
          onClick={handleEmailSend}
          disabled={emailState === "sending"}
          className={`flex items-center gap-1.5 px-4 py-2 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[13px] font-[500] rounded-full transition-colors ${
            emailState === "sending"
              ? "opacity-60 cursor-not-allowed"
              : "hover:from-[#3A3A3C] hover:to-[#242424]"
          }`}
        >
          {emailState === "sending" && "Sending…"}
          {emailState === "sent"    && `Sent to ${sentToEmail} ✓`}
          {emailState === "error"   && "Couldn't send — try copying instead"}
          {emailState === "idle"    && "Email me this →"}
        </button>
      </div>
    </div>
  );
}
