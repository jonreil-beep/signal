"use client";

import { useState } from "react";
import ProfileUploader from "@/components/ProfileUploader";
import RoleClusterResults from "@/components/RoleClusterResults";
import JobFitScorer from "@/components/JobFitScorer";
import TailoringBrief from "@/components/TailoringBrief";
import LoadingState from "@/components/LoadingState";
import type { TabId, RoleClusterResult } from "@/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "job-fit", label: "Job Fit" },
  { id: "tailoring-brief", label: "Tailoring Brief" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Profile state
  const [profileText, setProfileText] = useState<string>("");

  // Role clustering state
  const [clusterResult, setClusterResult] = useState<RoleClusterResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string>("");

  // Job fit state — stored here so Session 4 (Tailoring Brief) can use it
  const [jobDescription, setJobDescription] = useState<string>("");

  function handleProfileConfirmed(text: string) {
    setProfileText(text);
    // Reset any previous analysis when profile changes
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Signal</h1>
          <p className="text-sm text-gray-500">Job search copilot</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <nav className="flex gap-0" aria-label="Tabs">
            {TABS.map((tab) => {
              const isDone =
                (tab.id === "profile" && !!profileText) ||
                (tab.id === "job-fit" && !!jobDescription) ||
                (tab.id === "tailoring-brief" && false); // brief has no persistent "done" state
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {isDone && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Progress strip — only shown when at least one step is done */}
      {(profileText || jobDescription) && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-2 flex items-center gap-4 text-xs text-gray-500">
            <span className={profileText ? "text-green-600 font-medium" : ""}>
              {profileText ? "✓ Profile loaded" : "1. Load profile"}
            </span>
            <span className="text-gray-300">→</span>
            <span className={jobDescription ? "text-green-600 font-medium" : ""}>
              {jobDescription ? "✓ Job scored" : "2. Score a job"}
            </span>
            <span className="text-gray-300">→</span>
            <span>3. Generate brief</span>
          </div>
        </div>
      )}

      {/* Tab content */}
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload your resume (PDF or DOCX) or paste the text. This is the foundation for all
                analysis.
              </p>
            </div>

            <ProfileUploader onProfileConfirmed={handleProfileConfirmed} />

            {/* Analyze button — appears after profile is confirmed */}
            {profileText && !isAnalyzing && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {clusterResult ? "Role analysis complete" : "Ready to analyze"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {clusterResult
                        ? "Re-run to refresh the analysis."
                        : "Claude will identify your best-fit role clusters, strengths, and positioning risks."}
                    </p>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    className="shrink-0 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
                  >
                    {clusterResult ? "Re-analyze" : "Analyze My Profile"}
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {isAnalyzing && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <LoadingState message="Analyzing your profile — this takes 10–20 seconds…" />
              </div>
            )}

            {/* Error */}
            {analyzeError && !isAnalyzing && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{analyzeError}</p>
                <button
                  onClick={handleAnalyze}
                  className="mt-1 text-xs text-red-600 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Results */}
            {clusterResult && !isAnalyzing && (
              <RoleClusterResults result={clusterResult} />
            )}
          </div>
        )}

        {/* ── Job Fit tab ── */}
        {activeTab === "job-fit" && (
          <div>
            {!profileText ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-gray-900">Complete your profile first</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                  Upload or paste your resume in the Profile tab before scoring jobs.
                </p>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="mt-4 text-sm text-blue-600 hover:underline font-medium"
                >
                  Go to Profile →
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Job Fit Scorer</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Paste a job description or fetch from URL. Get an honest fit score with clear reasoning.
                  </p>
                </div>
                <JobFitScorer
                  profileText={profileText}
                  onJobScored={(jd) => setJobDescription(jd)}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Tailoring Brief tab ── */}
        {activeTab === "tailoring-brief" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Tailoring Brief</h2>
              <p className="text-sm text-gray-600 mt-1">
                A targeted brief for this specific job — what to emphasize, what language to mirror, and what concern to preempt.
              </p>
            </div>
            <TailoringBrief
              profileText={profileText}
              jobDescription={jobDescription}
              onGoToProfile={() => setActiveTab("profile")}
              onGoToJobFit={() => setActiveTab("job-fit")}
            />
          </div>
        )}

      </main>
    </div>
  );
}
