"use client";

import { useState } from "react";
import LoadingState from "./LoadingState";
import type { TailoringBriefResult } from "@/types";

interface TailoringBriefProps {
  profileText: string;
  jobDescription: string;
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
    } catch {
      // Clipboard API not available — silently fail
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
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

export default function TailoringBrief({
  profileText,
  jobDescription,
  onGoToProfile,
  onGoToJobFit,
}: TailoringBriefProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<TailoringBriefResult | null>(null);

  // Guard: missing profile
  if (!profileText) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900">Profile required</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
          Upload your resume in the Profile tab first.
        </p>
        <button
          onClick={onGoToProfile}
          className="mt-4 text-sm text-blue-600 hover:underline font-medium"
        >
          Go to Profile →
        </button>
      </div>
    );
  }

  // Guard: missing JD
  if (!jobDescription) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900">Score a job first</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
          Score a job description in the Job Fit tab, then come back to generate your tailoring brief.
        </p>
        <button
          onClick={onGoToJobFit}
          className="mt-4 text-sm text-blue-600 hover:underline font-medium"
        >
          Go to Job Fit →
        </button>
      </div>
    );
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setResult(null);

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
        setResult(data as TailoringBriefResult);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Generate / Re-generate button */}
      {!isGenerating && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {result
              ? "Re-generate to refresh the brief."
              : "Claude will build a targeted brief for this specific job."}
          </p>
          <button
            onClick={handleGenerate}
            className="shrink-0 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            {result ? "Re-generate" : "Generate Brief"}
          </button>
        </div>
      )}

      {isGenerating && <LoadingState message="Generating your tailoring brief — this takes 10–20 seconds…" />}

      {error && !isGenerating && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={handleGenerate}
            className="mt-1 text-xs text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Brief output */}
      {result && !isGenerating && (
        <div className="space-y-4">

          {/* Lead strengths */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Lead Strengths to Emphasize
              </h3>
              <CopyButton
                getText={() =>
                  result.lead_strengths
                    .map((s) => `• ${s.strength}\n  → ${s.framing_language}`)
                    .join("\n\n")
                }
              />
            </div>
            <div className="space-y-3">
              {result.lead_strengths.map((s, i) => (
                <div key={i} className="border-l-2 border-blue-300 pl-3">
                  <p className="text-sm font-medium text-gray-800">{s.strength}</p>
                  <p className="text-sm text-gray-500 mt-0.5 italic">{s.framing_language}</p>
                </div>
              ))}
            </div>
          </div>

          {/* JD language to mirror */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                JD Language to Mirror
              </h3>
              <CopyButton
                getText={() =>
                  result.jd_language_to_mirror
                    .map((p) => `"${p.phrase}"\n  ${p.context}`)
                    .join("\n\n")
                }
              />
            </div>
            <div className="space-y-3">
              {result.jd_language_to_mirror.map((p, i) => (
                <div key={i}>
                  <span className="inline-block bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-md">
                    &ldquo;{p.phrase}&rdquo;
                  </span>
                  <p className="mt-1 text-xs text-gray-500 leading-snug">{p.context}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What to de-emphasize */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                What to De-emphasize
              </h3>
              <CopyButton
                getText={() =>
                  result.what_to_deemphasize
                    .map((d) => `• ${d.item}\n  Reason: ${d.reason}`)
                    .join("\n\n")
                }
              />
            </div>
            <div className="space-y-3">
              {result.what_to_deemphasize.map((d, i) => (
                <div key={i} className="border-l-2 border-amber-300 pl-3">
                  <p className="text-sm font-medium text-gray-800">{d.item}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{d.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter concern */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Recruiter Concern to Preempt
              </h3>
              <CopyButton
                getText={() =>
                  `Concern: ${result.recruiter_concern_to_preempt.concern}\n\nHow to address it: ${result.recruiter_concern_to_preempt.suggested_response}`
                }
              />
            </div>
            <div className="space-y-2">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                  Likely concern
                </p>
                <p className="text-sm text-amber-900">
                  {result.recruiter_concern_to_preempt.concern}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                  How to address it
                </p>
                <p className="text-sm text-green-900">
                  {result.recruiter_concern_to_preempt.suggested_response}
                </p>
              </div>
            </div>
          </div>

          {/* Outreach angle */}
          {result.outreach_angle && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Outreach Angle
                </h3>
                <CopyButton getText={() => result.outreach_angle ?? ""} />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{result.outreach_angle}</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
