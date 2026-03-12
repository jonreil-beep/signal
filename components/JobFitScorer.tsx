"use client";

import { useState } from "react";
import LoadingState from "./LoadingState";
import type { JobFitResult } from "@/types";

interface JobFitScorerProps {
  profileText: string;
  onJobScored: (jobDescription: string) => void;
}

type InputMode = "paste" | "url";

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Apply Now":                  { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-300" },
  "Apply with Tailoring":       { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-300"  },
  "Stretch — Proceed Carefully":{ bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-300"},
  "Skip":                       { bg: "bg-red-50",    text: "text-red-800",    border: "border-red-300"   },
};

function scoreColor(score: number): string {
  if (score >= 7) return "text-green-600";
  if (score >= 5) return "text-yellow-600";
  return "text-red-500";
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${score >= 7 ? "bg-green-500" : score >= 5 ? "bg-yellow-400" : "bg-red-400"}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums w-6 text-right ${scoreColor(score)}`}>
        {score}
      </span>
    </div>
  );
}

export default function JobFitScorer({ profileText, onJobScored }: JobFitScorerProps) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [jdText, setJdText] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string>("");
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string>("");
  const [result, setResult] = useState<JobFitResult | null>(null);

  async function handleFetchUrl() {
    if (!urlInput.trim()) return;
    setIsFetching(true);
    setFetchError("");
    setJdText("");
    setResult(null);

    try {
      const response = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFetchError(
          (data.error ?? "Could not fetch that URL.") +
            " Paste the job description text instead."
        );
      } else {
        setJdText(data.text);
      }
    } catch {
      setFetchError("Network error fetching URL. Paste the job description text instead.");
    } finally {
      setIsFetching(false);
    }
  }

  async function handleScore() {
    if (!jdText.trim() || !profileText) return;
    setIsScoring(true);
    setScoreError("");
    setResult(null);

    try {
      const response = await fetch("/api/score-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobDescription: jdText }),
      });

      const data = await response.json();

      if (!response.ok) {
        setScoreError(data.error ?? "Scoring failed. Please try again.");
      } else {
        setResult(data as JobFitResult);
        onJobScored(jdText.trim());
      }
    } catch {
      setScoreError("Network error. Check your connection and try again.");
    } finally {
      setIsScoring(false);
    }
  }

  function handleReset() {
    setJdText("");
    setUrlInput("");
    setFetchError("");
    setScoreError("");
    setResult(null);
  }

  const recStyle =
    result && RECOMMENDATION_STYLES[result.recommendation]
      ? RECOMMENDATION_STYLES[result.recommendation]
      : { bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-300" };

  return (
    <div className="space-y-6">
      {/* Input section */}
      {!result && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => { setMode("paste"); setFetchError(""); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "paste"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Paste JD
            </button>
            <button
              onClick={() => { setMode("url"); setFetchError(""); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "url"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Fetch from URL
            </button>
          </div>

          {/* Paste mode */}
          {mode === "paste" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste the job description
              </label>
              <textarea
                value={jdText}
                onChange={(e) => { setJdText(e.target.value); setResult(null); }}
                placeholder="Paste the full job description here..."
                rows={14}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
            </div>
          )}

          {/* URL mode */}
          {mode === "url" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job posting URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                    placeholder="https://..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleFetchUrl}
                    disabled={!urlInput.trim() || isFetching}
                    className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Fetch
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Many job boards block automated fetches — paste the text if this fails.
                </p>
              </div>

              {isFetching && <LoadingState message="Fetching job description…" />}

              {fetchError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-800">{fetchError}</p>
                  <button
                    onClick={() => { setMode("paste"); setFetchError(""); }}
                    className="mt-1 text-xs text-amber-700 underline hover:no-underline"
                  >
                    Switch to paste mode
                  </button>
                </div>
              )}

              {jdText && !isFetching && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fetched text — confirm it looks right
                  </label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    rows={12}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 font-mono leading-relaxed bg-gray-50 resize-y"
                  />
                </div>
              )}
            </div>
          )}

          {/* Score button */}
          {jdText.trim() && !isScoring && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleScore}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                Score This Job
              </button>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            </div>
          )}

          {isScoring && <LoadingState message="Scoring job fit — this takes 10–20 seconds…" />}

          {scoreError && !isScoring && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{scoreError}</p>
              <button
                onClick={handleScore}
                className="mt-1 text-xs text-red-600 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Overall score + recommendation */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Overall Fit
                </p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold tabular-nums ${scoreColor(result.overall_fit)}`}>
                    {result.overall_fit}
                  </span>
                  <span className="text-xl text-gray-400 font-light">/10</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 leading-snug max-w-sm">
                  {result.summary}
                </p>
              </div>
              <div className={`shrink-0 px-4 py-2 rounded-lg border text-sm font-semibold ${recStyle.bg} ${recStyle.text} ${recStyle.border}`}>
                {result.recommendation}
              </div>
            </div>
          </div>

          {/* Dimension scores */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Dimension Scores
            </h3>
            <div className="space-y-4">
              {(
                [
                  ["Functional Fit",  result.dimensions.functional_fit],
                  ["Seniority Fit",   result.dimensions.seniority_fit],
                  ["Industry Fit",    result.dimensions.industry_fit],
                  ["Keyword Overlap", result.dimensions.keyword_overlap],
                ] as const
              ).map(([label, dim]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <ScoreBar score={dim.score} />
                  <p className="mt-1 text-xs text-gray-500 leading-snug">{dim.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What she has / What's missing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                What You Have
              </h3>
              <ul className="space-y-2">
                {result.what_she_has.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                What&apos;s Missing
              </h3>
              <ul className="space-y-2">
                {result.whats_missing.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recruiter concern */}
          {result.recruiter_concern && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Recruiter Concern Flag
              </p>
              <p className="text-sm text-amber-900">{result.recruiter_concern}</p>
            </div>
          )}

          {/* Score another */}
          <div className="pt-2">
            <button
              onClick={handleReset}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              ← Score a different job
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
