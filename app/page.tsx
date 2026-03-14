"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import ProfileUploader from "@/components/ProfileUploader";
import RoleClusterResults from "@/components/RoleClusterResults";
import JobFitScorer from "@/components/JobFitScorer";
import TailoringBrief from "@/components/TailoringBrief";
import JobTracker from "@/components/JobTracker";
import JobLabelEditor from "@/components/JobLabelEditor";
import LoadingState from "@/components/LoadingState";
import SignalWordmark from "@/components/SignalWordmark";
import Link from "next/link";
import type { TabId, RoleClusterResult, JobFitResult, TailoringBriefResult, OutreachResult, CoverLetterResult, ResumeUpdateResult, TrackedJob } from "@/types";

const MAIN_TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "job-fit", label: "Job Fit" },
  { id: "tailoring-brief", label: "Prep" },
];

function extractJobTitle(jd: string, fallbackCount: number): string {
  const firstShortLine = jd
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 3 && l.length < 80);
  return firstShortLine ?? `Job #${fallbackCount}`;
}

export default function Home() {
  const supabase = createClient();

  // ── Auth state ──
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState("");

  // ── App state ──
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [profileText, setProfileText] = useState<string>("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [clusterResult, setClusterResult] = useState<RoleClusterResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string>("");

  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobFitResult, setJobFitResult] = useState<JobFitResult | null>(null);
  const [tailoringResult, setTailoringResult] = useState<TailoringBriefResult | null>(null);
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);
  const [coverLetterResult, setCoverLetterResult] = useState<CoverLetterResult | null>(null);
  const [resumeUpdateResult, setResumeUpdateResult] = useState<ResumeUpdateResult | null>(null);

  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // ── Auth lifecycle ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setShowLanding(false);
        loadUserData(session.user.id);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        setShowLanding(false);
        loadUserData(session.user.id);
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        setShowLanding(true);
        clearAppState();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUserData(userId: string) {
    const [profileRes, jobsRes] = await Promise.all([
      supabase.from("profiles").select("resume_text, cluster_result").eq("id", userId).single(),
      supabase.from("tracked_jobs").select("*").eq("user_id", userId).order("scored_at", { ascending: false }),
    ]);

    if (profileRes.data?.resume_text) {
      setProfileText(profileRes.data.resume_text);
    }
    if (profileRes.data?.cluster_result) {
      setClusterResult(profileRes.data.cluster_result as RoleClusterResult);
    }

    if (jobsRes.data) {
      const jobs: TrackedJob[] = jobsRes.data.map((row) => ({
        id: row.id as string,
        label: row.label as string,
        jobDescription: row.job_description as string,
        jobFitResult: row.job_fit_result as JobFitResult,
        tailoringResult: row.tailoring_result as TailoringBriefResult | null,
        outreachResult: row.outreach_result as OutreachResult | null,
        coverLetterResult: row.cover_letter_result as CoverLetterResult | null,
        resumeUpdateResult: row.resume_update_result as ResumeUpdateResult | null,
        scoredAt: new Date(row.scored_at as string),
      }));
      setTrackedJobs(jobs);
    }
  }

  function clearAppState() {
    setProfileText("");
    setClusterResult(null);
    setJobDescription("");
    setJobFitResult(null);
    setTailoringResult(null);
    setOutreachResult(null);
    setCoverLetterResult(null);
    setResumeUpdateResult(null);
    setTrackedJobs([]);
    setActiveJobId(null);
    setActiveTab("profile");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleSendMagicLink() {
    if (!email.trim()) return;
    setSendingMagicLink(true);
    setMagicLinkError("");
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setSendingMagicLink(false);
    if (error) {
      setMagicLinkError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  }

  // ── Profile ──
  async function handleProfileConfirmed(text: string) {
    setProfileText(text);
    setClusterResult(null);
    setAnalyzeError("");
    setUpdatingProfile(false);
    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, resume_text: text, cluster_result: null, updated_at: new Date().toISOString() });
    }
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
        if (user) {
          await supabase.from("profiles").update({ cluster_result: data }).eq("id", user.id);
        }
      }
    } catch {
      setAnalyzeError("Network error. Check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  // ── Job tracking ──
  async function handleJobScored(jd: string, result: JobFitResult) {
    const id = crypto.randomUUID();
    const label = extractJobTitle(jd, trackedJobs.length + 1);
    const newJob: TrackedJob = {
      id,
      label,
      jobDescription: jd,
      jobFitResult: result,
      tailoringResult: null,
      outreachResult: null,
      coverLetterResult: null,
      resumeUpdateResult: null,
      scoredAt: new Date(),
    };
    setTrackedJobs((prev) => [...prev, newJob]);
    setActiveJobId(id);
    setJobDescription(jd);
    setJobFitResult(result);
    setTailoringResult(null);
    setOutreachResult(null);
    setCoverLetterResult(null);
    setResumeUpdateResult(null);

    if (user) {
      await supabase.from("tracked_jobs").insert({
        id,
        user_id: user.id,
        label,
        job_description: jd,
        job_fit_result: result,
        tailoring_result: null,
        outreach_result: null,
        resume_update_result: null,
        scored_at: newJob.scoredAt.toISOString(),
      });
    }
  }

  async function handleTailoringResult(result: TailoringBriefResult) {
    setTailoringResult(result);
    setOutreachResult(null);
    setCoverLetterResult(null);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, tailoringResult: result, outreachResult: null, coverLetterResult: null } : j))
      );
      if (user) {
        await supabase.from("tracked_jobs").update({ tailoring_result: result, outreach_result: null, cover_letter_result: null }).eq("id", activeJobId);
      }
    }
  }

  async function handleOutreachResult(result: OutreachResult | null) {
    setOutreachResult(result);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, outreachResult: result } : j))
      );
      if (user) {
        await supabase.from("tracked_jobs").update({ outreach_result: result }).eq("id", activeJobId);
      }
    }
  }

  async function handleCoverLetterResult(result: CoverLetterResult | null) {
    setCoverLetterResult(result);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, coverLetterResult: result } : j))
      );
      if (user) {
        await supabase.from("tracked_jobs").update({ cover_letter_result: result }).eq("id", activeJobId);
      }
    }
  }

  async function handleResumeUpdateResult(result: ResumeUpdateResult | null) {
    setResumeUpdateResult(result);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, resumeUpdateResult: result } : j))
      );
      if (user) {
        await supabase.from("tracked_jobs").update({ resume_update_result: result }).eq("id", activeJobId);
      }
    }
  }

  function handleJobFitReset() {
    setJobDescription("");
    setJobFitResult(null);
    setTailoringResult(null);
    setOutreachResult(null);
    setCoverLetterResult(null);
    setResumeUpdateResult(null);
    setActiveJobId(null);
  }

  function handleSelectJob(job: TrackedJob, goTo: "job-fit" | "tailoring-brief") {
    setActiveJobId(job.id);
    setJobDescription(job.jobDescription);
    setJobFitResult(job.jobFitResult);
    setTailoringResult(job.tailoringResult);
    setOutreachResult(job.outreachResult);
    setCoverLetterResult(job.coverLetterResult);
    setResumeUpdateResult(job.resumeUpdateResult);
    setActiveTab(goTo);
  }

  async function handleRenameJob(id: string, newLabel: string) {
    setTrackedJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, label: newLabel } : j))
    );
    if (user) {
      await supabase.from("tracked_jobs").update({ label: newLabel }).eq("id", id);
    }
  }

  async function handleRemoveJob(id: string) {
    setTrackedJobs((prev) => prev.filter((j) => j.id !== id));
    if (activeJobId === id) setActiveJobId(null);
    if (user) {
      await supabase.from("tracked_jobs").delete().eq("id", id);
    }
  }

  // ── Auth loading screen ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-text flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // ── Landing screen ──
  if (showLanding) {
    // Already signed in — show welcome back view
    if (user) {
      return (
        <div className="min-h-screen bg-brand-text relative overflow-hidden flex items-center px-6">
          <div className="landing-gradient-spinner" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl mx-auto w-full py-20">
            <div className="mb-10">
              <h1 className="text-5xl font-bold text-white tracking-tight"><SignalWordmark /></h1>
              <p className="text-sm text-white/40 mt-2">Job search copilot</p>
            </div>
            <p className="text-lg text-white/50 leading-relaxed mb-8 max-w-md">
              Most job applications fail before anyone reads them — wrong fit, generic framing,
              nothing that makes the candidate stick. Signal helps you apply to fewer roles,
              better prepared for each one.
            </p>
            <p className="text-2xl text-white/80 leading-relaxed mb-10">
              Welcome back{user.email ? `, ${user.email}` : ""}.
              {trackedJobs.length > 0
                ? ` You have ${trackedJobs.length} scored job${trackedJobs.length === 1 ? "" : "s"} saved.`
                : profileText
                ? " Your profile is saved and ready."
                : ""}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLanding(false)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white text-base font-semibold rounded-xl hover:bg-brand-accent/90 transition-colors"
              >
                Back to app →
              </button>
              <button
                onClick={handleSignOut}
                className="text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                Sign out
              </button>
            </div>
            <Link href="/how-it-works" className="mt-6 inline-block text-sm text-white/65 hover:text-white transition-colors underline underline-offset-2 decoration-white/30">
              How it works →
            </Link>
          </div>
        </div>
      );
    }

    // Not signed in — show magic link form
    return (
      <div className="min-h-screen bg-brand-text relative overflow-hidden flex items-center px-6">
        <div className="landing-gradient-spinner" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl mx-auto w-full py-20">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white tracking-tight"><SignalWordmark /></h1>
            <p className="text-sm text-white/40 mt-2">Job search copilot</p>
          </div>
          <p className="text-3xl font-medium text-white/80 leading-snug mb-5">
            Most job applications fail before anyone reads them — wrong fit, generic framing,
            nothing that makes the candidate stick.
          </p>
          <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
            Signal is a copilot for experienced professionals who want to apply to fewer, better-fit roles —
            and show up fully prepared for each one. Upload your resume once. Get an honest fit score,
            a tailoring brief that tells you exactly what to emphasize, and resume edits calibrated
            to your actual background.
          </p>

          {!magicLinkSent ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                  className="flex-1 px-4 py-3 bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl text-base focus:outline-none focus:border-white/50"
                />
                <button
                  onClick={handleSendMagicLink}
                  disabled={sendingMagicLink || !email.trim()}
                  className="px-6 py-4 bg-brand-accent text-white text-base font-semibold rounded-xl hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMagicLink ? "Sending…" : "Send magic link →"}
                </button>
              </div>
              {magicLinkError && (
                <p className="text-sm text-red-400">{magicLinkError}</p>
              )}
              <div className="flex items-center gap-5">
                <button
                  onClick={() => { setShowLanding(false); setActiveTab("profile"); }}
                  className="text-xs text-white/20 hover:text-white/35 transition-colors"
                >
                  Continue without saving →
                </button>
                <Link href="/how-it-works" className="text-sm text-white/65 hover:text-white transition-colors underline underline-offset-2 decoration-white/30">
                  How it works →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-base text-white/80">
                Check your inbox — we sent a link to <span className="text-white font-medium">{email}</span>.
              </p>
              <p className="text-sm text-white/40">
                Click the link in the email to sign in. It may take a minute to arrive.
              </p>
              <button
                onClick={() => { setMagicLinkSent(false); setMagicLinkError(""); }}
                className="text-sm text-white/30 hover:text-white/50 transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
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
            <h1 className="text-xl font-bold text-white tracking-tight hover:text-white/80 transition-colors"><SignalWordmark /></h1>
            <p className="text-sm text-white/40 mt-0.5">Job search copilot</p>
          </button>
          <div className="flex items-center gap-4">
            {(profileText || jobDescription) && (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className={`flex items-center gap-1 ${profileText ? "text-status-apply" : "text-white/30"}`}>
                  {profileText && <span>✓</span>} Profile
                </span>
                <span className="text-white/20">·</span>
                <span className={`flex items-center gap-1 ${jobDescription ? "text-status-apply" : "text-white/30"}`}>
                  {jobDescription && <span>✓</span>} Job scored
                </span>
                <span className="text-white/20">·</span>
                <span className={`flex items-center gap-1 ${tailoringResult ? "text-status-apply" : "text-white/30"}`}>
                  {tailoringResult && <span>✓</span>} Prep
                </span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <Link href="/how-it-works" className="text-sm text-white/60 hover:text-white/90 transition-colors hidden sm:block">
                How it works
              </Link>
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/40 hidden sm:block">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-white/50 hover:text-white/80 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-brand-text/8 shadow-sm">
        <div className="max-w-4xl mx-auto px-6">
          <nav className="flex items-center" aria-label="Tabs">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 text-base font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-brand-accent text-brand-accent"
                    : "border-transparent text-brand-text/40 hover:text-brand-text/70 hover:border-brand-text/20"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* My Jobs — right-aligned */}
            <div className="ml-auto">
              <button
                onClick={() => setActiveTab("my-jobs")}
                className={`flex items-center gap-2 px-5 py-4 text-base font-medium border-b-2 transition-all ${
                  activeTab === "my-jobs"
                    ? "border-brand-accent text-brand-accent"
                    : "border-transparent text-brand-text/40 hover:text-brand-text/70 hover:border-brand-text/20"
                }`}
              >
                My Jobs
                {trackedJobs.length > 0 && (
                  <span className="min-w-[1.25rem] h-5 flex items-center justify-center text-xs font-semibold bg-brand-accent/20 text-brand-accent ring-1 ring-brand-accent/30 px-1.5 rounded-full">
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
              <h2 className="text-lg font-semibold text-brand-text">Your Profile</h2>
              <p className="text-base text-brand-text/50 mt-1">
                Upload your resume (PDF or DOCX) or paste the text. This is the foundation for all analysis.
              </p>
            </div>

            {/* Resume loaded card — shown when profile exists and not in update mode */}
            {profileText && !updatingProfile ? (
              <div className="rounded-2xl border border-brand-text/10 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-brand-text">Resume saved</p>
                    <p className="mt-1.5 text-sm text-brand-text/40 font-mono leading-relaxed line-clamp-3">
                      {profileText.slice(0, 240)}…
                    </p>
                  </div>
                  <button
                    onClick={() => setUpdatingProfile(true)}
                    className="shrink-0 text-sm text-brand-accent hover:text-brand-accent/70 font-medium transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {updatingProfile && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-brand-text/50">Upload or paste a new resume to replace the saved one.</p>
                    <button
                      onClick={() => setUpdatingProfile(false)}
                      className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <ProfileUploader onProfileConfirmed={handleProfileConfirmed} />
              </div>
            )}

            {profileText && !updatingProfile && !isAnalyzing && (
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

            {clusterResult && !isAnalyzing && !updatingProfile && (
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
                  <h2 className="text-lg font-semibold text-brand-text">Job Fit Scorer</h2>
                  <p className="text-base text-brand-text/50 mt-1">
                    Paste a job description or fetch from URL. Get an honest fit score with clear reasoning.
                  </p>
                </div>
                {activeJobId && trackedJobs.find(j => j.id === activeJobId) && (
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <JobLabelEditor
                      id={activeJobId}
                      label={trackedJobs.find(j => j.id === activeJobId)!.label}
                      onRename={handleRenameJob}
                      className="text-2xl font-bold"
                    />
                    <button
                      onClick={handleJobFitReset}
                      className="shrink-0 px-4 py-2 bg-brand-text/8 text-brand-text/60 text-sm font-medium rounded-xl hover:bg-brand-text/14 transition-colors whitespace-nowrap"
                    >
                      + Score another job
                    </button>
                  </div>
                )}
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

        {/* ── Prep tab ── */}
        {activeTab === "tailoring-brief" && (
          <div>
            <div className="mb-7">
              <h2 className="text-lg font-semibold text-brand-text">Prep</h2>
              <p className="text-base text-brand-text/50 mt-1">
                Tailoring brief, outreach draft, and resume edits — everything you need to apply with confidence.
              </p>
            </div>
            {activeJobId && trackedJobs.find(j => j.id === activeJobId) && (
              <div className="mb-6">
                <JobLabelEditor
                  id={activeJobId}
                  label={trackedJobs.find(j => j.id === activeJobId)!.label}
                  onRename={handleRenameJob}
                  className="text-2xl font-bold"
                />
              </div>
            )}
            <TailoringBrief
              profileText={profileText}
              jobDescription={jobDescription}
              result={tailoringResult}
              onResultChange={handleTailoringResult}
              outreachResult={outreachResult}
              onOutreachResultChange={handleOutreachResult}
              coverLetterResult={coverLetterResult}
              onCoverLetterResultChange={handleCoverLetterResult}
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
                Every job you&apos;ve scored. Click any job to reload its fit results or tailoring brief.
              </p>
            </div>
            <JobTracker
              jobs={trackedJobs}
              onSelectJob={handleSelectJob}
              onRemoveJob={handleRemoveJob}
              onRenameJob={handleRenameJob}
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
