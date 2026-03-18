"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import ProfileUploader from "@/components/ProfileUploader";
import RoleClusterResults from "@/components/RoleClusterResults";
import JobFitScorer from "@/components/JobFitScorer";
import TailoringBrief from "@/components/TailoringBrief";
import JobDiscovery from "@/components/JobDiscovery";
import JobTracker from "@/components/JobTracker";
import JobLabelEditor from "@/components/JobLabelEditor";
import LoadingState from "@/components/LoadingState";
import SignalWordmark from "@/components/SignalWordmark";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import type { TabId, RoleClusterResult, JobFitResult, TailoringBriefResult, OutreachResult, CoverLetterResult, ResumeUpdateResult, InterviewPrepResult, FollowUpResult, CompanyResearchResult, LinkedInHeadlineResult, LinkedInHeadlineOption, TrackedJob, ApplicationStatus } from "@/types";

const MAIN_TABS: { id: TabId; label: string }[] = [
  { id: "my-jobs",        label: "My Jobs" },
  { id: "profile",        label: "Profile" },
  { id: "discover",       label: "Discover" },
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
  const [isNewSignup, setIsNewSignup] = useState(false);

  // ── Detect new signup from ?welcome=true param ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "true") {
      setIsNewSignup(true);
      // Clean the param from the URL without a reload
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);

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
  const [writingSample, setWritingSample] = useState<string>("");
  const [pivotTarget, setPivotTarget] = useState<string>("");
  const [resumeSource, setResumeSource] = useState<"paste" | "file" | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [savedProfileSnapshot, setSavedProfileSnapshot] = useState<{
    resumeText: string; writingSample: string; pivotTarget: string;
  } | null>(null);
  const [localStorageLoaded, setLocalStorageLoaded] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [clusterResult, setClusterResult] = useState<RoleClusterResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string>("");
  const [headlineResult, setHeadlineResult] = useState<LinkedInHeadlineResult | null>(null);
  const [isGeneratingHeadlines, setIsGeneratingHeadlines] = useState(false);
  const [headlineError, setHeadlineError] = useState<string>("");

  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobFitResult, setJobFitResult] = useState<JobFitResult | null>(null);
  const [tailoringResult, setTailoringResult] = useState<TailoringBriefResult | null>(null);
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);
  const [coverLetterResult, setCoverLetterResult] = useState<CoverLetterResult | null>(null);
  const [resumeUpdateResult, setResumeUpdateResult] = useState<ResumeUpdateResult | null>(null);

  const [interviewPrepResult, setInterviewPrepResult] = useState<InterviewPrepResult | null>(null);
  const [followUpResult, setFollowUpResult] = useState<FollowUpResult | null>(null);
  const [companyResearchResult, setCompanyResearchResult] = useState<CompanyResearchResult | null>(null);

  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [profileUpdatedAt, setProfileUpdatedAt] = useState<Date | null>(null);

  // (Discover tab is now search-terms-only — no discovery state needed)

  // ── Restore tab, landing state + active job from sessionStorage after hydration ──
  useEffect(() => {
    const savedTab = sessionStorage.getItem("signal-active-tab") as TabId | null;
    const valid: TabId[] = ["profile", "job-fit", "tailoring-brief", "my-jobs", "discover"];
    if (savedTab && valid.includes(savedTab)) setActiveTab(savedTab);

    // Restore guest "dismissed landing" state so refresh doesn't kick them back to landing
    if (sessionStorage.getItem("signal-show-landing") === "false") setShowLanding(false);

    const savedJobId = sessionStorage.getItem("signal-active-job-id");
    if (savedJobId) setActiveJobId(savedJobId);

    // Restore profile staleness timestamp so "Profile updated" indicators survive refresh
    const savedProfileUpdatedAt = sessionStorage.getItem("signal-profile-updated-at");
    if (savedProfileUpdatedAt) {
      setProfileUpdatedAt(new Date(savedProfileUpdatedAt));
    }

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

  // ── Persist profile staleness timestamp so indicators survive refresh ──
  useEffect(() => {
    if (!sessionRestored) return;
    if (profileUpdatedAt) {
      sessionStorage.setItem("signal-profile-updated-at", profileUpdatedAt.toISOString());
    } else {
      sessionStorage.removeItem("signal-profile-updated-at");
    }
  }, [profileUpdatedAt, sessionRestored]);

  // ── localStorage: load profile fields, snapshot, and JD on mount ──
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("signal_profile");
      if (savedProfile) {
        const p = JSON.parse(savedProfile) as {
          resumeText?: string | null;
          writingSample?: string;
          pivotTarget?: string;
          fromFile?: boolean;
          fileName?: string;
        };
        if (p.writingSample) setWritingSample(p.writingSample);
        if (p.pivotTarget) setPivotTarget(p.pivotTarget);
        if (!p.fromFile && p.resumeText) {
          setProfileText(p.resumeText);
          setResumeSource("paste");
        } else if (p.fromFile) {
          setResumeSource("file");
          setResumeFileName(p.fileName ?? "");
        }
      }
      const savedSnapshot = localStorage.getItem("signal_profile_snapshot");
      if (savedSnapshot) setSavedProfileSnapshot(JSON.parse(savedSnapshot));
      const savedJD = localStorage.getItem("signal_jd");
      if (savedJD) {
        const j = JSON.parse(savedJD) as { jobDescription?: string };
        if (j.jobDescription) setJobDescription(j.jobDescription);
      }
    } catch { /* ignore parse errors */ }
    setLocalStorageLoaded(true);
  }, []);

  // ── localStorage: persist profile fields when they change ──
  useEffect(() => {
    if (!localStorageLoaded) return;
    try {
      localStorage.setItem("signal_profile", JSON.stringify({
        resumeText: resumeSource !== "file" ? profileText : null,
        writingSample,
        pivotTarget,
        fromFile: resumeSource === "file",
        fileName: resumeFileName,
      }));
    } catch { /* ignore quota errors */ }
  }, [profileText, writingSample, pivotTarget, resumeSource, resumeFileName, localStorageLoaded]);

  // ── localStorage: persist JD field when it changes ──
  useEffect(() => {
    if (!localStorageLoaded) return;
    try {
      localStorage.setItem("signal_jd", JSON.stringify({ jobDescription }));
    } catch { /* ignore quota errors */ }
  }, [jobDescription, localStorageLoaded]);

  // ── Initialize snapshot when a cluster result exists but no saved snapshot ──
  // Covers the case where the user refreshed and localStorage snapshot was cleared
  useEffect(() => {
    if (!localStorageLoaded || !clusterResult || savedProfileSnapshot || !profileText) return;
    setSavedProfileSnapshot({ resumeText: profileText, writingSample, pivotTarget });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterResult, localStorageLoaded]);

  // ── Handle browser back/forward navigation ──
  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const state = event.state as { signalTab?: string } | null;
      const valid: TabId[] = ["profile", "job-fit", "tailoring-brief", "my-jobs", "discover"];
      if (state?.signalTab && valid.includes(state.signalTab as TabId)) {
        setActiveTab(state.signalTab as TabId);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
      setResumeSource("paste"); // text from Supabase is treated as pasted (safe to persist)
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
        interviewPrepResult: row.interview_prep_result as InterviewPrepResult | null,
        followUpResult: row.follow_up_result as FollowUpResult | null,
        companyResearchResult: row.company_research_result as CompanyResearchResult | null,
        deadline: (row.deadline as string) ?? null,
        scoredAt: new Date(row.scored_at as string),
        applicationStatus: (row.application_status as ApplicationStatus) ?? "Tracking",
        notes: (row.notes as string) ?? "",
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
          setInterviewPrepResult(job.interviewPrepResult ?? null);
          setFollowUpResult(job.followUpResult ?? null);
          setCompanyResearchResult(job.companyResearchResult ?? null);
        }
      }
    }
  }

  function clearAppState() {
    setProfileText("");
    setWritingSample("");
    setPivotTarget("");
    setResumeSource(null);
    setResumeFileName("");
    setSavedProfileSnapshot(null);
    setClusterResult(null);
    setHeadlineResult(null);
    setHeadlineError("");
    setJobDescription("");
    setJobFitResult(null);
    setTailoringResult(null);
    setOutreachResult(null);
    setCoverLetterResult(null);
    setResumeUpdateResult(null);
    setInterviewPrepResult(null);
    setFollowUpResult(null);
    setCompanyResearchResult(null);
    setTrackedJobs([]);
    setActiveJobId(null);
    setProfileUpdatedAt(null);
    setActiveTab("my-jobs");
    sessionStorage.removeItem("signal-active-tab");
    sessionStorage.removeItem("signal-active-job-id");
    sessionStorage.removeItem("signal-profile-updated-at");
    localStorage.removeItem("signal_profile");
    localStorage.removeItem("signal_profile_snapshot");
    localStorage.removeItem("signal_jd");
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
      const msg = error.message.toLowerCase();
      if (msg.includes("rate") || msg.includes("too many")) {
        setMagicLinkError("Too many sign-in emails sent to this address. Please wait a few minutes, then try again or use a different email.");
      } else {
        setMagicLinkError("Something went wrong sending the email. Please try again.");
      }
    } else {
      setMagicLinkSent(true);
    }
  }

  // ── Profile ──
  async function handleProfileConfirmed(text: string, source: "paste" | "file", fileName?: string) {
    // If a profile already exists and there are scored jobs, mark as updated so job cards show staleness
    if (profileText && trackedJobs.length > 0) {
      setProfileUpdatedAt(new Date());
    }
    setProfileText(text);
    setResumeSource(source);
    setResumeFileName(fileName ?? "");
    // Resume text changed — clear snapshot so button shows "Analyze Profile" ready state
    setSavedProfileSnapshot(null);
    localStorage.removeItem("signal_profile_snapshot");
    setClusterResult(null);
    setAnalyzeError("");
    setHeadlineResult(null);
    setHeadlineError("");
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
        const snapshot = { resumeText: profileText, writingSample, pivotTarget };
        setSavedProfileSnapshot(snapshot);
        try { localStorage.setItem("signal_profile_snapshot", JSON.stringify(snapshot)); } catch { /* ignore */ }
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

  async function handleGenerateHeadlines() {
    if (!profileText) return;
    setIsGeneratingHeadlines(true);
    setHeadlineError("");
    setHeadlineResult(null);
    try {
      const response = await fetch("/api/linkedin-headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, writingSample: writingSample || undefined, pivotTarget: pivotTarget || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        setHeadlineError(data.error ?? "Failed to generate headlines. Please try again.");
      } else {
        setHeadlineResult(data as LinkedInHeadlineResult);
      }
    } catch {
      setHeadlineError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingHeadlines(false);
    }
  }

  // ── Job tracking ──

  // Called when user dismisses false-positive "What's Missing" items and re-scores.
  // Updates the existing tracked job in place rather than creating a new one.
  async function handleJobFitUpdated(result: JobFitResult) {
    const rescoreAt = new Date();
    setJobFitResult(result);
    setTailoringResult(null);
    setInterviewPrepResult(null);
    setFollowUpResult(null);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) =>
          j.id === activeJobId
            ? { ...j, scoredAt: rescoreAt, jobFitResult: result, tailoringResult: null, outreachResult: null, coverLetterResult: null, resumeUpdateResult: null, interviewPrepResult: null, followUpResult: null }
            : j
        )
      );
      if (user) {
        await supabase
          .from("tracked_jobs")
          .update({ scored_at: rescoreAt.toISOString(), job_fit_result: result, tailoring_result: null, outreach_result: null, cover_letter_result: null, resume_update_result: null, interview_prep_result: null, follow_up_result: null })
          .eq("id", activeJobId);
      }
    }
  }

  async function handleJobScored(jd: string, result: JobFitResult) {
    const id = crypto.randomUUID();
    const label = result.job_title?.trim() || extractJobTitle(jd, trackedJobs.length + 1);
    const newJob: TrackedJob = {
      id,
      label,
      jobDescription: jd,
      jobFitResult: result,
      tailoringResult: null,
      outreachResult: null,
      coverLetterResult: null,
      resumeUpdateResult: null,
      interviewPrepResult: null,
      followUpResult: null,
      companyResearchResult: null,
      deadline: null,
      scoredAt: new Date(),
      applicationStatus: "Tracking",
      notes: "",
    };
    setTrackedJobs((prev) => [...prev, newJob]);
    setActiveJobId(id);
    setJobDescription(jd);
    setJobFitResult(result);
    setTailoringResult(null);
    setOutreachResult(null);
    setCoverLetterResult(null);
    setResumeUpdateResult(null);
    setInterviewPrepResult(null);
    setFollowUpResult(null);

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
        application_status: "Tracking",
      });
    }
  }

  async function handleTailoringResult(result: TailoringBriefResult) {
    setTailoringResult(result);
    setOutreachResult(null);
    setCoverLetterResult(null);
    setInterviewPrepResult(null);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, tailoringResult: result, outreachResult: null, coverLetterResult: null, interviewPrepResult: null } : j))
      );
      if (user) {
        await supabase.from("tracked_jobs").update({ tailoring_result: result, outreach_result: null, cover_letter_result: null, interview_prep_result: null }).eq("id", activeJobId);
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

  async function handleInterviewPrepResult(result: InterviewPrepResult | null) {
    setInterviewPrepResult(result);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, interviewPrepResult: result } : j))
      );
      if (user) {
        await supabase.from("tracked_jobs").update({ interview_prep_result: result }).eq("id", activeJobId);
      }
    }
  }

  async function handleFollowUpResult(result: FollowUpResult | null) {
    setFollowUpResult(result);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, followUpResult: result } : j))
      );
      if (user) {
        await supabase.from("tracked_jobs").update({ follow_up_result: result }).eq("id", activeJobId);
      }
    }
  }

  async function handleCompanyResearchResult(result: CompanyResearchResult | null) {
    setCompanyResearchResult(result);
    if (activeJobId) {
      setTrackedJobs((prev) =>
        prev.map((j) => (j.id === activeJobId ? { ...j, companyResearchResult: result } : j))
      );
      if (user) {
        await supabase.from("tracked_jobs").update({ company_research_result: result }).eq("id", activeJobId);
      }
    }
  }

  async function handleDeadlineChange(id: string, deadline: string | null) {
    setTrackedJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, deadline } : j))
    );
    if (user) {
      await supabase.from("tracked_jobs").update({ deadline }).eq("id", id);
    }
  }

  function handleJobFitReset() {
    setJobDescription("");
    setJobFitResult(null);
    setTailoringResult(null);
    setOutreachResult(null);
    setCoverLetterResult(null);
    setResumeUpdateResult(null);
    setInterviewPrepResult(null);
    setFollowUpResult(null);
    setCompanyResearchResult(null);
    setActiveJobId(null);
  }

  function handleSelectJob(job: TrackedJob, goTo: "job-fit" | "tailoring-brief") {
    // Push history so the browser back button returns to My Jobs
    window.history.replaceState({ signalTab: "my-jobs" }, "");
    window.history.pushState({ signalTab: goTo }, "");
    setActiveJobId(job.id);
    setJobDescription(job.jobDescription);
    setJobFitResult(job.jobFitResult);
    setTailoringResult(job.tailoringResult);
    setOutreachResult(job.outreachResult);
    setCoverLetterResult(job.coverLetterResult);
    setResumeUpdateResult(job.resumeUpdateResult);
    setInterviewPrepResult(job.interviewPrepResult);
    setFollowUpResult(job.followUpResult);
    setCompanyResearchResult(job.companyResearchResult);
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

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    setTrackedJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, applicationStatus: status } : j))
    );
    if (user) {
      await supabase.from("tracked_jobs").update({ application_status: status }).eq("id", id);
    }
  }

  async function handleNotesChange(id: string, notes: string) {
    setTrackedJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, notes } : j))
    );
    if (user) {
      await supabase.from("tracked_jobs").update({ notes }).eq("id", id);
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
    // Signed in — show welcome (new) or welcome back (returning) view
    if (user) {
      return (
        <div className="min-h-screen bg-brand-text relative overflow-hidden flex items-center px-6">
          <div className="landing-gradient-spinner" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl mx-auto w-full py-20">
            <div className="mb-10">
              <h1 className="text-5xl font-bold text-white tracking-tight"><SignalWordmark /></h1>
              <p className="text-sm text-white/40 mt-2">Smarter search for experienced professionals</p>
            </div>
            <p className="text-2xl text-white/80 leading-relaxed mb-10">
              {isNewSignup
                ? "You're all set. Signal is ready to help you apply to fewer, better-fit roles — and show up fully prepared for each one."
                : `Welcome back${user.email ? `, ${user.email}` : ""}.${
                    trackedJobs.length > 0
                      ? ` You have ${trackedJobs.length} scored job${trackedJobs.length === 1 ? "" : "s"} saved.`
                      : profileText
                      ? " Your profile is saved and ready."
                      : ""
                  }`}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLanding(false)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
              >
                {isNewSignup ? "Get started →" : "Back to app →"}
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
            <p className="text-sm text-white/40 mt-2">Smarter search for experienced professionals</p>
          </div>
          <p className="text-3xl font-medium text-white/80 leading-snug mb-5">
            Most experienced professionals don&apos;t lose opportunities because they lack experience.
            They lose them because the fit is unclear, the framing is generic, or they spend
            time on roles that were never a real match.
          </p>
          <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
            Signal helps you understand how your background is likely to be read, identify the
            roles worth pursuing, and prepare thoroughly for the ones that matter. Upload your
            resume once — Signal does the rest.
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
                  className="flex-1 px-4 py-3 bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-2xl sm:rounded-full text-base focus:outline-none focus:ring-0 focus:border-white/50 transition-colors"
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
                  onClick={() => { setShowLanding(false); setActiveTab("my-jobs"); }}
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

      <AppHeader
        compact
        logoSlot={
          <button onClick={() => setShowLanding(true)} className="text-left">
            <p className="text-xl font-bold text-white tracking-tight hover:text-white/80 transition-colors"><SignalWordmark /></p>
          </button>
        }
        rightSlot={
          user ? (
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                {/* Avatar — first initial */}
                <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-semibold text-white leading-none">
                    {((user.user_metadata?.full_name as string | undefined) ?? user.email ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                {/* Username — email prefix only */}
                <span className="text-[14px] text-white/40 hidden sm:block">
                  {user.email ? user.email.split("@")[0] : ""}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[14px] text-white/40 hover:text-white/70 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : null
        }
      />

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
                <div className="flex flex-col gap-1.5 shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                      className="w-48 px-3 py-2 text-sm border border-brand-text/15 rounded-xl bg-white focus:outline-none focus:ring-0 focus:border-brand-text/30 transition-colors"
                    />
                    <button
                      onClick={handleSendMagicLink}
                      disabled={sendingMagicLink || !email.trim()}
                      className="px-4 py-2 bg-brand-accent text-white text-sm font-semibold rounded-xl hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {sendingMagicLink ? "Sending…" : "Save my progress"}
                    </button>
                  </div>
                  {magicLinkError && (
                    <p className="text-xs text-red-500 max-w-xs">{magicLinkError}</p>
                  )}
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

            {/* No profile yet: onboarding header + uploader */}
            {!profileText && (
              <>
                <div className="mb-7">
                  <h2 className="text-lg font-semibold text-brand-text">Step 1 — Clarify your positioning</h2>
                  <p className="text-base text-brand-text/50 mt-1">
                    Upload your resume once. Signal identifies your strongest role clusters, surfaces positioning risks, and adapts every fit score, prep guide, and resume edit to your specific background.
                  </p>
                </div>
                <ProfileUploader onProfileConfirmed={handleProfileConfirmed} />
              </>
            )}

            {/* Profile exists — collapsed status row */}
            {profileText && !editingProfile && (
              <div className="flex items-center justify-between gap-3 py-3.5 px-5 bg-white rounded-2xl shadow mb-6">
                <div className="flex items-center gap-2 flex-wrap text-sm min-w-0">
                  <span className="font-semibold text-brand-text">Your profile</span>
                  <span className="text-brand-text/20">·</span>
                  <span className="text-brand-text/50">
                    {resumeSource === "file" && resumeFileName ? resumeFileName : "Resume saved"}
                  </span>
                  {writingSample.trim() && (
                    <>
                      <span className="text-brand-text/20">·</span>
                      <span className="text-brand-text/50">Writing sample added</span>
                    </>
                  )}
                  {pivotTarget.trim() && (
                    <>
                      <span className="text-brand-text/20">·</span>
                      <span className="text-brand-text/50">Pivot target set</span>
                    </>
                  )}
                  {clusterResult && (
                    <>
                      <span className="text-brand-text/20">·</span>
                      <span className="text-xs text-brand-text/35">Analyzed</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {!clusterResult && !isAnalyzing && (
                    <button
                      onClick={handleAnalyze}
                      className="text-sm font-semibold text-brand-accent hover:text-brand-accent/70 transition-colors"
                    >
                      Analyze →
                    </button>
                  )}
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="text-sm text-brand-text/40 hover:text-brand-text/70 font-medium transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}

            {/* Profile exists — expanded editing state */}
            {profileText && editingProfile && (
              <div className="mb-6 space-y-4">
                {/* Resume card */}
                {!updatingProfile ? (
                  <div className="rounded-2xl bg-white p-5 shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-brand-text">
                          {resumeSource === "file" && resumeFileName ? resumeFileName : "Resume saved"}
                        </p>
                        <p className="mt-1.5 text-sm text-brand-text/40 font-mono leading-relaxed line-clamp-3">
                          {profileText.slice(0, 240)}…
                        </p>
                        {!user && resumeSource === "file" && (
                          <p className="mt-2 text-xs text-brand-text/40">
                            Uploaded from file — re-upload if you refresh the page.
                          </p>
                        )}
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
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-brand-text/50">Upload or paste a new resume to replace the saved one.</p>
                      <button
                        onClick={() => setUpdatingProfile(false)}
                        className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <ProfileUploader onProfileConfirmed={handleProfileConfirmed} />
                  </div>
                )}

                {/* Writing sample */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="block text-sm font-medium text-brand-text">
                      Writing sample <span className="font-normal text-brand-text/40">(optional)</span>
                    </label>
                    {writingSample.trim() && (
                      <span className="text-xs text-brand-text/35">Auto-saved · used on next generation</span>
                    )}
                  </div>
                  <textarea
                    value={writingSample}
                    onChange={(e) => setWritingSample(e.target.value)}
                    placeholder="Paste 2–3 sentences you've written professionally — an email, bio, or message that sounds like you. Signal uses this to match your voice in cover letters, outreach, and follow-ups."
                    rows={3}
                    className="w-full text-sm text-brand-text/80 bg-white rounded-xl px-3.5 py-3 border border-brand-text/12 focus:border-brand-text/30 focus:outline-none focus:ring-0 resize-none placeholder:text-brand-text/30 shadow-sm"
                  />
                </div>

                {/* Pivot target */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="block text-sm font-medium text-brand-text">
                      Targeting a pivot? <span className="font-normal text-brand-text/40">(optional)</span>
                    </label>
                    {pivotTarget.trim() && (
                      <span className="text-xs text-brand-text/35">Auto-saved · used on next generation</span>
                    )}
                  </div>
                  <textarea
                    value={pivotTarget}
                    onChange={(e) => setPivotTarget(e.target.value)}
                    placeholder="Optional: Describe the type of role you're trying to move toward — even if it's not an obvious fit for your background. Example: 'I want to move from brand strategy into a chief of staff or business operations role at a growth-stage startup.'"
                    rows={3}
                    className="w-full text-sm text-brand-text/80 bg-white rounded-xl px-3.5 py-3 border border-brand-text/12 focus:border-brand-text/30 focus:outline-none focus:ring-0 resize-none placeholder:text-brand-text/30 shadow-sm"
                  />
                </div>

                {/* Save & Reanalyze / Cancel */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={() => { setEditingProfile(false); setUpdatingProfile(false); handleAnalyze(); }}
                    className="px-5 py-2.5 text-sm font-semibold rounded-2xl sm:rounded-full bg-brand-accent text-white hover:bg-brand-accent/90 transition-colors"
                  >
                    Save &amp; Reanalyze
                  </button>
                  <button
                    onClick={() => { setEditingProfile(false); setUpdatingProfile(false); }}
                    className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="mb-6">
                <LoadingState message="Analyzing your profile. This takes about 20 seconds..." />
              </div>
            )}

            {analyzeError && !isAnalyzing && (
              <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-red-700">{analyzeError}</p>
                <button onClick={handleAnalyze} className="mt-1.5 text-xs text-red-600 underline hover:no-underline">
                  Try again
                </button>
              </div>
            )}

            {clusterResult && !isAnalyzing && (
              <div className="space-y-4">

                {/* ── Recommended LinkedIn Headline dark card ── */}
                <div className="rounded-2xl bg-brand-text p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.06em] text-white/35 mb-2">
                    Your Recommended LinkedIn Headline
                  </p>
                  <p className="text-xl font-semibold text-white leading-[1.4]">
                    {clusterResult.recommended_headline}
                  </p>
                </div>

                {/* ── LinkedIn Headline Generator — immediately below the dark card ── */}
                <div className="bg-white rounded-2xl shadow overflow-hidden">
                  <div className="px-6 py-5 border-b border-brand-text/8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-brand-text">Try other angles</p>
                        <p className="text-sm text-brand-text/50 mt-0.5 leading-snug">
                          {headlineResult
                            ? "Pick the angle that fits where you're headed — paste it straight into LinkedIn."
                            : "Generate 4 positioning angles calibrated to your career story."}
                        </p>
                      </div>
                      {!isGeneratingHeadlines && (
                        <button
                          onClick={handleGenerateHeadlines}
                          className="shrink-0 inline-flex items-center gap-1 px-4 py-2 bg-brand-accent text-white text-sm font-semibold rounded-xl hover:bg-brand-accent/90 transition-colors"
                        >
                          {headlineResult ? "Regenerate" : "Try 4 angles →"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-5">
                    {isGeneratingHeadlines && (
                      <LoadingState message="Writing headline angles from your career story…" />
                    )}
                    {headlineError && !isGeneratingHeadlines && (
                      <div className="p-4 bg-red-50 rounded-xl ring-1 ring-red-100">
                        <p className="text-sm text-red-700">{headlineError}</p>
                        <button
                          onClick={handleGenerateHeadlines}
                          className="mt-1 text-xs text-red-500 underline hover:no-underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                    {!headlineResult && !isGeneratingHeadlines && !headlineError && (
                      <p className="text-sm text-brand-text/35 italic">Hit &quot;Try 4 angles →&quot; to see more headline options for your career story.</p>
                    )}
                    {headlineResult && !isGeneratingHeadlines && (
                      <div className="space-y-3">
                        {headlineResult.headlines.map((h, i) => (
                          <HeadlineCard key={i} headline={h} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Role clusters, strengths, risks ── */}
                <div className="pt-4">
                  <RoleClusterResults result={clusterResult} />
                </div>
              </div>
            )}

            {clusterResult && !isAnalyzing && (
              <div className="mt-8 pt-6 border-t border-brand-text/8 flex items-center justify-between gap-4">
                <p className="text-sm text-brand-text/40">Paste a job description to get an honest fit score and full prep guide — calibrated to this profile.</p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="inline-flex items-center gap-1 px-4 py-2.5 border border-brand-text/15 text-brand-text/60 text-sm font-medium rounded-2xl sm:rounded-full hover:border-brand-text/30 hover:text-brand-text/80 transition-colors"
                  >
                    Discover jobs →
                  </button>
                  <button
                    onClick={() => setActiveTab("job-fit")}
                    className="inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
                  >
                    Score a job →
                  </button>
                </div>
              </div>
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
                  <h2 className="text-lg font-semibold text-brand-text">Score a Job</h2>
                  <p className="text-base text-brand-text/50 mt-1">
                    Paste or fetch a job description. Signal scores it against your profile — functional fit, seniority, domain, and the specific concern a recruiter will likely raise.
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
                  initialJDText={!jobFitResult ? jobDescription : undefined}
                  result={jobFitResult}
                  hasPrepData={!!(tailoringResult || coverLetterResult || outreachResult || resumeUpdateResult || interviewPrepResult || followUpResult)}
                  isProfileStale={!!(profileUpdatedAt && activeJobId && (() => { const j = trackedJobs.find(j => j.id === activeJobId); return j && new Date(j.scoredAt) < profileUpdatedAt; })())}
                  onJobScored={handleJobScored}
                  onJobFitUpdated={handleJobFitUpdated}
                  onReset={handleJobFitReset}
                  onGoToTailoringBrief={() => setActiveTab("tailoring-brief")}
                />
                {/* Search terms link — appears after a job has been scored */}
                {jobFitResult && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setActiveTab("discover")}
                      className="flex items-center gap-1.5 text-sm text-brand-text/40 hover:text-brand-accent transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                      </svg>
                      Search for similar roles →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Discover tab ── */}
        {activeTab === "discover" && (
          <JobDiscovery
            clusterResult={clusterResult}
            onGoToProfile={() => setActiveTab("profile")}
          />
        )}

        {/* ── Prep tab ── */}
        {activeTab === "tailoring-brief" && (
          <div>
            <div className="mb-7">
              <h2 className="text-lg font-semibold text-brand-text">Prep</h2>
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
              writingSample={writingSample || undefined}
              pivotTarget={pivotTarget || undefined}
              jobDescription={jobDescription}
              jobLabel={activeJobId ? trackedJobs.find(j => j.id === activeJobId)?.label : undefined}
              result={tailoringResult}
              onResultChange={handleTailoringResult}
              outreachResult={outreachResult}
              onOutreachResultChange={handleOutreachResult}
              coverLetterResult={coverLetterResult}
              onCoverLetterResultChange={handleCoverLetterResult}
              resumeUpdateResult={resumeUpdateResult}
              onResumeUpdateResultChange={handleResumeUpdateResult}
              interviewPrepResult={interviewPrepResult}
              onInterviewPrepResultChange={handleInterviewPrepResult}
              followUpResult={followUpResult}
              onFollowUpResultChange={handleFollowUpResult}
              companyResearchResult={companyResearchResult}
              onCompanyResearchResultChange={handleCompanyResearchResult}
              onGoToProfile={() => setActiveTab("profile")}
              onGoToJobFit={() => setActiveTab("job-fit")}
              isProfileStale={!!(profileUpdatedAt && activeJobId && (() => { const j = trackedJobs.find(j => j.id === activeJobId); return j && new Date(j.scoredAt) < profileUpdatedAt; })())}
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
              profileUpdatedAt={profileUpdatedAt}
              onSelectJob={handleSelectJob}
              onRemoveJob={handleRemoveJob}
              onRenameJob={handleRenameJob}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
              onDeadlineChange={handleDeadlineChange}
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
      <p className="text-base font-semibold text-brand-text">{message}</p>
      <p className="text-base text-brand-text/50 mt-1 max-w-xs mx-auto">{sub}</p>
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
      >
        {action} →
      </button>
    </div>
  );
}

function HeadlineCard({ headline }: { headline: LinkedInHeadlineOption }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(headline.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silently fail */ }
  }

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-brand-text/8">
      {/* Angle label + char count */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span className="text-xs font-medium text-brand-accent/80 bg-brand-accent/8 px-2.5 py-0.5 rounded-full ring-1 ring-brand-accent/15">
          {headline.angle}
        </span>
        <span className="text-xs text-brand-text/30 tabular-nums">{headline.text.length} chars</span>
      </div>
      {/* Headline text */}
      <p className="text-base font-semibold text-brand-text leading-snug mb-2">{headline.text}</p>
      {/* Best for */}
      <p className="text-sm text-brand-text/45 leading-snug mb-3">{headline.best_for}</p>
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:text-brand-accent/70 transition-colors"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy to clipboard
          </>
        )}
      </button>
    </div>
  );
}
