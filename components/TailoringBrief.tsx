"use client";

import { useState } from "react";
import LoadingState from "./LoadingState";
import type { TailoringBriefResult, OutreachResult, CoverLetterResult, ResumeUpdateResult, InterviewPrepResult, FollowUpResult, CompanyResearchResult, StrengthMatchType } from "@/types";

const MATCH_TYPE_STYLES: Record<StrengthMatchType, string> = {
  "Direct match":     "bg-status-apply/10 text-status-apply ring-1 ring-status-apply/20",
  "Strong inference": "bg-status-tailor/10 text-status-tailor ring-1 ring-status-tailor/20",
  "Reframe":          "bg-status-stretch/10 text-status-stretch ring-1 ring-status-stretch/20",
};

type ApplicationStage = "preparing" | "applied" | "post-interview";

const APPLICATION_STAGES: { id: ApplicationStage; label: string }[] = [
  { id: "preparing", label: "Preparing to Apply" },
  { id: "applied", label: "Applied / Heard Back" },
  { id: "post-interview", label: "Post-Interview" },
];

interface TailoringBriefProps {
  profileText: string;
  writingSample?: string;
  pivotTarget?: string;
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
  isProfileStale?: boolean;
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

function PrimaryCopyButton({ getText, label = "Copy" }: { getText: () => string; label?: string }) {
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
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        copied
          ? "bg-status-apply/10 text-status-apply"
          : "bg-brand-text/8 text-brand-text/60 hover:bg-brand-text/12 hover:text-brand-text/80"
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
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
    <div className="bg-white rounded-2xl p-6 shadow">
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
  noteValue,
  onNoteChange,
  bgClass = "bg-white",
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
  noteValue?: string;
  onNoteChange?: (v: string) => void;
  bgClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${bgClass} rounded-2xl shadow overflow-hidden`}>
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
        <div className="px-5 pb-4 -mt-1 space-y-2.5">
          <p className="text-base text-red-700">{error}</p>
          <button
            onClick={onAction}
            className="px-3.5 py-1.5 text-sm font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {hasResult && !isLoading && (
        <div className="border-t border-brand-text/8 px-5 py-5 space-y-6">
          {children}
          {/* Correction / tone note — shown after a result so user can refine before regenerating */}
          {noteValue !== undefined && onNoteChange && (
            <div className="border-t border-brand-text/8 pt-4 space-y-2">
              <p className="text-[0.75rem] font-medium uppercase tracking-[0.06em] text-brand-text/30">
                Anything to correct or adjust?
              </p>
              <textarea
                value={noteValue}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder='e.g. "Make it more direct" or "I was VP level, not Director"'
                maxLength={300}
                rows={2}
                className="w-full text-sm text-brand-text/70 bg-brand-text/4 rounded-xl px-3 py-2.5 resize-none border border-brand-text/12 focus:border-brand-text/30 focus:outline-none focus:ring-0 placeholder:text-brand-text/25 leading-relaxed transition-colors"
              />
              <div className="flex justify-end">
                <button
                  onClick={onAction}
                  className="text-sm font-medium text-brand-accent hover:text-brand-accent/70 transition-colors"
                >
                  Re-generate →
                </button>
              </div>
            </div>
          )}
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

// Handles data saved before the provenance schema change (overview/red_flags/questions → new shape)
type LegacyCompanyResearch = CompanyResearchResult & {
  overview?: string;
  red_flags?: string[];
  questions?: { question: string; why?: string }[];
};
function normalizeCompanyResearch(raw: CompanyResearchResult): CompanyResearchResult {
  const r = raw as LegacyCompanyResearch;
  return {
    ...raw,
    what_we_know: raw.what_we_know ?? { summary: r.overview ?? "", sources: "Prior knowledge" },
    what_we_re_reading: raw.what_we_re_reading ?? [],
    red_flags_to_probe: raw.red_flags_to_probe ?? (r.red_flags ?? []).map((f) => ({ flag: f, how_to_probe: "" })),
    questions_to_test: raw.questions_to_test ?? (r.questions ?? []).map((q) => ({
      question: q.question,
      what_youre_probing: q.why ?? "",
    })),
    culture_signals: raw.culture_signals ?? [],
  };
}

export default function TailoringBrief({
  profileText,
  writingSample,
  pivotTarget,
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
  isProfileStale,
}: TailoringBriefProps) {
  const [appStage, setAppStage] = useState<ApplicationStage>("preparing");
  const [briefNoteExpanded, setBriefNoteExpanded] = useState(false);
  const [expandedStrengths, setExpandedStrengths] = useState<Set<number>>(new Set());
  const [expandedPhrases, setExpandedPhrases] = useState<Set<number>>(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  function toggleStrength(i: number) {
    setExpandedStrengths(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }
  function togglePhrase(i: number) {
    setExpandedPhrases(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }
  const [expandedBullets, setExpandedBullets] = useState<Set<number>>(new Set());
  function toggleBullet(i: number) {
    setExpandedBullets(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [linkedInExpanded, setLinkedInExpanded] = useState(false);
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

  // User correction / tone notes — sent with each (re)generation
  const [briefNote, setBriefNote] = useState<string>("");
  const [coverLetterNote, setCoverLetterNote] = useState<string>("");
  const [outreachNote, setOutreachNote] = useState<string>("");

  // Normalize legacy company research data to current schema shape
  const cr = companyResearchResult ? normalizeCompanyResearch(companyResearchResult) : null;

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
    onOutreachResultChange(null);
    onCoverLetterResultChange(null);
    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobDescription, userNote: briefNote || undefined, writingSample: writingSample || undefined, pivotTarget: pivotTarget || undefined }),
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
        body: JSON.stringify({ resumeText: profileText, jobDescription, writingSample: writingSample || undefined, pivotTarget: pivotTarget || undefined }),
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
          userNote: coverLetterNote || undefined,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
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
          userNote: outreachNote || undefined,
          writingSample: writingSample || undefined,
          pivotTarget: pivotTarget || undefined,
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
        body: JSON.stringify({ resumeText: profileText, jobDescription, writingSample: writingSample || undefined, pivotTarget: pivotTarget || undefined }),
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
    const displayName = cr?.company_name ?? jobLabel ?? "Prep Guide";

    lines.push("SIGNAL — PREP GUIDE");
    lines.push(displayName);
    lines.push(
      `Exported ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    );
    lines.push("");

    if (cr) {
      lines.push(sep);
      lines.push("COMPANY RESEARCH");
      lines.push(sep);
      lines.push("");
      lines.push(`Company: ${cr.company_name}`);
      lines.push(`Source confidence: ${cr.what_we_know.sources}`);
      lines.push("");
      lines.push("What We Know");
      lines.push(cr.what_we_know.summary);
      lines.push("");
      if (cr.caveat) {
        lines.push(`Note: ${cr.caveat}`);
        lines.push("");
      }
      if (cr.what_we_re_reading.length > 0) {
        lines.push("What We're Reading (Interpretation)");
        cr.what_we_re_reading.forEach((s) => lines.push(`• ${s}`));
        lines.push("");
      }
      lines.push("Culture Signals");
      cr.culture_signals.forEach((s) => lines.push(`• ${s}`));
      lines.push("");
      if (cr.red_flags_to_probe.length > 0) {
        lines.push("Worth Probing");
        cr.red_flags_to_probe.forEach((f) => {
          lines.push(`• ${f.flag}`);
          lines.push(`  How to probe: ${f.how_to_probe}`);
        });
        lines.push("");
      }
      lines.push("Questions to Test");
      cr.questions_to_test.forEach((q) => {
        lines.push(`Q: ${q.question}`);
        lines.push(`   Probing: ${q.what_youre_probing}`);
      });
      lines.push("");
    }

    if (result) {
      lines.push(sep);
      lines.push("PREP BRIEF");
      lines.push(sep);
      lines.push("");
      if (result.honest_take) {
        lines.push("Honest Take");
        lines.push(result.honest_take);
        lines.push("");
      }
      lines.push("Lead Strengths to Emphasize");
      result.lead_strengths.forEach((s) => {
        lines.push(`• [${s.match_type ?? ""}] ${s.strength}`);
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
        lines.push(`Original: ${b.original}`);
        lines.push(`Suggested: ${b.suggested}`);
        lines.push(`What changed: ${b.what_changed}`);
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
        body: JSON.stringify({ resumeText: profileText, jobDescription, writingSample: writingSample || undefined, pivotTarget: pivotTarget || undefined }),
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
    <div className="space-y-5">

      {/* ── Stage selector ── */}
      <div className="my-2 flex w-full rounded-[14px] bg-brand-text/6 p-1">
        {APPLICATION_STAGES.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setAppStage(stage.id)}
            className={`flex-1 rounded-[10px] px-4 py-3 text-center text-[15px] transition-all duration-150 focus:outline-none focus:ring-0 ${
              appStage === stage.id
                ? "bg-white font-semibold text-brand-text shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
                : "font-medium text-brand-text/45 hover:bg-brand-text/4 hover:text-brand-text/70"
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* ── Honest Take — always visible when brief is built, across all stages ── */}
      {result?.honest_take && (
        <div className="rounded-2xl bg-brand-text p-7">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-white/35 mb-2">
            Honest Take
          </p>
          <p className="text-xl font-semibold text-white leading-[1.4]">{result.honest_take}</p>
        </div>
      )}

      {/* ── Preparing to Apply: Brief + Cover Letter + Outreach + Resume Bullets ── */}
      {appStage === "preparing" && (
        <div className="space-y-5">

          {/* Correction input + Export + Rebuild/Build row */}
          {!isGenerating && (
            <div className="space-y-2">
              {result && (
                <textarea
                  value={briefNote}
                  onChange={(e) => setBriefNote(e.target.value)}
                  onFocus={() => setBriefNoteExpanded(true)}
                  onBlur={() => { if (!briefNote.trim()) setBriefNoteExpanded(false); }}
                  placeholder="Anything to correct before rebuilding? (optional)"
                  maxLength={300}
                  rows={briefNoteExpanded ? 3 : 1}
                  className="w-full text-sm text-brand-text/70 bg-brand-text/4 rounded-xl px-3 py-2.5 resize-none border border-brand-text/12 focus:border-brand-text/30 focus:outline-none focus:ring-0 placeholder:text-brand-text/25 leading-relaxed transition-all"
                />
              )}
              <div className="flex justify-end gap-2">
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

          {/* Profile staleness banner */}
          {isProfileStale && result && !isGenerating && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-status-stretch/8 rounded-xl ring-1 ring-status-stretch/20">
              <p className="text-sm text-brand-text/70">Your profile was updated after this score — re-score the job first, then rebuild your prep guide.</p>
              <button
                onClick={onGoToJobFit}
                className="shrink-0 text-sm font-semibold text-status-stretch hover:text-status-stretch/70 transition-colors whitespace-nowrap"
              >
                Re-score →
              </button>
            </div>
          )}

          {/* Brief results */}
          {!result && !isGenerating && (
            <div className="bg-white rounded-2xl p-8 shadow text-center">
              <p className="text-base font-semibold text-brand-text">No brief yet</p>
              <p className="text-base text-brand-text/50 mt-1">Hit "Build Prep Guide" to generate your tailored brief.</p>
            </div>
          )}

          {result && !isGenerating && (
            <div className="bg-white rounded-2xl shadow overflow-hidden divide-y divide-brand-text/8">

              {/* ── Lead Strengths ── */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40">Lead Strengths to Emphasize</p>
                  <CopyButton getText={() => result.lead_strengths.map((s) => `• [${s.match_type ?? ""}] ${s.strength}\n  → ${s.framing_language}`).join("\n\n")} />
                </div>
                <div className="space-y-3">
                  {result.lead_strengths.map((s, i) => {
                    const matchStyle = s.match_type ? MATCH_TYPE_STYLES[s.match_type] : null;
                    return (
                      <div key={i} className="border-l-2 border-brand-accent/30 pl-3.5">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-brand-text">{s.strength}</p>
                          {matchStyle && (
                            <span className={`shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full ${matchStyle}`}>
                              {s.match_type}
                            </span>
                          )}
                        </div>
                        {expandedStrengths.has(i) && (
                          <p className="text-sm text-brand-text/40 italic leading-snug mt-1.5">{s.framing_language}</p>
                        )}
                        <button
                          onClick={() => toggleStrength(i)}
                          className="mt-1 text-xs text-brand-text/35 hover:text-brand-text/60 transition-colors"
                        >
                          {expandedStrengths.has(i) ? "Hide ↑" : "See framing →"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Recruiter Concern to Preempt ── */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-status-tailor">
                    ⚑ Recruiter Concern to Preempt
                  </p>
                  <CopyButton getText={() => `Concern: ${result.recruiter_concern_to_preempt.concern}\n\nHow to address it: ${result.recruiter_concern_to_preempt.suggested_response}`} />
                </div>
                <div className="bg-status-tailor/10 rounded-2xl p-5 border border-status-tailor/40 space-y-3">
                  <div>
                    <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-status-tailor mb-1">
                      Likely concern
                    </p>
                    <p className="text-base text-brand-text">{result.recruiter_concern_to_preempt.concern}</p>
                  </div>
                  <div>
                    <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-status-tailor mb-1">
                      How to address it
                    </p>
                    <p className="text-base text-brand-text">{result.recruiter_concern_to_preempt.suggested_response}</p>
                  </div>
                </div>
              </div>

              {/* ── JD Language to Mirror ── */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40">JD Language to Mirror</p>
                  <CopyButton getText={() => result.jd_language_to_mirror.map((p) => `"${p.phrase}"\n  ${p.context}`).join("\n\n")} />
                </div>
                <div className="space-y-2.5">
                  {result.jd_language_to_mirror.map((p, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block bg-brand-text/5 text-brand-text text-base font-medium px-3 py-1 rounded-lg ring-1 ring-brand-text/12">
                          &ldquo;{p.phrase}&rdquo;
                        </span>
                        <CopyButton getText={() => p.phrase} />
                        <button
                          onClick={() => togglePhrase(i)}
                          className="text-xs text-brand-text/35 hover:text-brand-text/60 transition-colors"
                        >
                          {expandedPhrases.has(i) ? "Hide ↑" : "Why →"}
                        </button>
                      </div>
                      {expandedPhrases.has(i) && (
                        <p className="mt-1.5 text-sm text-brand-text/40 leading-snug">{p.context}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── What to De-emphasize ── */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40">What to De-emphasize</p>
                  <CopyButton getText={() => result.what_to_deemphasize.map((d) => `• ${d.item}\n  Reason: ${d.reason}`).join("\n\n")} />
                </div>
                <div className="space-y-2.5">
                  {result.what_to_deemphasize.map((d, i) => (
                    <div key={i} className="border-l-2 border-status-tailor/40 pl-3.5">
                      <p className="text-base font-medium text-brand-text">{d.item}</p>
                      <p className="text-sm text-brand-text/40 mt-0.5 leading-snug">{d.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Outreach Angle ── */}
              {result.outreach_angle && (
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40">Outreach Angle</p>
                    <CopyButton getText={() => result.outreach_angle!} />
                  </div>
                  <p className="text-base text-brand-text/80 leading-relaxed">{result.outreach_angle}</p>
                </div>
              )}

            </div>
          )}

          {/* Cover Letter — only shown after brief is built */}
          {result && (
            <>
              {!coverLetterResult && !isGeneratingCoverLetter && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 bg-brand-accent rounded-full" />
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-accent">Start here</p>
                </div>
              )}
              <ActionSection
                title="Cover Letter"
                description="A tailored cover letter built from the brief above."
                buttonLabel="Draft Cover Letter"
                onAction={handleGenerateCoverLetter}
                isLoading={isGeneratingCoverLetter}
                loadingMessage="Drafting your cover letter…"
                hasResult={!!coverLetterResult}
                error={coverLetterError}
                noteValue={coverLetterNote}
                onNoteChange={setCoverLetterNote}
              >
                {coverLetterResult && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium tracking-[0.06em] uppercase text-brand-text/30">Cover Letter</p>
                      <PrimaryCopyButton getText={() => coverLetterResult.cover_letter} label="Copy letter" />
                    </div>
                    <div className="rounded-xl border border-brand-text/10 bg-[#faf9f7] p-6">
                      <pre className="text-base text-brand-text/85 leading-relaxed whitespace-pre-wrap font-sans">
                        {coverLetterResult.cover_letter}
                      </pre>
                    </div>
                  </div>
                )}
              </ActionSection>
            </>
          )}

          {/* Outreach — only shown after brief is built */}
          {result && (
            !result.outreach_angle ? (
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
                noteValue={outreachNote}
                onNoteChange={setOutreachNote}
              >
                {outreachResult && (() => {
                  // Parse email: "Subject: …\n\nBody…"
                  const emailParts = outreachResult.email.split(/\n\n/);
                  const emailSubject = emailParts[0] ?? "";
                  const emailBody = emailParts.slice(1).join("\n\n");
                  const sentenceEnd = emailBody.search(/\.\s/);
                  const emailFirstSentence = sentenceEnd >= 0 ? emailBody.slice(0, sentenceEnd + 1) : emailBody;

                  // LinkedIn: first sentence
                  const liSentenceEnd = outreachResult.linkedin_message.search(/\.\s/);
                  const linkedInFirstSentence = liSentenceEnd >= 0 ? outreachResult.linkedin_message.slice(0, liSentenceEnd + 1) : outreachResult.linkedin_message;

                  return (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium tracking-[0.06em] uppercase text-brand-text/30">Cold Email</p>
                          <PrimaryCopyButton getText={() => outreachResult.email} label="Copy email" />
                        </div>
                        <p className="text-sm font-medium text-brand-text/50 mb-1">{emailSubject}</p>
                        {emailExpanded ? (
                          <pre className="text-base text-brand-text/80 leading-relaxed whitespace-pre-wrap font-sans">
                            {emailBody}
                          </pre>
                        ) : (
                          <p className="text-base text-brand-text/80 leading-relaxed">{emailFirstSentence}{emailFirstSentence !== emailBody ? "…" : ""}</p>
                        )}
                        <button
                          onClick={() => setEmailExpanded(p => !p)}
                          className="mt-2 text-xs text-brand-text/35 hover:text-brand-text/60 transition-colors"
                        >
                          {emailExpanded ? "Collapse ↑" : "Read full message →"}
                        </button>
                      </div>
                      <div className="border-t border-brand-text/8 pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium tracking-[0.06em] uppercase text-brand-text/30">LinkedIn Message</p>
                          <PrimaryCopyButton getText={() => outreachResult.linkedin_message} label="Copy message" />
                        </div>
                        {linkedInExpanded ? (
                          <p className="text-base text-brand-text/80 leading-relaxed">{outreachResult.linkedin_message}</p>
                        ) : (
                          <p className="text-base text-brand-text/80 leading-relaxed">{linkedInFirstSentence}{linkedInFirstSentence !== outreachResult.linkedin_message ? "…" : ""}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={() => setLinkedInExpanded(p => !p)}
                            className="text-xs text-brand-text/35 hover:text-brand-text/60 transition-colors"
                          >
                            {linkedInExpanded ? "Collapse ↑" : "Read full message →"}
                          </button>
                          <p className="text-xs text-brand-text/35">{outreachResult.linkedin_message.length} / 280 characters</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </ActionSection>
            )
          )}

          {/* Resume Bullets — only shown after brief is built */}
          {result && (
            <ActionSection
              title="Resume Bullets"
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
                        .map((b) => `[${b.section}]\nOriginal: ${b.original}\nSuggested: ${b.suggested}\nWhat changed: ${b.what_changed}`)
                        .join("\n\n")}
                    />
                    <div className="space-y-4">
                      {resumeUpdateResult.bullet_updates.map((b, i) => (
                        <div key={i} className="space-y-1.5">
                          <p className="text-[0.75rem] font-medium tracking-[0.06em] uppercase text-brand-text/30">
                            {b.section}
                          </p>
                          <div className="rounded-xl overflow-hidden border border-brand-text/8">
                            {/* Suggested rewrite — shown by default */}
                            <div className="px-3.5 py-3 bg-white">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-base text-brand-text font-medium leading-snug flex-1">{b.suggested}</p>
                                <CopyButton getText={() => b.suggested} />
                              </div>
                              <button
                                onClick={() => toggleBullet(i)}
                                className="mt-2 text-xs text-brand-text/35 hover:text-brand-text/60 transition-colors"
                              >
                                {expandedBullets.has(i) ? "Hide original ↑" : "Compare with original →"}
                              </button>
                            </div>
                            {/* Original + What changed — collapsed by default */}
                            {expandedBullets.has(i) && (
                              <>
                                <div className="px-3.5 py-3 bg-brand-text/4 border-t border-brand-text/8">
                                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-brand-text/30 mb-1.5">Original</p>
                                  <p className="text-sm text-brand-text/55 leading-relaxed">{b.original}</p>
                                </div>
                                <div className="px-3.5 py-2.5 bg-brand-text/3 border-t border-brand-text/8">
                                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-brand-text/30 mb-1">What changed</p>
                                  <p className="text-sm text-brand-text/50 leading-relaxed">{b.what_changed}</p>
                                </div>
                              </>
                            )}
                          </div>
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
          )}

        </div>
      )}

      {/* ── Applied / Heard Back: Interview Prep + Company Research ── */}
      {appStage === "applied" && (
        <div className="space-y-5">

          {/* Interview Prep — requires brief */}
          {!result ? (
            <div className="bg-white rounded-2xl p-8 shadow text-center">
              <p className="text-base font-semibold text-brand-text">Build your prep guide first</p>
              <p className="text-base text-brand-text/50 mt-1 max-w-xs mx-auto">
                Head to &ldquo;Preparing to Apply&rdquo; to build your tailored brief, then come back for interview questions.
              </p>
              <button
                onClick={() => setAppStage("preparing")}
                className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
              >
                Go to Preparing to Apply →
              </button>
            </div>
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
                <div className="space-y-3">
                  {interviewPrepResult.questions.map((q, i) => (
                    <div key={i} className="rounded-xl ring-1 ring-brand-text/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedQuestions(prev => {
                          const next = new Set(prev);
                          if (next.has(i)) { next.delete(i); } else { next.add(i); }
                          return next;
                        })}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-brand-text/2 transition-colors bg-white"
                      >
                        <p className="text-base font-semibold text-brand-text pr-4 leading-snug">{q.question}</p>
                        <svg
                          className={`shrink-0 w-4 h-4 text-brand-text/30 transition-transform ${expandedQuestions.has(i) ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedQuestions.has(i) && (
                        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-brand-text/8 bg-white">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.06em] text-brand-text/30 mb-1.5">
                              Why likely
                            </p>
                            <p className="text-base text-brand-text/60 leading-relaxed">{q.why_likely}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.06em] text-brand-text/30 mb-1.5">
                              Suggested approach
                            </p>
                            <p className="text-base text-brand-text/80 leading-relaxed">{q.suggested_approach}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ActionSection>
          )}

          {/* Company Research — always available, no brief needed */}
          <ActionSection
            title="Company Research"
            description="What we know, what we're reading into, and questions to test your hypotheses in the interview."
            buttonLabel="Research Company"
            onAction={handleGenerateCompanyResearch}
            isLoading={isGeneratingCompanyResearch}
            loadingMessage="Researching the company…"
            hasResult={!!companyResearchResult}
            error={companyResearchError}
          >
            {cr && (
              <>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-base font-semibold text-brand-text">{cr.company_name}</p>
                    <span className="shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.07em] px-2 py-0.5 rounded-full bg-brand-text/6 text-brand-text/40">
                      {cr.what_we_know.sources}
                    </span>
                  </div>
                  <p className="text-base text-brand-text/70 leading-relaxed">{cr.what_we_know.summary}</p>
                </div>

                {cr.caveat && (
                  <div className="rounded-xl bg-status-stretch/8 ring-1 ring-status-stretch/20 px-4 py-3">
                    <p className="text-sm text-status-stretch leading-snug">{cr.caveat}</p>
                  </div>
                )}

                {cr.what_we_re_reading.length > 0 && (
                  <div className="border-t border-brand-text/8 pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <SubHeading label="What We're Reading" />
                      <span className="text-[0.65rem] font-medium uppercase tracking-[0.07em] px-2 py-0.5 rounded-full bg-brand-accent/8 text-brand-accent/70">
                        Interpretation
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {cr.what_we_re_reading.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-base text-brand-text/60 italic leading-relaxed">
                          <span className="mt-2 w-1 h-1 rounded-full bg-brand-text/20 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cr.culture_signals.length > 0 && (
                  <div className="border-t border-brand-text/8 pt-6">
                    <SubHeading label="Culture Signals" />
                    <ul className="space-y-1.5">
                      {cr.culture_signals.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-base text-brand-text/70">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-text/30 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cr.red_flags_to_probe.length > 0 && (
                  <div className="border-t border-brand-text/8 pt-6">
                    <SubHeading label="Worth Probing" />
                    <div className="space-y-3">
                      {cr.red_flags_to_probe.map((f, i) => (
                        <div key={i} className="rounded-xl bg-status-stretch/6 ring-1 ring-status-stretch/15 px-4 py-3 space-y-1">
                          <p className="text-sm font-medium text-status-stretch">{f.flag}</p>
                          <p className="text-sm text-brand-text/50">{f.how_to_probe}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-brand-text/8 pt-6">
                  <SubHeading
                    label="Questions to Test"
                    copyText={cr.questions_to_test
                      .map((q) => `Q: ${q.question}\nProbing: ${q.what_youre_probing}`)
                      .join("\n\n")}
                  />
                  <div className="space-y-4">
                    {cr.questions_to_test.map((q, i) => (
                      <div key={i} className="border-l-2 border-brand-accent/30 pl-3.5">
                        <p className="text-base font-medium text-brand-text">{q.question}</p>
                        <p className="text-sm text-brand-text/40 mt-0.5">{q.what_youre_probing}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </ActionSection>

        </div>
      )}

      {/* ── Post-Interview: Follow-Up ── */}
      {appStage === "post-interview" && (
        <div className="space-y-5">

          {!result ? (
            <div className="bg-white rounded-2xl p-8 shadow text-center">
              <p className="text-base font-semibold text-brand-text">Build your prep guide first</p>
              <p className="text-base text-brand-text/50 mt-1 max-w-xs mx-auto">
                Head to &ldquo;Preparing to Apply&rdquo; to build your tailored brief, then come back for follow-up templates.
              </p>
              <button
                onClick={() => setAppStage("preparing")}
                className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
              >
                Go to Preparing to Apply →
              </button>
            </div>
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
          )}

        </div>
      )}

    </div>
  );
}
