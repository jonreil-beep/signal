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
  { id: "my-jobs",        label: "My Jobs" },
  { id: "profile",        label: "Profile" },
  { id: "job-fit",        label: "Job Fit" },
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
  const [activeTab, setActiveTab] = useState<TabId>("my-jobs");
  // Guards the save effects so they don't overwrite sessionStorage before restoration runs
  const [sessionRestored, setSessionRestored] = useState(false);
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

  // ── Restore tab, landing state + active job from sessionStorage after hydration ──
  useEffect(() => {
    const savedTab = sessionStorage.getItem("signal-active-tab") as TabId | null;
    const valid: TabId[] = ["profile", "job-fit", "tailoring-brief", "my-jobs"];
    if (savedTab && valid.includes(savedTab)) setActiveTab(savedTab);

    // Restore guest "dismissed landing" state so refresh doesn't kick them back to landing
    if (sessionStorage.getItem("signal-show-landing") === "false") setShowLanding(false);

    const savedJobId = sessionStorage.getItem("signal-active-job-id");
    if (savedJobId) setActiveJobId(savedJobId);

    setSessionRestored(true);
  }, []);

  // ── Persist active tab (only after restoration so we don't clobber saved state) ──
  useEffect(() => {
    if (!sessionRestored) return;
    sessionStorage.setItem("signal-active-tab", activeTab);
  }, [activeTab, sessionRestored]);

  // ── Persist landing visibility — lets guests survive a refresh without returning to landing ──
  useEffect(() => {
    if (!sessionRestored) return;
    sessionStorage.setItem("signal-show-landing", String(showLanding));
  }, [showLanding, sessionRestored]);

  // ── Persist active job id ──
  useEffect(() => {
    if (!sessionRestored) return;
    if (activeJobId) {
      sessionStorage.setItem("signal-active-job-id", activeJobId);
    } else {
      sessionStorage.removeItem("signal-active-job-id");
    }
  }, [activeJobId, sessionRestored]);

  // ── Auth lifecycle ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Do NOT force setShowLanding(false) here — sessionStorage restoration already
        // handles where the user was (app vs. welcome-back screen). Overriding it here
        // caused refresh-on-welcome-back to dump users onto the Profile tab.
        loadUserData(session.user.id);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        // Only push into the app if the user wasn't intentionally on the welcome-back
        // screen. SIGNED_IN fires on token refreshes too (not just fresh sign-ins), so
        // blindly calling setShowLanding(false) here caused refreshes from the
        // welcome-back screen to drop the user into the app.
        if (sessionStorage.getItem("signal-show-landing") !== "true") {
          setShowLanding(false);
        }
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

      // Restore active job state so refreshing on job-fit / prep keeps the job loaded
      const savedJobId = sessionStorage.getItem("signal-active-job-id");
      if (savedJobId) {
        const job = jobs.find((j) => j.id === savedJobId);
        if (job) {
          setJobDescription(job.jobDescription);
          setJobFitResult(job.jobFitResult);
          setTailoringResult(job.tailoringResult ?? null);
          setOutreachResult(job.outreachResult ?? null);
          setCoverLetterResult(job.coverLetterResult ?? null);
          setResumeUpdateResult(job.resumeUpdateResult ?? null);
        }
      }
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
    setActiveTab("my-jobs");
    sessionStorage.removeItem("signal-active-tab");
    sessionStorage.removeItem("signal-active-job-id");
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

  // Called when user dismisses false-positive "What's Missing" items and re-scores.
  // Updates the existing tracked job in place rather than creating a new one.
  async function handleJobFitUpdated(result: JobFitResult) {
    setJobFitResult(result);
    setTailoringResult(null);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) =>
          j.id === activeJobId
            ? { ...j, jobFitResult: result, tailoringResult: null, outreachResult: null, coverLetterResult: null, resumeUpdateResult: null }
            : j
        )
      );
      if (user) {
        await supabase
          .from("tracked_jobs")
          .update({ job_fit_result: result, tailoring_result: null, outreach_result: null, cover_letter_result: null, resume_update_result: null })
          .eq("id", activeJobId);
      }
    }
  }

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
              <p className="text-sm text-white/40 mt-2">Job search intelligence</p>
            </div>
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
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
            <p className="text-sm text-white/40 mt-2">Job search intelligence</p>
          </div>
          <p className="text-3xl font-medium text-white/80 leading-snug mb-5">
            Most job applications fail before anyone reads them: wrong fit, generic framing,
            nothing that makes the candidate stick.
          </p>
          <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
            Signal is built for experienced professionals who want to apply to fewer, better-fit roles —
            and show up fully prepared for each one. Upload your resume once. Get an honest fit score,
            a targeted prep guide covering exactly what to emphasize, and resume edits calibrated
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
                  className="flex-1 px-4 py-3 bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-2xl sm:rounded-full text-base focus:outline-none focus:border-white/50"
                />
                <button
                  onClick={handleSendMagicLink}
                  disabled={sendingMagicLink || !email.trim()}
                  className="px-6 py-4 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMagicLink ? "Sending…" : "Send magic link →"}
                </button>
              </div>
              {magicLinkError && (
                <p className="text-sm text-red-400">{magicLinkError}</p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 px-5 py-3 border border-white/20 text-white text-sm font-medium rounded-2xl sm:rounded-full hover:border-white/40 hover:bg-white/5 transition-colors"
                >
                  How Signal works →
                </Link>
                <button
                  onClick={() => setShowLanding(false)}
                  className="text-sm text-white/30 hover:text-white/50 transition-colors"
                >
                  Try without signing up
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-base text-white/80">
                Check your inbox. We sent a link to <span className="text-white font-medium">{email}</span>.
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
            <p className="text-sm text-white/40 mt-0.5">Job search intelligence</p>
          </button>
          <div className="flex items-center gap-4">
            <Link href="/how-it-works" className="text-sm text-white/50 hover:text-white/80 transition-colors hidden sm:block">
              How it works
            </Link>
            {user && (
              <>
                <span className="text-white/15 hidden sm:block">|</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/35 hidden sm:block">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-white/50 hover:text-white/80 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
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
                className={`flex items-center gap-2 px-5 py-4 text-base font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-brand-accent text-brand-accent"
                    : "border-transparent text-brand-text/40 hover:text-brand-text/70 hover:border-brand-text/20"
                }`}
              >
                {tab.label}
                {tab.id === "my-jobs" && trackedJobs.length > 0 && (
                  <span className="min-w-[1.25rem] h-5 flex items-center justify-center text-xs font-semibold bg-brand-accent/20 text-brand-accent ring-1 ring-brand-accent/30 px-1.5 rounded-full">
                    {trackedJobs.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Save-progress banner — guest users only */}
      {!user && (
        <div className="border-b border-brand-text/8 bg-brand-bg">
          <div className="max-w-4xl mx-auto px-6 py-4">
            {!magicLinkSent ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-text">Your progress won&apos;t be saved</p>
                  <p className="text-xs text-brand-text/50 mt-0.5">
                    Sign up with email to save your resume, job scores, and prep guides across sessions and devices.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                    className="w-48 px-3 py-2 text-sm border border-brand-text/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMagicLink}
                    disabled={sendingMagicLink || !email.trim()}
                    className="px-4 py-2 bg-brand-accent text-white text-sm font-semibold rounded-xl hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {sendingMagicLink ? "Sending…" : "Save my progress"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-brand-text/70">
                  Check your inbox — we sent a link to <span className="font-medium text-brand-text">{email}</span>.
                  Click it to sign in and save everything.
                </p>
                <button
                  onClick={() => { setMagicLinkSent(false); setMagicLinkError(""); }}
                  className="shrink-0 text-xs text-brand-text/40 hover:text-brand-text/70 transition-colors"
                >
                  Use different email
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab content */}
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <div>
            <div className="mb-7">
              <h2 className="text-lg font-semibold text-brand-text">
                {profileText ? "Your Profile" : "Step 1 — Add your profile"}
              </h2>
              <p className="text-base text-brand-text/50 mt-1">
                {profileText
                  ? "Your resume is saved. Update it any time and your scores will reflect the change."
                  : "Upload your resume (PDF or DOCX) or paste the text. Signal uses this as the foundation for every fit score and prep guide."}
              </p>
            </div>

            {/* Resume loaded card — shown when profile exists and not in update mode */}
            {profileText && !updatingProfile ? (
              <div className="rounded-2xl bg-white p-5 shadow">
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
                        : "Signal will map your best-fit roles, strengths, and risks."}
                    </p>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    className="shrink-0 px-5 py-2.5 bg-brand-accent text-white text-sm font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
                  >
                    {clusterResult ? "Re-analyze" : "Analyze My Profile"}
                  </button>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-6 pt-6 border-t border-brand-text/8">
                <LoadingState message="Analyzing your profile. This takes about 20 seconds..." />
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
                    className="inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
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
                  jobDescription={jobDescription}
                  result={jobFitResult}
                  onJobScored={handleJobScored}
                  onJobFitUpdated={handleJobFitUpdated}
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
                Prep guide, outreach draft, and resume edits. Everything you need to apply with confidence.
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
              <h2 className="text-lg font-semibold text-brand-text">My Jobs</h2>
              <p className="text-base text-brand-text/50 mt-1">
                {trackedJobs.length > 0
                  ? "Every job you\u2019ve scored. Click any job to reload its fit results or prep guide."
                  : "Follow the steps below to score your first job and build your prep guide."}
              </p>
            </div>
            <JobTracker
              jobs={trackedJobs}
              hasProfile={!!profileText}
              onSelectJob={handleSelectJob}
              onRemoveJob={handleRemoveJob}
              onRenameJob={handleRenameJob}
              onGoToProfile={() => setActiveTab("profile")}
              onGoToJobFit={() => setActiveTab("job-fit")}
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
        className="mt-5 inline-flex items-center gap-1 px-4 py-2 bg-brand-accent text-white text-sm font-medium rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
      >
        {action} →
      </button>
    </div>
  );
}
