"use client";

import { useState } from "react";
import ProfileUploader from "@/components/ProfileUploader";
import RoleClusterResults from "@/components/RoleClusterResults";
import JobFitScorer from "@/components/JobFitScorer";
import TailoringBrief from "@/components/TailoringBrief";
import JobTracker from "@/components/JobTracker";
import LoadingState from "@/components/LoadingState";
import type { TabId, RoleClusterResult, JobFitResult, TailoringBriefResult, OutreachResult, ResumeUpdateResult, TrackedJob } from "@/types";

const MAIN_TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "job-fit", label: "Job Fit" },
  { id: "tailoring-brief", label: "Tailoring Brief" },
];

function extractJobTitle(jd: string, fallbackCount: number): string {
  const firstShortLine = jd
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 3 && l.length < 80);
  return firstShortLine ?? `Job #${fallbackCount}`;
}

export default function Home() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [profileText, setProfileText] = useState<string>("");
  const [clusterResult, setClusterResult] = useState<RoleClusterResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string>("");

  // Active job slots
  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobFitResult, setJobFitResult] = useState<JobFitResult | null>(null);
  const [tailoringResult, setTailoringResult] = useState<TailoringBriefResult | null>(null);
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);
  const [resumeUpdateResult, setResumeUpdateResult] = useState<ResumeUpdateResult | null>(null);

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
      resumeUpdateResult: null,
      scoredAt: new Date(),
    };
    setTrackedJobs((prev) => [...prev, newJob]);
    setActiveJobId(id);
    setJobDescription(jd);
    setJobFitResult(result);
    setTailoringResult(null);
    setOutreachResult(null);
    setResumeUpdateResult(null);
  }

  function handleTailoringResult(result: TailoringBriefResult) {
    setTailoringResult(result);
    setOutreachResult(null);
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

  function handleResumeUpdateResult(result: ResumeUpdateResult | null) {
    setResumeUpdateResult(result);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, resumeUpdateResult: result } : j))
      );
    }
  }

  function handleJobFitReset() {
    setJobDescription("");
    setJobFitResult(null);
    setTailoringResult(null);
    setOutreachResult(null);
    setResumeUpdateResult(null);
    setActiveJobId(null);
  }

  function handleSelectJob(job: TrackedJob, goTo: "job-fit" | "tailoring-brief") {
    setActiveJobId(job.id);
    setJobDescription(job.jobDescription);
    setJobFitResult(job.jobFitResult);
    setTailoringResult(job.tailoringResult);
    setOutreachResult(job.outreachResult);
    setResumeUpdateResult(job.resumeUpdateResult);
    setActiveTab(goTo);
  }

  function handleRemoveJob(id: string) {
    setTrackedJobs((prev) => prev.filter((j) => j.id !== id));
    if (activeJobId === id) {
      setActiveJobId(null);
    }
  }

  // ── Landing screen ──
  if (showLanding) {
    return (
      <div className="min-h-screen bg-brand-text flex items-center px-6">
        <div className="max-w-2xl mx-auto w-full py-20">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white tracking-tight">SIGNAL</h1>
            <p className="text-sm text-white/40 mt-2">Job search copilot</p>
          </div>
          <p className="text-xl text-white/70 leading-relaxed mb-10">
            Signal is a job search copilot for experienced professionals.
            Unlike LinkedIn or Indeed, it doesn&apos;t show you more jobs — it helps you apply to fewer, better ones.
            Upload your resume once, then get an honest fit score for every role you&apos;re considering,
            a tailoring brief that tells you exactly what to emphasize, and specific resume edits —
            all calibrated to your actual background.
          </p>
          <button
            onClick={() => { setShowLanding(false); setActiveTab("profile"); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white text-base font-semibold rounded-xl hover:bg-brand-accent/90 transition-colors"
          >
            Start with your resume →
          </button>
        </div>
      </div>
    );
  }

  // ── App shell ──
  return (
    <div className="min-h-screen bg-brand-bg">

      {/* Header */}
      <header className="bg-brand-text">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <button onClick={() => setShowLanding(true)} className="text-left">
            <h1 className="text-lg font-bold text-white tracking-tight hover:text-white/80 transition-colors">SIGNAL</h1>
            <p className="text-xs text-white/40 mt-0.5">Job search copilot</p>
          </button>
          {(profileText || jobDescription) && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className={`flex items-center gap-1 ${profileText ? "text-status-apply" : "text-white/30"}`}>
                {profileText && <span>✓</span>} Profile
              </span>
              <span className="text-white/20">·</span>
              <span className={`flex items-center gap-1 ${jobDescription ? "text-status-apply" : "text-white/30"}`}>
                {jobDescription && <span>✓</span>} Job scored
              </span>
              <span className="text-white/20">·</span>
              <span className={`flex items-center gap-1 ${tailoringResult ? "text-status-apply" : "text-white/30"}`}>
                {tailoringResult && <span>✓</span>} Brief
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-brand-text/8 shadow-sm">
        <div className="max-w-4xl mx-auto px-6">
          <nav className="flex items-center" aria-label="Tabs">
            {MAIN_TABS.map((tab) => {
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
                      ? "border-brand-accent text-brand-accent"
                      : "border-transparent text-brand-text/40 hover:text-brand-text/70 hover:border-brand-text/20"
                  }`}
                >
                  {tab.label}
                  {isDone && (
                    <span className="w-1.5 h-1.5 rounded-full bg-status-apply shrink-0" />
                  )}
                </button>
              );
            })}

            {/* My Jobs — right-aligned */}
            <div className="ml-auto">
              <button
                onClick={() => setActiveTab("my-jobs")}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all ${
                  activeTab === "my-jobs"
                    ? "border-brand-accent text-brand-accent"
                    : "border-transparent text-brand-text/40 hover:text-brand-text/70 hover:border-brand-text/20"
                }`}
              >
                My Jobs
                {trackedJobs.length > 0 && (
                  <span className="text-xs font-medium bg-brand-text/8 text-brand-text/50 px-1.5 py-0.5 rounded-full">
                    {trackedJobs.length}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <div>
            <div className="mb-7">
              <h2 className="text-base font-semibold text-brand-text">Your Profile</h2>
              <p className="text-sm text-brand-text/50 mt-1">
                Upload your resume (PDF or DOCX) or paste the text. This is the foundation for all analysis.
              </p>
            </div>

            <ProfileUploader onProfileConfirmed={handleProfileConfirmed} />

            {profileText && !isAnalyzing && (
              <div className="mt-6 pt-6 border-t border-brand-text/8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-text">
                      {clusterResult ? "Analysis complete" : "Ready to analyze"}
                    </p>
                    <p className="text-sm text-brand-text/40 mt-0.5">
                      {clusterResult
                        ? "Re-run anytime to refresh."
                        : "Claude will map your best-fit roles, strengths, and risks."}
                    </p>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    className="shrink-0 px-5 py-2.5 bg-brand-accent text-white text-sm font-semibold rounded-xl hover:bg-brand-accent/90 transition-colors"
                  >
                    {clusterResult ? "Re-analyze" : "Analyze My Profile"}
                  </button>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-6 pt-6 border-t border-brand-text/8">
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
                <div className="mt-8 pt-6 border-t border-brand-text/8 flex justify-end">
                  <button
                    onClick={() => setActiveTab("job-fit")}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-brand-accent text-white text-sm font-medium rounded-xl hover:bg-brand-accent/90 transition-colors"
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
                  <h2 className="text-base font-semibold text-brand-text">Job Fit Scorer</h2>
                  <p className="text-sm text-brand-text/50 mt-1">
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
              <h2 className="text-base font-semibold text-brand-text">Tailoring Brief</h2>
              <p className="text-sm text-brand-text/50 mt-1">
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
              resumeUpdateResult={resumeUpdateResult}
              onResumeUpdateResultChange={handleResumeUpdateResult}
              onGoToProfile={() => setActiveTab("profile")}
              onGoToJobFit={() => setActiveTab("job-fit")}
            />
          </div>
        )}

        {/* ── My Jobs tab ── */}
        {activeTab === "my-jobs" && (
          <div>
            <div className="mb-7">
              <h2 className="text-base font-semibold text-brand-text">My Jobs</h2>
              <p className="text-sm text-brand-text/50 mt-1">
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
      <p className="text-sm font-semibold text-brand-text">{message}</p>
      <p className="text-sm text-brand-text/40 mt-1 max-w-xs mx-auto">{sub}</p>
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-1 px-4 py-2 bg-brand-accent text-white text-sm font-medium rounded-xl hover:bg-brand-accent/90 transition-colors"
      >
        {action} →
      </button>
    </div>
  );
}
