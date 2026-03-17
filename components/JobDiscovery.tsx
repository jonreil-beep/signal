"use client";

import { useState, useEffect, useRef } from "react";
import LoadingState from "./LoadingState";
import type { DiscoveredJob, JobDiscoveryResult, RoleClusterResult } from "@/types";

interface JobDiscoveryProps {
  profileText: string;
  clusterResult: RoleClusterResult | null;
  // When set, auto-trigger a "find similar" search using this JD
  findSimilarJD: string | null;
  onFindSimilarConsumed: () => void;
  onLoadJob: (url: string, title: string, company: string) => void;
  onGoToProfile: () => void;
}

function buildProfileSummary(profileText: string, clusterResult: RoleClusterResult | null): string {
  if (clusterResult) {
    const clusters = clusterResult.role_clusters.map((c) => `${c.name} (${c.confidence})`).join(", ");
    const strengths = clusterResult.core_strengths.slice(0, 5).join("; ");
    return `Role clusters: ${clusters}\n\nCore strengths: ${strengths}\n\nResume excerpt:\n${profileText.slice(0, 1200)}`;
  }
  return profileText.slice(0, 3000);
}

function JobCard({
  job,
  onLoad,
  isLoading,
}: {
  job: DiscoveredJob;
  onLoad: (job: DiscoveredJob) => void;
  isLoading: boolean;
}) {
  const domain = (() => {
    try {
      return new URL(job.url).hostname.replace(/^www\./, "");
    } catch {
      return job.url;
    }
  })();

  return (
    <div className="bg-white rounded-2xl shadow p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-brand-text leading-snug">{job.title}</p>
          <p className="text-sm text-brand-text/50 mt-0.5">{job.company}</p>
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-sm text-brand-text/30 hover:text-brand-accent transition-colors mt-0.5"
        >
          {domain}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Snippet */}
      <p className="text-sm text-brand-text/60 leading-relaxed">{job.snippet}</p>

      {/* Why match */}
      <div className="rounded-xl bg-brand-accent/6 ring-1 ring-brand-accent/15 px-3.5 py-2.5">
        <p className="text-[0.75rem] font-medium uppercase tracking-[0.06em] text-brand-accent mb-1">Why you fit</p>
        <p className="text-sm text-brand-text/70 leading-snug">{job.why_match}</p>
      </div>

      {/* Load button */}
      <button
        onClick={() => onLoad(job)}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-accent text-white text-sm font-semibold rounded-xl hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Fetching job…
          </>
        ) : (
          "Load into Job Fit →"
        )}
      </button>
    </div>
  );
}

export default function JobDiscovery({
  profileText,
  clusterResult,
  findSimilarJD,
  onFindSimilarConsumed,
  onLoadJob,
  onGoToProfile,
}: JobDiscoveryProps) {
  const [result, setResult] = useState<JobDiscoveryResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [mode, setMode] = useState<"profile" | "similar">("profile");
  const [loadingJobUrl, setLoadingJobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");

  const prevFindSimilarRef = useRef<string | null>(null);

  // Auto-trigger "find similar" when the prop changes to a new value
  useEffect(() => {
    if (findSimilarJD && findSimilarJD !== prevFindSimilarRef.current) {
      prevFindSimilarRef.current = findSimilarJD;
      handleSearch("similar");
      onFindSimilarConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findSimilarJD]);

  async function handleSearch(searchMode: "profile" | "similar" = "profile") {
    setIsSearching(true);
    setSearchError("");
    setResult(null);
    setMode(searchMode);
    setLoadError("");

    const profileSummary = buildProfileSummary(profileText, clusterResult);

    try {
      const response = await fetch("/api/discover-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSummary,
          similarToJD: searchMode === "similar" ? findSimilarJD ?? undefined : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSearchError(data.error ?? "Search failed. Please try again.");
      } else {
        setResult(data as JobDiscoveryResult);
      }
    } catch {
      setSearchError("Network error. Check your connection and try again.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleLoadJob(job: DiscoveredJob) {
    setLoadingJobUrl(job.url);
    setLoadError("");
    try {
      // Try to fetch the full JD text from the URL
      const response = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: job.url }),
      });
      const data = await response.json();
      if (response.ok && data.text && data.text.length > 100) {
        onLoadJob(data.text, job.title, job.company);
      } else {
        // Fallback: use snippet + title as the JD
        const fallbackJD = `${job.title} at ${job.company}\n\n${job.snippet}\n\nSource: ${job.url}`;
        onLoadJob(fallbackJD, job.title, job.company);
      }
    } catch {
      // Fallback on network error too
      const fallbackJD = `${job.title} at ${job.company}\n\n${job.snippet}\n\nSource: ${job.url}`;
      onLoadJob(fallbackJD, job.title, job.company);
    } finally {
      setLoadingJobUrl(null);
    }
  }

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-text">
            {mode === "similar" && result ? "Similar Jobs" : "Job Discovery"}
          </h2>
          <p className="text-base text-brand-text/50 mt-1">
            {mode === "similar" && result
              ? "Open roles similar to the job you scored — at other companies."
              : "Signal searches the web for open roles that match your profile."}
          </p>
        </div>
        {!isSearching && (
          <button
            onClick={() => handleSearch("profile")}
            className="shrink-0 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
          >
            {result && mode === "profile" ? "Search again" : "Find Matching Jobs"}
          </button>
        )}
      </div>

      {/* Loading */}
      {isSearching && (
        <LoadingState
          message={
            mode === "similar"
              ? "Searching for similar roles at other companies…"
              : "Searching the web for matching roles. This takes about 20 seconds…"
          }
        />
      )}

      {/* Error */}
      {searchError && !isSearching && (
        <div className="p-4 bg-red-50 rounded-xl ring-1 ring-red-100">
          <p className="text-base text-red-700">{searchError}</p>
          <button
            onClick={() => handleSearch(mode)}
            className="mt-1 text-sm text-red-500 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Load error */}
      {loadError && (
        <div className="p-3 bg-red-50 rounded-xl ring-1 ring-red-100">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {/* Results */}
      {result && !isSearching && (
        <>
          {/* Search summary */}
          <div className="flex items-center gap-2 text-sm text-brand-text/40">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <span>{result.search_summary}</span>
          </div>

          {/* Job cards */}
          {result.jobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow text-center">
              <p className="text-base font-semibold text-brand-text">No matches found</p>
              <p className="text-base text-brand-text/50 mt-1">Try searching again — results vary with each search.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {result.jobs.map((job, i) => (
                <JobCard
                  key={i}
                  job={job}
                  onLoad={handleLoadJob}
                  isLoading={loadingJobUrl === job.url}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!result && !isSearching && !searchError && (
        <div className="bg-white rounded-2xl p-10 shadow text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-brand-accent/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-brand-text">Ready to search</p>
          <p className="text-base text-brand-text/50 mt-1 max-w-xs mx-auto">
            Signal will use your profile to find open roles that are a genuine fit — across company career pages and job boards.
          </p>
          <button
            onClick={() => handleSearch("profile")}
            className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
          >
            Find Matching Jobs →
          </button>
        </div>
      )}
    </div>
  );
}
