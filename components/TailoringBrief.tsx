"use client";

import { useState } from "react";
import LoadingState from "./LoadingState";
import type { TailoringBriefResult, OutreachResult, CoverLetterResult, ResumeUpdateResult, InterviewPrepResult } from "@/types";

interface TailoringBriefProps {
  profileText: string;
  jobDescription: string;
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
  onGoToProfile,
  onGoToJobFit,
}: TailoringBriefProps) {
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

  return (
    <div className="space-y-4">

      {/* ── Build Prep Guide button ── */}
      {!isGenerating && (
        <div className="flex items-center justify-between">
          <p className="text-base text-brand-text/40">
            {result ? "Rebuild to refresh with the latest job and profile." : "Signal will build targeted prep for this specific job."}
          </p>
          <button
            onClick={handleGenerate}
            className="shrink-0 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
          >
            {result ? "Rebuild" : "Build Prep Guide"}
          </button>
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

      {result && !isGenerating && (
        <>
          {/* ── Brief result cards ── */}
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

          {/* ── Resume Updates action card ── */}
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

          {/* ── Cover Letter action card ── */}
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

          {/* ── Outreach Messages action card ── */}
          {result.outreach_angle && (
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
          )}

          {/* ── Interview Prep action card ── */}
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
        </>
      )}
    </div>
  );
}
