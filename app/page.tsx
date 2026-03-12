"use client";

import { useState } from "react";
import ProfileUploader from "@/components/ProfileUploader";
import RoleClusterResults from "@/components/RoleClusterResults";
import JobFitScorer from "@/components/JobFitScorer";
import TailoringBrief from "@/components/TailoringBrief";
import JobTracker from "@/components/JobTracker";
import LoadingState from "@/components/LoadingState";
import type { TabId, RoleClusterResult, JobFitResult, TailoringBriefResult, OutreachResult, TrackedJob } from "@/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "job-fit", label: "Job Fit" },
  { id: "tailoring-brief", label: "Tailoring Brief" },
  { id: "my-jobs", label: "My Jobs" },
];

function extractJobTitle(jd: string, fallbackCount: number): string {
  const firstShortLine = jd
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 3 && l.length < 80);
  return firstShortLine ?? `Job #${fallbackCount}`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [profileText, setProfileText] = useState<string>("");
  const [clusterResult, setClusterResult] = useState<RoleClusterResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string>("");

  // Active job slots (what's currently loaded in Job Fit + Tailoring Brief)
  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobFitResult, setJobFitResult] = useState<JobFitResult | null>(null);
  const [tailoringResult, setTailoringResult] = useState<TailoringBriefResult | null>(null);
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);

  // Job tracker
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  function handleProfileConfirmed(text: string) {
    setProfileText(text);
    setClusterResult(null);
    setAnalyzeError("");
  }

  async function handleAnalyze() {
    if (!profileText) return;
    setIsAnalyzing(true);
    setAnalyzeError("");
    setClusterResult(null);

    try {
      const response = await fetch("/api/cluster-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAnalyzeError(data.error ?? "Analysis failed. Please try again.");
      } else {
        setClusterResult(data as RoleClusterResult);
      }
    } catch {
      setAnalyzeError("Network error. Check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleJobScored(jd: string, result: JobFitResult) {
    const id = crypto.randomUUID();
    const label = extractJobTitle(jd, trackedJobs.length + 1);
    const newJob: TrackedJob = {
      id,
      label,
      jobDescription: jd,
      jobFitResult: result,
      tailoringResult: null,
      outreachResult: null,
      scoredAt: new Date(),
    };
    setTrackedJobs((prev) => [...prev, newJob]);
    setActiveJobId(id);
    setJobDescription(jd);
    setJobFitResult(result);
    setTailoringResult(null);
    setOutreachResult(null);
  }

  function handleTailoringResult(result: TailoringBriefResult) {
    setTailoringResult(result);
    setOutreachResult(null); // new brief invalidates old outreach
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, tailoringResult: result, outreachResult: null } : j))
      );
    }
  }

  function handleOutreachResult(result: OutreachResult | null) {
    setOutreachResult(result);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, outreachResult: result } : j))
      );
    }
  }

  function handleJobFitReset() {
    setJobDescription("");
    setJobFitResult(null);
    setTailoringResult(null);
    setOutreachResult(null);
    setActiveJobId(null);
  }

  function handleSelectJob(job: TrackedJob, goTo: "job-fit" | "tailoring-brief") {
    setActiveJobId(job.id);
    setJobDescription(job.jobDescription);
    setJobFitResult(job.jobFitResult);
    setTailoringResult(job.tailoringResult);
    setOutreachResult(job.outreachResult);
    setActiveTab(goTo);
  }

  function handleRemoveJob(id: string) {
    setTrackedJobs((prev) => prev.filter((j) => j.id !== id));
    if (activeJobId === id) {
      // Don't clear the active view — just disassociate it from the tracker
      setActiveJobId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Signal</h1>
            <p className="text-xs text-slate-400 mt-0.5">Job search copilot</p>
          </div>
          {(profileText || jobDescription) && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className={`flex items-center gap-1 ${profileText ? "text-green-400" : "text-slate-500"}`}>
                {profileText && <span>✓</span>} Profile
              </span>
              <span className="text-slate-600">·</span>
              <span className={`flex items-center gap-1 ${jobDescription ? "text-green-400" : "text-slate-500"}`}>
                {jobDescription && <span>✓</span>} Job scored
              </span>
              <span className="text-slate-600">·</span>
              <span className={`flex items-center gap-1 ${tailoringResult ? "text-green-400" : "text-slate-500"}`}>
                {tailoringResult && <span>✓</span>} Brief
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6">
          <nav className="flex" aria-label="Tabs">
            {TABS.map((tab) => {
              const isDone =
                (tab.id === "profile" && !!profileText) ||
                (tab.id === "job-fit" && !!jobDescription) ||
                (tab.id === "tailoring-brief" && !!tailoringResult);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {isDone && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  )}
                  {tab.id === "my-jobs" && trackedJobs.length > 0 && (
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {trackedJobs.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <div>
            <div className="mb-7">
              <h2 className="text-base font-semibold text-gray-900">Your Profile</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload your resume (PDF or DOCX) or paste the text. This is the foundation for all analysis.
              </p>
            </div>

            <ProfileUploader onProfileConfirmed={handleProfileConfirmed} />

            {profileText && !isAnalyzing && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {clusterResult ? "Analysis complete" : "Ready to analyze"}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {clusterResult
                        ? "Re-run anytime to refresh."
                        : "Claude will map your best-fit roles, strengths, and risks."}
                    </p>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    className="shrink-0 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    {clusterResult ? "Re-analyze" : "Analyze My Profile"}
                  </button>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <LoadingState message="Analyzing your profile — this takes 10–20 seconds…" />
              </div>
            )}

            {analyzeError && !isAnalyzing && (
              <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-red-700">{analyzeError}</p>
                <button onClick={handleAnalyze} className="mt-1.5 text-xs text-red-600 underline hover:no-underline">
                  Try again
                </button>
              </div>
            )}

            {clusterResult && !isAnalyzing && (
              <>
                <RoleClusterResults result={clusterResult} />
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setActiveTab("job-fit")}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Go to Job Fit →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Job Fit tab ── */}
        {activeTab === "job-fit" && (
          <div>
            {!profileText ? (
              <EmptyState
                message="Complete your profile first"
                sub="Upload or paste your resume in the Profile tab before scoring jobs."
                action="Go to Profile"
                onAction={() => setActiveTab("profile")}
              />
            ) : (
              <div>
                <div className="mb-7">
                  <h2 className="text-base font-semibold text-gray-900">Job Fit Scorer</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Paste a job description or fetch from URL. Get an honest fit score with clear reasoning.
                  </p>
                </div>
                <JobFitScorer
                  profileText={profileText}
                  result={jobFitResult}
                  onJobScored={handleJobScored}
                  onReset={handleJobFitReset}
                  onGoToTailoringBrief={() => setActiveTab("tailoring-brief")}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Tailoring Brief tab ── */}
        {activeTab === "tailoring-brief" && (
          <div>
            <div className="mb-7">
              <h2 className="text-base font-semibold text-gray-900">Tailoring Brief</h2>
              <p className="text-sm text-gray-500 mt-1">
                A targeted brief for this job — what to emphasize, what language to mirror, what concern to preempt.
              </p>
            </div>
            <TailoringBrief
              profileText={profileText}
              jobDescription={jobDescription}
              result={tailoringResult}
              onResultChange={handleTailoringResult}
              outreachResult={outreachResult}
              onOutreachResultChange={handleOutreachResult}
              onGoToProfile={() => setActiveTab("profile")}
              onGoToJobFit={() => setActiveTab("job-fit")}
            />
          </div>
        )}

        {/* ── My Jobs tab ── */}
        {activeTab === "my-jobs" && (
          <div>
            <div className="mb-7">
              <h2 className="text-base font-semibold text-gray-900">My Jobs</h2>
              <p className="text-sm text-gray-500 mt-1">
                Every job you&apos;ve scored this session. Click any job to reload its fit results or tailoring brief.
              </p>
            </div>
            <JobTracker
              jobs={trackedJobs}
              onSelectJob={handleSelectJob}
              onRemoveJob={handleRemoveJob}
            />
          </div>
        )}

      </main>
    </div>
  );
}

function EmptyState({
  message,
  sub,
  action,
  onAction,
}: {
  message: string;
  sub: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="text-center py-20">
      <p className="text-sm font-semibold text-gray-900">{message}</p>
      <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">{sub}</p>
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
      >
        {action} →
      </button>
    </div>
  );
}
