"use client";

import { useState } from "react";
import LoadingState from "./LoadingState";
import type { TailoringBriefResult } from "@/types";

interface TailoringBriefProps {
  profileText: string;
  jobDescription: string;
  result: TailoringBriefResult | null;
  onResultChange: (result: TailoringBriefResult) => void;
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
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600">Copied</span>
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
    <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
        <CopyButton getText={() => copyText} />
      </div>
      {children}
    </div>
  );
}

export default function TailoringBrief({
  profileText,
  jobDescription,
  result,
  onResultChange,
  onGoToProfile,
  onGoToJobFit,
}: TailoringBriefProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  if (!profileText) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-gray-900">Profile required</p>
        <p className="text-sm text-gray-400 mt-1">Upload your resume in the Profile tab first.</p>
        <button
          onClick={onGoToProfile}
          className="mt-5 inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
        >
          Go to Profile →
        </button>
      </div>
    );
  }

  if (!jobDescription) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-gray-900">Score a job first</p>
        <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
          Score a job in the Job Fit tab, then come back to generate your tailoring brief.
        </p>
        <button
          onClick={onGoToJobFit}
          className="mt-5 inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
        >
          Go to Job Fit →
        </button>
      </div>
    );
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
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

  return (
    <div className="space-y-4">
      {/* Generate button */}
      {!isGenerating && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {result ? "Re-generate to refresh the brief." : "Claude will build a targeted brief for this specific job."}
          </p>
          <button
            onClick={handleGenerate}
            className="shrink-0 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            {result ? "Re-generate" : "Generate Brief"}
          </button>
        </div>
      )}

      {isGenerating && <LoadingState message="Generating your tailoring brief — this takes 10–20 seconds…" />}

      {error && !isGenerating && (
        <div className="p-4 bg-red-50 rounded-xl ring-1 ring-red-100">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={handleGenerate} className="mt-1 text-xs text-red-500 underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {result && !isGenerating && (
        <>
          {/* Lead strengths */}
          <Section
            title="Lead Strengths to Emphasize"
            copyText={result.lead_strengths.map((s) => `• ${s.strength}\n  → ${s.framing_language}`).join("\n\n")}
          >
            <div className="space-y-3">
              {result.lead_strengths.map((s, i) => (
                <div key={i} className="border-l-2 border-blue-200 pl-3.5">
                  <p className="text-sm font-medium text-gray-800">{s.strength}</p>
                  <p className="text-sm text-gray-400 mt-0.5 italic">{s.framing_language}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* JD language */}
          <Section
            title="JD Language to Mirror"
            copyText={result.jd_language_to_mirror.map((p) => `"${p.phrase}"\n  ${p.context}`).join("\n\n")}
          >
            <div className="space-y-3">
              {result.jd_language_to_mirror.map((p, i) => (
                <div key={i}>
                  <span className="inline-block bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1 rounded-lg ring-1 ring-slate-200">
                    &ldquo;{p.phrase}&rdquo;
                  </span>
                  <p className="mt-1.5 text-xs text-gray-400 leading-snug">{p.context}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* De-emphasize */}
          <Section
            title="What to De-emphasize"
            copyText={result.what_to_deemphasize.map((d) => `• ${d.item}\n  Reason: ${d.reason}`).join("\n\n")}
          >
            <div className="space-y-3">
              {result.what_to_deemphasize.map((d, i) => (
                <div key={i} className="border-l-2 border-amber-200 pl-3.5">
                  <p className="text-sm font-medium text-gray-800">{d.item}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{d.reason}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Recruiter concern */}
          <Section
            title="Recruiter Concern to Preempt"
            copyText={`Concern: ${result.recruiter_concern_to_preempt.concern}\n\nHow to address it: ${result.recruiter_concern_to_preempt.suggested_response}`}
          >
            <div className="space-y-2">
              <div className="bg-amber-50 rounded-xl p-4 ring-1 ring-amber-100">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">
                  Likely concern
                </p>
                <p className="text-sm text-amber-900">{result.recruiter_concern_to_preempt.concern}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 ring-1 ring-green-100">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-1">
                  How to address it
                </p>
                <p className="text-sm text-green-900">{result.recruiter_concern_to_preempt.suggested_response}</p>
              </div>
            </div>
          </Section>

          {/* Outreach angle */}
          {result.outreach_angle && (
            <Section
              title="Outreach Angle"
              copyText={result.outreach_angle}
            >
              <p className="text-sm text-gray-700 leading-relaxed">{result.outreach_angle}</p>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
