"use client";

import { useState } from "react";
import LoadingState from "./LoadingState";
import type { TailoringBriefResult, OutreachResult, CoverLetterResult, ResumeUpdateResult, InterviewPrepResult, FollowUpResult, CompanyResearchResult } from "@/types";

type PrepSection = "brief" | "company" | "resume" | "cover-letter" | "outreach" | "interview" | "follow-up";

const PREP_SECTIONS: { id: PrepSection; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "company", label: "Company" },
  { id: "resume", label: "Resume" },
  { id: "cover-letter", label: "Cover Letter" },
  { id: "outreach", label: "Outreach" },
  { id: "interview", label: "Interview" },
  { id: "follow-up", label: "Follow-up" },
];

interface TailoringBriefProps {
  profileText: string;
  jobDescription: string;
  jobLabel?: string;
  result: TailoringBriefResult | null;
  onResultChange: (result: TailoringBriefResult) => void;
  outreachResult: OutreachResult | null;
  onOutreachResultChange: (result: OutreachResult | null) => void;
  coverLetterResult: CoverLetterResult | null;
  onCoverLetterResultChange: (result: CoverLetterResult | null) => void;
  resumeUpdateResult: ResumeUpdateResult | null;
  onResumeUpdateResultChange: (result: ResumeUpdateResult | null) => void;
  interviewPrepResult: InterviewPrepResult | null;
  onInterviewPrepResultChange: (result: InterviewPrepResult | null) => void;
  followUpResult: FollowUpResult | null;
  onFollowUpResultChange: (result: FollowUpResult | null) => void;
  companyResearchResult: CompanyResearchResult | null;
  onCompanyResearchResultChange: (result: CompanyResearchResult | null) => void;
  onGoToProfile: () => void;
  onGoToJobFit: () => void;
}

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silently fail */ }
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-brand-text/30 hover:text-brand-text/60 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-status-apply" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-status-apply">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// Used for brief result cards (Lead Strengths, JD Language, etc.)
function Section({
  title,
  copyText,
  children,
}: {
  title: string;
  copyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40">{title}</p>
        <CopyButton getText={() => copyText} />
      </div>
      {children}
    </div>
  );
}

// Used for the three generate-on-demand sections (Resume, Cover Letter, Outreach)
function ActionSection({
  title,
  description,
  buttonLabel,
  onAction,
  isLoading,
  loadingMessage,
  hasResult,
  error,
  children,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
  isLoading: boolean;
  loadingMessage: string;
  hasResult: boolean;
  error: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text">{title}</p>
        {!isLoading && (
          <button
            onClick={onAction}
            className="shrink-0 text-base font-medium text-brand-accent hover:text-brand-accent/70 transition-colors"
          >
            {hasResult ? "Re-generate →" : `${buttonLabel} →`}
          </button>
        )}
      </div>

      {/* Body */}
      {!hasResult && !isLoading && !error && (
        <p className="px-5 pb-4 -mt-1 text-base text-brand-text/40">{description}</p>
      )}

      {isLoading && (
        <div className="px-5 pb-5">
          <LoadingState message={loadingMessage} />
        </div>
      )}

      {error && !isLoading && (
        <div className="px-5 pb-4 -mt-1">
          <p className="text-base text-red-700">{error}</p>
          <button onClick={onAction} className="mt-1 text-sm text-red-500 underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {hasResult && !isLoading && (
        <div className="border-t border-brand-text/8 px-5 py-5 space-y-6">
          {children}
        </div>
      )}
    </div>
  );
}

// Sub-section heading used inside ActionSection result areas
function SubHeading({ label, copyText }: { label: string; copyText?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium tracking-[0.06em] uppercase text-brand-text/30">{label}</p>
      {copyText !== undefined && <CopyButton getText={() => copyText} />}
    </div>
  );
}

export default function TailoringBrief({
  profileText,
  jobDescription,
  jobLabel,
  result,
  onResultChange,
  outreachResult,
  onOutreachResultChange,
  coverLetterResult,
  onCoverLetterResultChange,
  resumeUpdateResult,
  onResumeUpdateResultChange,
  interviewPrepResult,
  onInterviewPrepResultChange,
  followUpResult,
  onFollowUpResultChange,
  companyResearchResult,
  onCompanyResearchResultChange,
  onGoToProfile,
  onGoToJobFit,
}: TailoringBriefProps) {
  const [prepSection, setPrepSection] = useState<PrepSection>("brief");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [isGeneratingResumeUpdates, setIsGeneratingResumeUpdates] = useState(false);
  const [resumeUpdateError, setResumeUpdateError] = useState<string>("");
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string>("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachError, setOutreachError] = useState<string>("");
  const [isGeneratingInterviewPrep, setIsGeneratingInterviewPrep] = useState(false);
  const [interviewPrepError, setInterviewPrepError] = useState<string>("");
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string>("");
  const [isGeneratingCompanyResearch, setIsGeneratingCompanyResearch] = useState(false);
  const [companyResearchError, setCompanyResearchError] = useState<string>("");

  if (!profileText) {
    return (
      <div className="text-center py-20">
        <p className="text-base font-semibold text-brand-text">Profile required</p>
        <p className="text-base text-brand-text/50 mt-1">Upload your resume in the Profile tab first.</p>
        <button
          onClick={onGoToProfile}
          className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
        >
          Go to Profile →
        </button>
      </div>
    );
  }

  if (!jobDescription) {
    return (
      <div className="text-center py-20">
        <p className="text-base font-semibold text-brand-text">Score a job first</p>
        <p className="text-base text-brand-text/50 mt-1 max-w-xs mx-auto">
          Score a job in the Job Fit tab, then come back to generate your prep.
        </p>
        <button
          onClick={onGoToJobFit}
          className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
        >
          Go to Job Fit →
        </button>
      </div>
    );
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setPrepSection("brief");
    onOutreachResultChange(null);
    onCoverLetterResultChange(null);
    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobDescription }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to generate brief. Please try again.");
      } else {
        onResultChange(data as TailoringBriefResult);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateResumeUpdates() {
    setIsGeneratingResumeUpdates(true);
    setResumeUpdateError("");
    onResumeUpdateResultChange(null);
    try {
      const response = await fetch("/api/suggest-resume-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobDescription }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResumeUpdateError(data.error ?? "Failed to generate resume suggestions. Please try again.");
      } else {
        onResumeUpdateResultChange(data as ResumeUpdateResult);
      }
    } catch {
      setResumeUpdateError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingResumeUpdates(false);
    }
  }

  async function handleGenerateCoverLetter() {
    setIsGeneratingCoverLetter(true);
    setCoverLetterError("");
    onCoverLetterResultChange(null);
    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription,
          outreachAngle: result?.outreach_angle,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCoverLetterError(data.error ?? "Failed to generate cover letter. Please try again.");
      } else {
        onCoverLetterResultChange(data as CoverLetterResult);
      }
    } catch {
      setCoverLetterError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  }

  async function handleGenerateOutreach() {
    if (!result?.outreach_angle) return;
    setIsGeneratingOutreach(true);
    setOutreachError("");
    onOutreachResultChange(null);
    try {
      const response = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outreachAngle: result.outreach_angle,
          resumeText: profileText,
          jobDescription,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setOutreachError(data.error ?? "Failed to generate outreach messages. Please try again.");
      } else {
        onOutreachResultChange(data as OutreachResult);
      }
    } catch {
      setOutreachError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingOutreach(false);
    }
  }

  async function handleGenerateInterviewPrep() {
    setIsGeneratingInterviewPrep(true);
    setInterviewPrepError("");
    onInterviewPrepResultChange(null);
    try {
      const response = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobDescription }),
      });
      const data = await response.json();
      if (!response.ok) {
        setInterviewPrepError(data.error ?? "Failed to generate interview questions. Please try again.");
      } else {
        onInterviewPrepResultChange(data as InterviewPrepResult);
      }
    } catch {
      setInterviewPrepError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingInterviewPrep(false);
    }
  }

  async function handleGenerateCompanyResearch() {
    setIsGeneratingCompanyResearch(true);
    setCompanyResearchError("");
    onCompanyResearchResultChange(null);
    try {
      const response = await fetch("/api/company-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCompanyResearchError(data.error ?? "Failed to research company. Please try again.");
      } else {
        onCompanyResearchResultChange(data as CompanyResearchResult);
      }
    } catch {
      setCompanyResearchError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingCompanyResearch(false);
    }
  }

  function handleExport() {
    const lines: string[] = [];
    const sep = "─".repeat(60);
    const displayName = companyResearchResult?.company_name ?? jobLabel ?? "Prep Guide";

    lines.push("SIGNAL — PREP GUIDE");
    lines.push(displayName);
    lines.push(
      `Exported ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    );
    lines.push("");

    if (companyResearchResult) {
      lines.push(sep);
      lines.push("COMPANY RESEARCH");
      lines.push(sep);
      lines.push("");
      lines.push(`Company: ${companyResearchResult.company_name}`);
      lines.push("");
      lines.push("Business Overview");
      lines.push(companyResearchResult.business_overview);
      lines.push("");
      if (companyResearchResult.caveat) {
        lines.push(`Note: ${companyResearchResult.caveat}`);
        lines.push("");
      }
      lines.push("Culture Signals");
      companyResearchResult.culture_signals.forEach((s) => lines.push(`• ${s}`));
      lines.push("");
      lines.push("Strategic Context");
      lines.push(companyResearchResult.strategic_context);
      lines.push("");
      if (companyResearchResult.red_flags_to_probe.length > 0) {
        lines.push("Red Flags to Probe");
        companyResearchResult.red_flags_to_probe.forEach((f) => lines.push(`• ${f}`));
        lines.push("");
      }
      lines.push("Smart Questions to Ask");
      companyResearchResult.smart_questions_to_ask.forEach((q) => {
        lines.push(`Q: ${q.question}`);
        lines.push(`   Why: ${q.why}`);
      });
      lines.push("");
    }

    if (result) {
      lines.push(sep);
      lines.push("PREP BRIEF");
      lines.push(sep);
      lines.push("");
      lines.push("Lead Strengths to Emphasize");
      result.lead_strengths.forEach((s) => {
        lines.push(`• ${s.strength}`);
        lines.push(`  → ${s.framing_language}`);
      });
      lines.push("");
      lines.push("JD Language to Mirror");
      result.jd_language_to_mirror.forEach((p) => {
        lines.push(`"${p.phrase}"`);
        lines.push(`  ${p.context}`);
      });
      lines.push("");
      lines.push("What to De-emphasize");
      result.what_to_deemphasize.forEach((d) => {
        lines.push(`• ${d.item}`);
        lines.push(`  Reason: ${d.reason}`);
      });
      lines.push("");
      lines.push("Recruiter Concern to Preempt");
      lines.push(`Concern: ${result.recruiter_concern_to_preempt.concern}`);
      lines.push(`Response: ${result.recruiter_concern_to_preempt.suggested_response}`);
      lines.push("");
      if (result.outreach_angle) {
        lines.push("Outreach Angle");
        lines.push(result.outreach_angle);
        lines.push("");
      }
    }

    if (resumeUpdateResult) {
      lines.push(sep);
      lines.push("RESUME UPDATES");
      lines.push(sep);
      lines.push("");
      lines.push("Summary Rewrite");
      lines.push(resumeUpdateResult.summary_rewrite);
      lines.push("");
      lines.push("Bullet Updates");
      resumeUpdateResult.bullet_updates.forEach((b) => {
        lines.push(`[${b.section}]`);
        lines.push(`Was: ${b.original_paraphrase}`);
        lines.push(`Update to: ${b.suggested_rewrite}`);
        lines.push(`Why: ${b.why}`);
        lines.push("");
      });
      lines.push("Keywords to Weave In");
      resumeUpdateResult.keywords_to_weave_in.forEach((k) => {
        lines.push(`"${k.keyword}" — ${k.suggested_context}`);
      });
      lines.push("");
    }

    if (coverLetterResult) {
      lines.push(sep);
      lines.push("COVER LETTER");
      lines.push(sep);
      lines.push("");
      lines.push(coverLetterResult.cover_letter);
      lines.push("");
    }

    if (outreachResult) {
      lines.push(sep);
      lines.push("OUTREACH MESSAGES");
      lines.push(sep);
      lines.push("");
      lines.push("Cold Email");
      lines.push(outreachResult.email);
      lines.push("");
      lines.push("LinkedIn Message");
      lines.push(outreachResult.linkedin_message);
      lines.push("");
    }

    if (interviewPrepResult) {
      lines.push(sep);
      lines.push("INTERVIEW PREP");
      lines.push(sep);
      lines.push("");
      interviewPrepResult.questions.forEach((q, i) => {
        lines.push(`${i + 1}. ${q.question}`);
        lines.push(`   Why likely: ${q.why_likely}`);
        lines.push(`   Approach: ${q.suggested_approach}`);
        lines.push("");
      });
    }

    if (followUpResult) {
      lines.push(sep);
      lines.push("FOLLOW-UP TEMPLATES");
      lines.push(sep);
      lines.push("");
      lines.push("Thank-You Note");
      lines.push(followUpResult.thank_you_note);
      lines.push("");
      lines.push("Check-In Email");
      lines.push(followUpResult.check_in_email);
      lines.push("");
    }

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    a.href = url;
    a.download = `signal-${slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleGenerateFollowUp() {
    setIsGeneratingFollowUp(true);
    setFollowUpError("");
    onFollowUpResultChange(null);
    try {
      const response = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobDescription }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFollowUpError(data.error ?? "Failed to generate follow-up templates. Please try again.");
      } else {
        onFollowUpResultChange(data as FollowUpResult);
      }
    } catch {
      setFollowUpError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingFollowUp(false);
    }
  }

  const sectionHasContent = {
    brief: !!result,
    company: !!companyResearchResult,
    resume: !!resumeUpdateResult,
    "cover-letter": !!coverLetterResult,
    outreach: !!outreachResult,
    interview: !!interviewPrepResult,
    "follow-up": !!followUpResult,
  };

  const hasAnyContent = Object.values(sectionHasContent).some(Boolean);

  return (
    <div className="space-y-4">

      {/* ── Header row: description + Export + Build button ── */}
      {!isGenerating && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-base text-brand-text/40">
            {result ? "Rebuild to refresh with the latest job and profile." : "Signal will build targeted prep for this specific job."}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {hasAnyContent && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-brand-text/15 text-brand-text/50 text-sm font-medium rounded-2xl sm:rounded-full hover:border-brand-text/30 hover:text-brand-text/70 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            )}
            <button
              onClick={handleGenerate}
              className="px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
            >
              {result ? "Rebuild" : "Build Prep Guide"}
            </button>
          </div>
        </div>
      )}

      {isGenerating && <LoadingState message="Building your prep guide. This takes about 20 seconds..." />}

      {error && !isGenerating && (
        <div className="p-4 bg-red-50 rounded-xl ring-1 ring-red-100">
          <p className="text-base text-red-700">{error}</p>
          <button onClick={handleGenerate} className="mt-1 text-sm text-red-500 underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* ── Section pill strip ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {PREP_SECTIONS.map((s) => {
          const isActive = prepSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setPrepSection(s.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-text text-white"
                  : "bg-brand-text/6 text-brand-text/60 hover:bg-brand-text/10 hover:text-brand-text/80"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ── Section content ── */}

      {/* Brief */}
      {prepSection === "brief" && (
        <div className="space-y-4">
          {!result && !isGenerating && (
            <div className="bg-white rounded-2xl p-8 shadow text-center">
              <p className="text-base font-semibold text-brand-text">No brief yet</p>
              <p className="text-base text-brand-text/50 mt-1">Hit "Build Prep Guide" to generate your tailored brief.</p>
            </div>
          )}
          {result && !isGenerating && (
            <>
              <Section
                title="Lead Strengths to Emphasize"
                copyText={result.lead_strengths.map((s) => `• ${s.strength}\n  → ${s.framing_language}`).join("\n\n")}
              >
                <div className="space-y-3">
                  {result.lead_strengths.map((s, i) => (
                    <div key={i} className="border-l-2 border-brand-accent/30 pl-3.5">
                      <p className="text-base font-medium text-brand-text">{s.strength}</p>
                      <p className="text-base text-brand-text/40 mt-0.5 italic">{s.framing_language}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="JD Language to Mirror"
                copyText={result.jd_language_to_mirror.map((p) => `"${p.phrase}"\n  ${p.context}`).join("\n\n")}
              >
                <div className="space-y-3">
                  {result.jd_language_to_mirror.map((p, i) => (
                    <div key={i}>
                      <span className="inline-block bg-brand-text/5 text-brand-text text-base font-medium px-3 py-1 rounded-lg ring-1 ring-brand-text/12">
                        &ldquo;{p.phrase}&rdquo;
                      </span>
                      <p className="mt-1.5 text-sm text-brand-text/40 leading-snug">{p.context}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="What to De-emphasize"
                copyText={result.what_to_deemphasize.map((d) => `• ${d.item}\n  Reason: ${d.reason}`).join("\n\n")}
              >
                <div className="space-y-3">
                  {result.what_to_deemphasize.map((d, i) => (
                    <div key={i} className="border-l-2 border-status-tailor/40 pl-3.5">
                      <p className="text-base font-medium text-brand-text">{d.item}</p>
                      <p className="text-base text-brand-text/40 mt-0.5">{d.reason}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="Recruiter Concern to Preempt"
                copyText={`Concern: ${result.recruiter_concern_to_preempt.concern}\n\nHow to address it: ${result.recruiter_concern_to_preempt.suggested_response}`}
              >
                <div className="space-y-2">
                  <div className="bg-status-tailor/8 rounded-xl p-4 ring-1 ring-status-tailor/20">
                    <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-status-tailor mb-1">
                      Likely concern
                    </p>
                    <p className="text-base text-brand-text">{result.recruiter_concern_to_preempt.concern}</p>
                  </div>
                  <div className="bg-status-apply/8 rounded-xl p-4 ring-1 ring-status-apply/20">
                    <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-status-apply mb-1">
                      How to address it
                    </p>
                    <p className="text-base text-brand-text">{result.recruiter_concern_to_preempt.suggested_response}</p>
                  </div>
                </div>
              </Section>

              {result.outreach_angle && (
                <Section title="Outreach Angle" copyText={result.outreach_angle}>
                  <p className="text-base text-brand-text/80 leading-relaxed">{result.outreach_angle}</p>
                </Section>
              )}
            </>
          )}
        </div>
      )}

      {/* Company */}
      {prepSection === "company" && (
        <ActionSection
          title="Company Research"
          description="Culture signals, strategic context, and smart questions to ask — pulled from the job description."
          buttonLabel="Research Company"
          onAction={handleGenerateCompanyResearch}
          isLoading={isGeneratingCompanyResearch}
          loadingMessage="Researching the company…"
          hasResult={!!companyResearchResult}
          error={companyResearchError}
        >
          {companyResearchResult && (
            <>
              <div>
                <p className="text-base font-semibold text-brand-text mb-1">{companyResearchResult.company_name}</p>
                <p className="text-base text-brand-text/70 leading-relaxed">{companyResearchResult.business_overview}</p>
              </div>

              {companyResearchResult.caveat && (
                <div className="rounded-xl bg-status-stretch/8 ring-1 ring-status-stretch/20 px-4 py-3">
                  <p className="text-sm text-status-stretch leading-snug">{companyResearchResult.caveat}</p>
                </div>
              )}

              <div className="border-t border-brand-text/8 pt-6">
                <SubHeading label="Culture Signals" />
                <ul className="space-y-1.5">
                  {companyResearchResult.culture_signals.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-brand-text/70">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-text/30 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-brand-text/8 pt-6">
                <SubHeading label="Strategic Context" />
                <p className="text-base text-brand-text/70 leading-relaxed">{companyResearchResult.strategic_context}</p>
              </div>

              {companyResearchResult.red_flags_to_probe.length > 0 && (
                <div className="border-t border-brand-text/8 pt-6">
                  <SubHeading label="Red Flags to Probe" />
                  <ul className="space-y-1.5">
                    {companyResearchResult.red_flags_to_probe.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-base text-status-stretch">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-status-stretch/50 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-brand-text/8 pt-6">
                <SubHeading
                  label="Smart Questions to Ask"
                  copyText={companyResearchResult.smart_questions_to_ask
                    .map((q) => `Q: ${q.question}\nWhy: ${q.why}`)
                    .join("\n\n")}
                />
                <div className="space-y-4">
                  {companyResearchResult.smart_questions_to_ask.map((q, i) => (
                    <div key={i} className="border-l-2 border-brand-accent/30 pl-3.5">
                      <p className="text-base font-medium text-brand-text">{q.question}</p>
                      <p className="text-sm text-brand-text/40 mt-0.5">{q.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </ActionSection>
      )}

      {/* Resume */}
      {prepSection === "resume" && (
        !result ? (
          <NeedsBriefPrompt onBuild={handleGenerate} />
        ) : (
          <ActionSection
            title="Resume Updates"
            description="Get specific, copy-paste resume edits tailored to this job."
            buttonLabel="Suggest Updates"
            onAction={handleGenerateResumeUpdates}
            isLoading={isGeneratingResumeUpdates}
            loadingMessage="Generating resume suggestions. This takes about 20 seconds..."
            hasResult={!!resumeUpdateResult}
            error={resumeUpdateError}
          >
            {resumeUpdateResult && (
              <>
                <div>
                  <SubHeading label="Summary Rewrite" copyText={resumeUpdateResult.summary_rewrite} />
                  <p className="text-base text-brand-text/80 leading-relaxed">{resumeUpdateResult.summary_rewrite}</p>
                </div>

                <div className="border-t border-brand-text/8 pt-6">
                  <SubHeading
                    label="Resume Bullets to Update"
                    copyText={resumeUpdateResult.bullet_updates
                      .map((b) => `[${b.section}]\nWas: ${b.original_paraphrase}\nUpdate to: ${b.suggested_rewrite}\nWhy: ${b.why}`)
                      .join("\n\n")}
                  />
                  <div className="space-y-4">
                    {resumeUpdateResult.bullet_updates.map((b, i) => (
                      <div key={i} className="space-y-2">
                        <p className="text-[0.75rem] font-medium tracking-[0.06em] uppercase text-brand-text/30">
                          {b.section}
                        </p>
                        <div className="rounded-xl overflow-hidden border border-brand-text/8">
                          <div className="px-3.5 py-2.5 bg-brand-text/4">
                            <p className="text-[0.75rem] font-medium uppercase tracking-wide text-brand-text/30 mb-1">Was</p>
                            <p className="text-base text-brand-text/50 italic">{b.original_paraphrase}</p>
                          </div>
                          <div className="px-3.5 py-2.5 bg-white border-t border-brand-text/8">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-[0.75rem] font-medium uppercase tracking-wide text-status-apply mb-1">Update to</p>
                                <p className="text-base text-brand-text font-medium leading-snug">{b.suggested_rewrite}</p>
                              </div>
                              <CopyButton getText={() => b.suggested_rewrite} />
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-brand-text/40 pl-1">{b.why}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-brand-text/8 pt-6">
                  <SubHeading
                    label="Keywords to Weave In"
                    copyText={resumeUpdateResult.keywords_to_weave_in
                      .map((k) => `"${k.keyword}" — ${k.suggested_context}`)
                      .join("\n")}
                  />
                  <div className="space-y-3">
                    {resumeUpdateResult.keywords_to_weave_in.map((k, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="shrink-0 inline-block bg-brand-text/5 text-brand-text text-base font-medium px-3 py-1 rounded-lg ring-1 ring-brand-text/12">
                          {k.keyword}
                        </span>
                        <p className="text-base text-brand-text/50 leading-snug mt-1">{k.suggested_context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </ActionSection>
        )
      )}

      {/* Cover Letter */}
      {prepSection === "cover-letter" && (
        !result ? (
          <NeedsBriefPrompt onBuild={handleGenerate} />
        ) : (
          <ActionSection
            title="Cover Letter"
            description="A tailored cover letter built from the brief above."
            buttonLabel="Draft Cover Letter"
            onAction={handleGenerateCoverLetter}
            isLoading={isGeneratingCoverLetter}
            loadingMessage="Drafting your cover letter…"
            hasResult={!!coverLetterResult}
            error={coverLetterError}
          >
            {coverLetterResult && (
              <div>
                <SubHeading label="Cover Letter" copyText={coverLetterResult.cover_letter} />
                <pre className="text-base text-brand-text/80 leading-relaxed whitespace-pre-wrap font-sans">
                  {coverLetterResult.cover_letter}
                </pre>
              </div>
            )}
          </ActionSection>
        )
      )}

      {/* Outreach */}
      {prepSection === "outreach" && (
        !result ? (
          <NeedsBriefPrompt onBuild={handleGenerate} />
        ) : !result.outreach_angle ? (
          <div className="bg-white rounded-2xl p-8 shadow text-center">
            <p className="text-base font-semibold text-brand-text">No outreach angle in brief</p>
            <p className="text-base text-brand-text/50 mt-1 max-w-xs mx-auto">
              The brief for this job didn&apos;t surface an outreach angle. Try rebuilding the prep guide.
            </p>
            <button
              onClick={handleGenerate}
              className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
            >
              Rebuild →
            </button>
          </div>
        ) : (
          <ActionSection
            title="Outreach Messages"
            description="Turn the outreach angle into a ready-to-send email and LinkedIn message."
            buttonLabel="Draft Messages"
            onAction={handleGenerateOutreach}
            isLoading={isGeneratingOutreach}
            loadingMessage="Drafting outreach messages…"
            hasResult={!!outreachResult}
            error={outreachError}
          >
            {outreachResult && (
              <>
                <div>
                  <SubHeading label="Cold Email" copyText={outreachResult.email} />
                  <pre className="text-base text-brand-text/80 leading-relaxed whitespace-pre-wrap font-sans">
                    {outreachResult.email}
                  </pre>
                </div>
                <div className="border-t border-brand-text/8 pt-6">
                  <SubHeading label="LinkedIn Message" copyText={outreachResult.linkedin_message} />
                  <p className="text-base text-brand-text/80 leading-relaxed">{outreachResult.linkedin_message}</p>
                  <p className="mt-2 text-sm text-brand-text/40">{outreachResult.linkedin_message.length} / 280 characters</p>
                </div>
              </>
            )}
          </ActionSection>
        )
      )}

      {/* Interview */}
      {prepSection === "interview" && (
        !result ? (
          <NeedsBriefPrompt onBuild={handleGenerate} />
        ) : (
          <ActionSection
            title="Interview Prep"
            description="Likely questions for this role, calibrated to your background — with suggested framing for each."
            buttonLabel="Generate Questions"
            onAction={handleGenerateInterviewPrep}
            isLoading={isGeneratingInterviewPrep}
            loadingMessage="Generating interview questions…"
            hasResult={!!interviewPrepResult}
            error={interviewPrepError}
          >
            {interviewPrepResult && (
              <div className="space-y-8">
                {interviewPrepResult.questions.map((q, i) => (
                  <div key={i} className="space-y-3">
                    <p className="text-base font-semibold text-brand-text">{q.question}</p>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.06em] text-brand-text/30 mb-1">
                        Why likely
                      </p>
                      <p className="text-base text-brand-text/60">{q.why_likely}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.06em] text-brand-text/30 mb-1">
                        Suggested approach
                      </p>
                      <p className="text-base text-brand-text/80 leading-relaxed">{q.suggested_approach}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ActionSection>
        )
      )}

      {/* Follow-up */}
      {prepSection === "follow-up" && (
        !result ? (
          <NeedsBriefPrompt onBuild={handleGenerate} />
        ) : (
          <ActionSection
            title="Follow-Up Templates"
            description="A thank-you note and check-in email tailored to this role — ready to send after your interview."
            buttonLabel="Generate Templates"
            onAction={handleGenerateFollowUp}
            isLoading={isGeneratingFollowUp}
            loadingMessage="Drafting follow-up templates…"
            hasResult={!!followUpResult}
            error={followUpError}
          >
            {followUpResult && (
              <>
                <div>
                  <SubHeading label="Thank-You Note" copyText={followUpResult.thank_you_note} />
                  <pre className="text-base text-brand-text/80 leading-relaxed whitespace-pre-wrap font-sans">
                    {followUpResult.thank_you_note}
                  </pre>
                </div>
                <div className="border-t border-brand-text/8 pt-6">
                  <SubHeading label="Check-In Email" copyText={followUpResult.check_in_email} />
                  <pre className="text-base text-brand-text/80 leading-relaxed whitespace-pre-wrap font-sans">
                    {followUpResult.check_in_email}
                  </pre>
                </div>
              </>
            )}
          </ActionSection>
        )
      )}

    </div>
  );
}

function NeedsBriefPrompt({ onBuild }: { onBuild: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow text-center">
      <p className="text-base font-semibold text-brand-text">Build the brief first</p>
      <p className="text-base text-brand-text/50 mt-1">
        Hit "Build Prep Guide" to generate your tailored brief, then this section will unlock.
      </p>
      <button
        onClick={onBuild}
        className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
      >
        Build Prep Guide →
      </button>
    </div>
  );
}
