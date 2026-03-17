"use client";

import { useState, useEffect, useRef } from "react";
import LoadingState from "./LoadingState";
import type { DiscoveredJob, RoleClusterResult } from "@/types";

interface JobDiscoveryProps {
  profileText: string;
  clusterResult: RoleClusterResult | null;
  // Persisted jobs list, owned by page.tsx
  savedJobs: DiscoveredJob[];
  onJobsChange: (jobs: DiscoveredJob[]) => void;
  // When set, auto-trigger a "find similar" search using this JD
  findSimilarJD: string | null;
  onFindSimilarConsumed: () => void;
  onLoadJob: (jdText: string, title: string, company: string) => void;
  onGoToProfile: () => void;
}

function buildProfileSummary(profileText: string, clusterResult: RoleClusterResult | null): string {
  if (clusterResult) {
    const clusters = clusterResult.role_clusters.map((c) => `${c.name} (${c.confidence})`).join(", ");
    const strengths = clusterResult.core_strengths.slice(0, 4).join("; ");
    return `Role clusters: ${clusters}\n\nCore strengths: ${strengths}`;
  }
  // No clusters yet — send a short resume excerpt
  return profileText.slice(0, 800);
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
  savedJobs,
  onJobsChange,
  findSimilarJD,
  onFindSimilarConsumed,
  onLoadJob,
  onGoToProfile,
}: JobDiscoveryProps) {
  // Ephemeral search state — doesn't need to survive tab switches
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [lastSearchSummary, setLastSearchSummary] = useState("");
  const [mode, setMode] = useState<"profile" | "similar">("profile");
  const [loadingJobUrl, setLoadingJobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  // Holds the reference JD for "similar" searches so "Find more" can reuse it
  const [currentSimilarJD, setCurrentSimilarJD] = useState<string | null>(null);

  const prevFindSimilarRef = useRef<string | null>(null);

  // Auto-trigger "find similar" when the prop changes to a new value
  useEffect(() => {
    if (findSimilarJD && findSimilarJD !== prevFindSimilarRef.current) {
      prevFindSimilarRef.current = findSimilarJD;
      setCurrentSimilarJD(findSimilarJD);
      handleSearch("similar", false, findSimilarJD);
      onFindSimilarConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findSimilarJD]);

  async function handleSearch(
    searchMode: "profile" | "similar" = "profile",
    append = false,
    overrideSimilarJD?: string
  ) {
    const similarJD = searchMode === "similar" ? (overrideSimilarJD ?? currentSimilarJD) : null;

    setIsSearching(true);
    setSearchError("");
    setMode(searchMode);
    setLoadError("");

    if (!append) {
      onJobsChange([]);
    }

    const profileSummary = buildProfileSummary(profileText, clusterResult);

    try {
      const response = await fetch("/api/discover-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSummary,
          similarToJD: similarJD ?? undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSearchError(data.error ?? "Search failed. Please try again.");
        if (!append) onJobsChange([]);
      } else {
        setLastSearchSummary(data.search_summary ?? "");
        const newJobs: DiscoveredJob[] = data.jobs ?? [];
        onJobsChange(append ? [...savedJobs, ...newJobs] : newJobs);
      }
    } catch {
      setSearchError("Network error. Check your connection and try again.");
      if (!append) onJobsChange([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleLoadJob(job: DiscoveredJob) {
    setLoadingJobUrl(job.url);
    setLoadError("");
    try {
      const response = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: job.url }),
      });
      const data = await response.json();
      if (response.ok && data.text && data.text.length > 100) {
        onLoadJob(data.text, job.title, job.company);
      } else {
        // Fallback: use snippet + title
        onLoadJob(`${job.title} at ${job.company}\n\n${job.snippet}\n\nSource: ${job.url}`, job.title, job.company);
      }
    } catch {
      onLoadJob(`${job.title} at ${job.company}\n\n${job.snippet}\n\nSource: ${job.url}`, job.title, job.company);
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

  const hasJobs = savedJobs.length > 0;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-text">
            {mode === "similar" && hasJobs ? "Similar Jobs" : "Job Discovery"}
          </h2>
          <p className="text-base text-brand-text/50 mt-1">
            {mode === "similar" && hasJobs
              ? "Open roles similar to the job you scored — at other companies."
              : "Signal searches the web for open roles that match your profile."}
          </p>
        </div>
        {!isSearching && (
          <button
            onClick={() => handleSearch("profile", false)}
            className="shrink-0 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
          >
            {hasJobs ? "Search again" : "Find Matching Jobs"}
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {isSearching && (
        <LoadingState
          message={
            mode === "similar"
              ? "Searching for similar roles at other companies…"
              : "Searching the web for matching roles. This takes about 20 seconds…"
          }
        />
      )}

      {/* ── Error ── */}
      {searchError && !isSearching && (
        <div className="p-4 bg-red-50 rounded-xl ring-1 ring-red-100">
          <p className="text-base text-red-700">{searchError}</p>
          <button
            onClick={() => handleSearch(mode, false)}
            className="mt-1 text-sm text-red-500 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Load error ── */}
      {loadError && (
        <div className="p-3 bg-red-50 rounded-xl ring-1 ring-red-100">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {/* ── Results ── */}
      {hasJobs && !isSearching && (
        <>
          {/* Search summary */}
          {lastSearchSummary && (
            <div className="flex items-center gap-2 text-sm text-brand-text/40">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <span>{lastSearchSummary}</span>
            </div>
          )}

          {/* Job grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {savedJobs.map((job, i) => (
              <JobCard
                key={i}
                job={job}
                onLoad={handleLoadJob}
                isLoading={loadingJobUrl === job.url}
              />
            ))}
          </div>

          {/* Find more / Clear */}
          <div className="flex items-center justify-between pt-2 border-t border-brand-text/8">
            <button
              onClick={() => onJobsChange([])}
              className="text-sm text-brand-text/30 hover:text-brand-text/50 transition-colors"
            >
              Clear results
            </button>
            <button
              onClick={() => handleSearch(mode, true)}
              disabled={isSearching}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-brand-text/15 text-brand-text/60 text-sm font-medium rounded-2xl sm:rounded-full hover:border-brand-text/30 hover:text-brand-text/80 disabled:opacity-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Find more
            </button>
          </div>
        </>
      )}

      {/* ── Empty state (no results yet) ── */}
      {!hasJobs && !isSearching && !searchError && (
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
            onClick={() => handleSearch("profile", false)}
            className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
          >
            Find Matching Jobs →
          </button>
        </div>
      )}
    </div>
  );
}
