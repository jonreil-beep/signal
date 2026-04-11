"use client";

import { useState, useEffect, useRef } from "react";
import LoadingState from "./LoadingState";
import TypingIndicator from "./TypingIndicator";
import { useToast } from "./ToastProvider";
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
  const { showToast } = useToast();
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      showToast();
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silently fail */ }
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
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
  const { showToast } = useToast();
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      showToast();
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silently fail */ }
  }
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-[500] transition-colors ${
        copied
          ? "bg-status-apply/10 text-status-apply"
          : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#374151]"
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
    <div className="bg-white rounded-xl p-7" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-[500] uppercase tracking-[0.05em] text-[#6B7280]">{title}</p>
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
    <div className={`${bgClass} rounded-xl overflow-hidden`} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-[12px] font-[500] uppercase tracking-[0.05em] text-[#111827]">{title}</p>
        {!isLoading && (
          <button
            onClick={onAction}
            className="shrink-0 text-[14px] font-[500] text-[#2563EB] hover:text-[#4338CA] transition-colors"
          >
            {hasResult ? "Re-generate →" : `${buttonLabel} →`}
          </button>
        )}
      </div>

      {/* Body */}
      {!hasResult && !isLoading && !error && (
        <p className="px-5 pb-4 -mt-1 text-[14px] text-[#9CA3AF]">{description}</p>
      )}

      {isLoading && (
        <div className="px-5 pb-5">
          <TypingIndicator message={loadingMessage} />
        </div>
      )}

      {error && !isLoading && (
        <div className="px-5 pb-4 -mt-1 space-y-2.5">
          <p className="text-[14px] text-red-700">{error}</p>
          <button
            onClick={onAction}
            className="px-3.5 py-1.5 text-[14px] font-[500] border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {hasResult && !isLoading && (
        <div className="border-t border-[#E5E7EB] px-5 py-5 space-y-6">
          {children}
          {/* Correction / tone note — shown after a result so user can refine before regenerating */}
          {noteValue !== undefined && onNoteChange && (
            <div className="border-t border-[#E5E7EB] pt-4 space-y-2">
              <p className="text-[12px] font-[500] uppercase tracking-[0.05em] text-[#6B7280]">
                Anything to correct or adjust?
              </p>
              <textarea
                value={noteValue}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder='e.g. "Make it more direct" or "I was VP level, not Director"'
                maxLength={300}
                rows={2}
                className="w-full text-[14px] text-[#374151] bg-[#F9FAFB] rounded-xl px-3 py-2.5 resize-none border border-[#E5E7EB] focus:border-[#2563EB] focus:outline-none focus:ring-0 placeholder:text-[#9CA3AF] leading-relaxed transition-colors"
              />
              <div className="flex justify-end">
                <button
                  onClick={onAction}
                  className="text-[14px] font-[500] text-[#2563EB] hover:text-[#4338CA] transition-colors"
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
      <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">{label}</p>
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
        <p className="text-base font-[500] text-[#111827]">Profile required</p>
        <p className="text-sm text-[#9CA3AF] mt-2">Upload your resume in the Profile tab first.</p>
        <button
          onClick={onGoToProfile}
          className="mt-5 inline-flex items-center gap-1 px-5 py-2 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[14px] font-[500] rounded-full hover:from-[#3A3A3C] hover:to-[#242424] transition-colors"
        >
          Go to Profile →
        </button>
      </div>
    );
  }

  if (!jobDescription) {
    return (
      <div className="text-center py-20">
        <p className="text-[14px] font-[500] text-[#111827]">Score a job first</p>
        <p className="text-[14px] text-[#9CA3AF] mt-1 max-w-xs mx-auto">
          Score a job in the Job Fit tab, then come back to generate your prep.
        </p>
        <button
          onClick={onGoToJobFit}
          className="mt-5 inline-flex items-center gap-1 px-5 py-2 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[14px] font-[500] rounded-full hover:from-[#3A3A3C] hover:to-[#242424] transition-colors"
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
        setTimeout(() => {
          document.getElementById("prep-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
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
    <div className="space-y-6">

      {/* ── Stage selector ── */}
      <div className="my-2 flex w-full rounded-full bg-[#F3F4F6] p-1">
        {APPLICATION_STAGES.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setAppStage(stage.id)}
            className={`flex-1 rounded-full px-2 sm:px-4 py-2 sm:py-2.5 text-center text-[11px] sm:text-[14px] transition-all duration-150 focus:outline-none focus:ring-0 ${
              appStage === stage.id
                ? "bg-white font-[500] text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                : "font-[400] text-[#9CA3AF] hover:bg-white/50 hover:text-[#6B7280]"
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* ── Honest Take — always visible when brief is built, across all stages ── */}
      {result?.honest_take && (
        <div id="prep-result" className="hero-card-animated relative overflow-hidden rounded-xl result-scroll-target honest-take-entrance" style={{ padding: "28px 32px" }}>
          {/* Atmospheric glow */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(29,78,216,0.15) 0%, transparent 70%)" }} />
          <p className="relative text-[11px] font-[500] uppercase tracking-[0.05em] mb-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            Honest Take
          </p>
          <p className="relative text-[14px] font-[400] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{result.honest_take}</p>
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
                  className="w-full text-[14px] text-[#374151] bg-[#F9FAFB] rounded-xl px-3 py-2.5 resize-none border border-[#E5E7EB] focus:border-[#2563EB] focus:outline-none focus:ring-0 placeholder:text-[#9CA3AF] leading-relaxed transition-all"
                />
              )}
              <div className="flex justify-end gap-2">
                {hasAnyContent && (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-5 py-2 border border-[#D1D5DB] text-[#6B7280] text-[14px] font-[500] rounded-full hover:border-[#9CA3AF] hover:text-[#374151] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>
                )}
                <button
                  onClick={handleGenerate}
                  className="px-5 py-2 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[14px] font-[500] rounded-full hover:from-[#3A3A3C] hover:to-[#242424] transition-colors"
                >
                  {result ? "Rebuild" : "Build Prep Guide"}
                </button>
              </div>
            </div>
          )}

          {isGenerating && <TypingIndicator message="Building your prep guide. This takes about 20 seconds…" />}

          {error && !isGenerating && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-[14px] text-red-700">{error}</p>
              <button onClick={handleGenerate} className="mt-1 text-[13px] text-red-500 underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          {/* Profile staleness banner */}
          {isProfileStale && result && !isGenerating && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[rgba(176,144,110,0.06)] rounded-xl border border-[rgba(176,144,110,0.15)]">
              <p className="text-[14px] text-[#374151]">Your profile was updated after this score — re-score the job first, then rebuild your prep guide.</p>
              <button
                onClick={onGoToJobFit}
                className="shrink-0 text-[14px] font-[500] text-[#B0906E] hover:text-[#B0906E]/70 transition-colors whitespace-nowrap"
              >
                Re-score →
              </button>
            </div>
          )}

          {/* Brief results */}
          {!result && !isGenerating && (
            <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
              <p className="text-[14px] font-[500] text-[#111827]">No brief yet</p>
              <p className="text-[14px] text-[#9CA3AF] mt-1">Hit &ldquo;Build Prep Guide&rdquo; to generate your tailored brief.</p>
            </div>
          )}

          {/* Two-column layout when brief is built */}
          {result && !isGenerating && (
            <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-5">

              {/* Left column — Brief sections */}
              <div className="bg-white rounded-xl overflow-hidden divide-y divide-[#E5E7EB]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>

                {/* ── Lead Strengths ── */}
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">Lead Strengths to Emphasize</p>
                    <CopyButton getText={() => result.lead_strengths.map((s) => `• [${s.match_type ?? ""}] ${s.strength}\n  → ${s.framing_language}`).join("\n\n")} />
                  </div>
                  <div className="space-y-3">
                    {result.lead_strengths.map((s, i) => {
                      const matchStyle = s.match_type ? MATCH_TYPE_STYLES[s.match_type] : null;
                      return (
                        <div key={i} className="border-l-2 border-[#2563EB]/30 pl-3.5">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-[500] text-[#111827]">{s.strength}</p>
                            {matchStyle && (
                              <span className={`shrink-0 text-[0.65rem] font-[500] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full ${matchStyle}`}>
                                {s.match_type}
                              </span>
                            )}
                          </div>
                          {expandedStrengths.has(i) && (
                            <p className="text-[13px] text-[#6B7280] italic leading-snug mt-1.5">{s.framing_language}</p>
                          )}
                          <button
                            onClick={() => toggleStrength(i)}
                            className="mt-1 text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
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
                    <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#7C8B9A]">
                      ▸ Recruiter Concern to Preempt
                    </p>
                    <CopyButton getText={() => `Concern: ${result.recruiter_concern_to_preempt.concern}\n\nHow to address it: ${result.recruiter_concern_to_preempt.suggested_response}`} />
                  </div>
                  <div className="rounded-xl p-5 space-y-3" style={{ background: "rgba(124,139,154,0.04)", boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
                    <div>
                      <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#7C8B9A] mb-1">
                        Likely concern
                      </p>
                      <p className="text-[14px] text-[#374151]">{result.recruiter_concern_to_preempt.concern}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#7C8B9A] mb-1">
                        How to address it
                      </p>
                      <p className="text-[14px] text-[#374151]">{result.recruiter_concern_to_preempt.suggested_response}</p>
                    </div>
                  </div>
                </div>

                {/* ── JD Language to Mirror ── */}
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">JD Language to Mirror</p>
                    <CopyButton getText={() => result.jd_language_to_mirror.map((p) => `"${p.phrase}"\n  ${p.context}`).join("\n\n")} />
                  </div>
                  <div className="space-y-2.5">
                    {result.jd_language_to_mirror.map((p, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-block bg-[#F3F4F6] text-[#374151] text-[14px] font-[500] px-2.5 py-1 rounded-md">
                            &ldquo;{p.phrase}&rdquo;
                          </span>
                          <CopyButton getText={() => p.phrase} />
                          <button
                            onClick={() => togglePhrase(i)}
                            className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                          >
                            {expandedPhrases.has(i) ? "Hide ↑" : "Why →"}
                          </button>
                        </div>
                        {expandedPhrases.has(i) && (
                          <p className="mt-1.5 text-[13px] text-[#6B7280] leading-snug">{p.context}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── What to De-emphasize ── */}
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">What to De-emphasize</p>
                    <CopyButton getText={() => result.what_to_deemphasize.map((d) => `• ${d.item}\n  Reason: ${d.reason}`).join("\n\n")} />
                  </div>
                  <div className="space-y-2.5">
                    {result.what_to_deemphasize.map((d, i) => (
                      <div key={i} className="border-l-2 border-[rgba(124,139,154,0.40)] pl-3.5">
                        <p className="text-[14px] font-[500] text-[#111827]">{d.item}</p>
                        <p className="text-[13px] text-[#6B7280] mt-0.5 leading-snug">{d.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Outreach Angle ── */}
                {result.outreach_angle && (
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">Outreach Angle</p>
                      <CopyButton getText={() => result.outreach_angle!} />
                    </div>
                    <p className="text-[14px] text-[#374151] leading-[1.7]">{result.outreach_angle}</p>
                  </div>
                )}

              </div>

              {/* Right column — Cover Letter + Outreach + Resume Bullets */}
              <div className="space-y-5">
                {/* Cover Letter */}
                {!coverLetterResult && !isGeneratingCoverLetter && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-4 bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] rounded-full" />
                    <p className="text-xs font-[500] uppercase tracking-[0.08em] text-[#2563EB]">Start here</p>
                  </div>
                )}
                <ActionSection
                  title="Cover Letter"
                  description="A tailored cover letter built from the brief."
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
                        <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">Cover Letter</p>
                        <PrimaryCopyButton getText={() => coverLetterResult.cover_letter} label="Copy letter" />
                      </div>
                      <div className="rounded-xl border border-[#E2E2E8] bg-white p-6">
                        <pre className="text-[14px] text-[#374151] leading-[1.7] whitespace-pre-wrap font-sans">
                          {coverLetterResult.cover_letter}
                        </pre>
                      </div>
                    </div>
                  )}
                </ActionSection>

                {/* Outreach */}
                {!result.outreach_angle ? (
                  <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
                    <p className="text-[14px] font-[500] text-[#111827]">No outreach angle in brief</p>
                    <p className="text-[14px] text-[#9CA3AF] mt-1 max-w-xs mx-auto">
                      The brief for this job didn&apos;t surface an outreach angle. Try rebuilding the prep guide.
                    </p>
                    <button
                      onClick={handleGenerate}
                      className="mt-5 inline-flex items-center gap-1 px-5 py-2 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[14px] font-[500] rounded-full hover:from-[#3A3A3C] hover:to-[#242424] transition-colors"
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
                              <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">Cold Email</p>
                              <PrimaryCopyButton getText={() => outreachResult.email} label="Copy email" />
                            </div>
                            <p className="text-[14px] font-[500] text-[#6B7280] mb-1">{emailSubject}</p>
                            {emailExpanded ? (
                              <pre className="text-[14px] text-[#374151] leading-[1.7] whitespace-pre-wrap font-sans">
                                {emailBody}
                              </pre>
                            ) : (
                              <p className="text-[14px] text-[#374151] leading-[1.7]">{emailFirstSentence}{emailFirstSentence !== emailBody ? "…" : ""}</p>
                            )}
                            <button
                              onClick={() => setEmailExpanded(p => !p)}
                              className="mt-2 text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                            >
                              {emailExpanded ? "Collapse ↑" : "Read full message →"}
                            </button>
                          </div>
                          <div className="border-t border-[#E5E7EB] pt-6">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">LinkedIn Message</p>
                              <PrimaryCopyButton getText={() => outreachResult.linkedin_message} label="Copy message" />
                            </div>
                            {linkedInExpanded ? (
                              <p className="text-[14px] text-[#374151] leading-[1.7]">{outreachResult.linkedin_message}</p>
                            ) : (
                              <p className="text-[14px] text-[#374151] leading-[1.7]">{linkedInFirstSentence}{linkedInFirstSentence !== outreachResult.linkedin_message ? "…" : ""}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <button
                                onClick={() => setLinkedInExpanded(p => !p)}
                                className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                              >
                                {linkedInExpanded ? "Collapse ↑" : "Read full message →"}
                              </button>
                              <p className="text-xs text-[#9CA3AF]">{outreachResult.linkedin_message.length} / 280 characters</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </ActionSection>
                )}

                {/* Resume Bullets */}
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
                        <p className="text-[14px] text-[#374151] leading-[1.7]">{resumeUpdateResult.summary_rewrite}</p>
                      </div>

                      <div className="border-t border-[#E5E7EB] pt-6">
                        <SubHeading
                          label="Resume Bullets to Update"
                          copyText={resumeUpdateResult.bullet_updates
                            .map((b) => `[${b.section}]\nOriginal: ${b.original}\nSuggested: ${b.suggested}\nWhat changed: ${b.what_changed}`)
                            .join("\n\n")}
                        />
                        <div className="space-y-4">
                          {resumeUpdateResult.bullet_updates.map((b, i) => (
                            <div key={i} className="space-y-1.5">
                              <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">
                                {b.section}
                              </p>
                              <div className="rounded-xl overflow-hidden border border-[#E5E7EB]">
                                {/* Suggested rewrite — shown by default */}
                                <div className="px-3.5 py-3 bg-white">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-[14px] text-[#374151] leading-snug flex-1">{b.suggested}</p>
                                    <CopyButton getText={() => b.suggested} />
                                  </div>
                                  <button
                                    onClick={() => toggleBullet(i)}
                                    className="mt-2 text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                                  >
                                    {expandedBullets.has(i) ? "Hide original ↑" : "Compare with original →"}
                                  </button>
                                </div>
                                {/* Original + What changed — collapsed by default */}
                                {expandedBullets.has(i) && (
                                  <>
                                    <div className="px-3.5 py-3 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                                      <p className="text-[0.7rem] font-[500] uppercase tracking-[0.07em] text-[#9CA3AF] mb-1.5">Original</p>
                                      <p className="text-[13px] text-[#6B7280] leading-relaxed">{b.original}</p>
                                    </div>
                                    <div className="px-3.5 py-2.5 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                                      <p className="text-[0.7rem] font-[500] uppercase tracking-[0.07em] text-[#9CA3AF] mb-1">What changed</p>
                                      <p className="text-[13px] text-[#6B7280] leading-relaxed">{b.what_changed}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[#E5E7EB] pt-6">
                        <SubHeading
                          label="Keywords to Weave In"
                          copyText={resumeUpdateResult.keywords_to_weave_in
                            .map((k) => `"${k.keyword}" — ${k.suggested_context}`)
                            .join("\n")}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "12px 16px", alignItems: "start" }}>
                          {resumeUpdateResult.keywords_to_weave_in.flatMap((k, i) => [
                            <span key={`pill-${i}`} className="inline-block bg-[#F3F4F6] text-[#374151] text-[14px] font-[500] px-2.5 py-1 rounded-md justify-self-start">
                              {k.keyword}
                            </span>,
                            <p key={`desc-${i}`} className="text-[14px] text-[#6B7280] leading-snug mt-1">{k.suggested_context}</p>,
                          ])}
                        </div>
                      </div>
                    </>
                  )}
                </ActionSection>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Applied / Heard Back: Interview Prep + Company Research ── */}
      {appStage === "applied" && (
        <>
          {/* No brief yet — single centered prompt */}
          {!result ? (
            <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
              <p className="text-[14px] font-[500] text-[#111827]">Build your prep guide first</p>
              <p className="text-[14px] text-[#9CA3AF] mt-1 max-w-xs mx-auto">
                Head to &ldquo;Preparing to Apply&rdquo; to build your tailored brief, then come back for interview questions.
              </p>
              <button
                onClick={() => setAppStage("preparing")}
                className="mt-5 inline-flex items-center gap-1 px-5 py-2 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[14px] font-[500] rounded-full hover:from-[#3A3A3C] hover:to-[#242424] transition-colors"
              >
                Go to Preparing to Apply →
              </button>
            </div>
          ) : (
            /* Two-column: left = interview prep, right = company research */
            <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-5">

              {/* Left column — Interview Prep */}
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
                      <div key={i} className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                        <button
                          onClick={() => setExpandedQuestions(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) { next.delete(i); } else { next.add(i); }
                            return next;
                          })}
                          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#F9FAFB] transition-colors bg-white"
                        >
                          <p className="text-[14px] font-[500] text-[#111827] pr-4 leading-snug">{q.question}</p>
                          <svg
                            className={`shrink-0 w-4 h-4 text-[#9CA3AF] transition-transform ${expandedQuestions.has(i) ? "rotate-180" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {expandedQuestions.has(i) && (
                          <div className="px-4 pb-4 pt-3 space-y-3 border-t border-[#E5E7EB] bg-white">
                            <div>
                              <p className="text-[12px] font-[500] uppercase tracking-[0.05em] text-[#6B7280] mb-1.5">
                                Why likely
                              </p>
                              <p className="text-[13px] text-[#6B7280] leading-relaxed">{q.why_likely}</p>
                            </div>
                            <div>
                              <p className="text-[12px] font-[500] uppercase tracking-[0.05em] text-[#6B7280] mb-1.5">
                                Suggested approach
                              </p>
                              <p className="text-[14px] text-[#374151] leading-relaxed">{q.suggested_approach}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ActionSection>

              {/* Right column — Company Research */}
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
                      <div className="mb-2">
                        <p className="text-[14px] font-[500] text-[#111827]">{cr.company_name}</p>
                        <p className="text-[12px] font-[500] uppercase tracking-[0.05em] text-[#6B7280] mt-0.5" style={{ whiteSpace: "normal" }}>
                          {cr.what_we_know.sources}
                        </p>
                      </div>
                      <p className="text-[14px] text-[#374151] leading-relaxed">{cr.what_we_know.summary}</p>
                    </div>

                    {cr.caveat && (
                      <div className="rounded-xl bg-[rgba(176,144,110,0.05)] border border-[rgba(176,144,110,0.15)] px-4 py-3">
                        <p className="text-[13px] text-[#B0906E] leading-snug">{cr.caveat}</p>
                      </div>
                    )}

                    {cr.what_we_re_reading.length > 0 && (
                      <div className="border-t border-[#E5E7EB] pt-6">
                        <div className="mb-3">
                          <SubHeading label="What We're Reading" />
                        </div>
                        <ul className="space-y-2">
                          {cr.what_we_re_reading.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-[14px] text-[#6B7280] italic leading-relaxed">
                              <span className="mt-2 w-1 h-1 rounded-full bg-[#9CA3AF] shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cr.culture_signals.length > 0 && (
                      <div className="border-t border-[#E5E7EB] pt-6">
                        <SubHeading label="Culture Signals" />
                        <ul className="space-y-1.5">
                          {cr.culture_signals.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-[14px] text-[#374151]">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#9CA3AF] shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cr.red_flags_to_probe.length > 0 && (
                      <div className="border-t border-[#E5E7EB] pt-6">
                        <SubHeading label="Worth Probing" />
                        <div className="space-y-3">
                          {cr.red_flags_to_probe.map((f, i) => (
                            <div key={i} className="rounded-xl bg-[rgba(176,144,110,0.04)] border border-[rgba(176,144,110,0.12)] px-4 py-3 space-y-1">
                              <p className="text-[13px] font-[500] text-[#B0906E]">{f.flag}</p>
                              <p className="text-[13px] text-[#6B7280]">{f.how_to_probe}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[#E5E7EB] pt-6">
                      <SubHeading
                        label="Questions to Test"
                        copyText={cr.questions_to_test
                          .map((q) => `Q: ${q.question}\nProbing: ${q.what_youre_probing}`)
                          .join("\n\n")}
                      />
                      <div className="space-y-4">
                        {cr.questions_to_test.map((q, i) => (
                          <div key={i} className="border-l-2 border-[#2563EB]/30 pl-3.5">
                            <p className="text-[14px] font-[500] text-[#111827]">{q.question}</p>
                            <p className="text-[13px] text-[#6B7280] mt-0.5">{q.what_youre_probing}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </ActionSection>
            </div>
          )}
        </>
      )}

      {/* ── Post-Interview: Follow-Up ── */}
      {appStage === "post-interview" && (
        <div className="space-y-5">

          {!result ? (
            <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
              <p className="text-[14px] font-[500] text-[#111827]">Build your prep guide first</p>
              <p className="text-[14px] text-[#9CA3AF] mt-1 max-w-xs mx-auto">
                Head to &ldquo;Preparing to Apply&rdquo; to build your tailored brief, then come back for follow-up templates.
              </p>
              <button
                onClick={() => setAppStage("preparing")}
                className="mt-5 inline-flex items-center gap-1 px-5 py-2 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[14px] font-[500] rounded-full hover:from-[#3A3A3C] hover:to-[#242424] transition-colors"
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
                    <pre className="text-[14px] text-[#374151] leading-[1.7] whitespace-pre-wrap font-sans">
                      {followUpResult.thank_you_note}
                    </pre>
                  </div>
                  <div className="border-t border-[#E5E7EB] pt-6">
                    <SubHeading label="Check-In Email" copyText={followUpResult.check_in_email} />
                    <pre className="text-[14px] text-[#374151] leading-[1.7] whitespace-pre-wrap font-sans">
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
