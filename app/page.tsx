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
import AppShell from "@/components/AppShell";
import { ToastProvider } from "@/components/ToastProvider";
import LandingPage from "@/components/LandingPage";
import type { TabId, RoleClusterResult, JobFitResult, TailoringBriefResult, OutreachResult, CoverLetterResult, ResumeUpdateResult, InterviewPrepResult, FollowUpResult, CompanyResearchResult, LinkedInHeadlineResult, LinkedInHeadlineOption, TrackedJob, ApplicationStatus } from "@/types";

function extractJobTitle(jd: string, fallbackCount: number): string {
  const firstShortLine = jd
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 3 && l.length < 80);
  return firstShortLine ?? `Job #${fallbackCount}`;
}

/** Migrate legacy `what_she_has` field name to `what_you_have` for records saved before the rename */
function normalizeJobFitResult(raw: unknown): JobFitResult {
  const r = raw as Record<string, unknown>;
  if (!r.what_you_have && r.what_she_has) {
    r.what_you_have = r.what_she_has;
    delete r.what_she_has;
  }
  return r as unknown as JobFitResult;
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
  const [profileExpanded, setProfileExpanded] = useState<"none" | "view" | "update">("none");
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
    // Also support ?skip=1 from external links (e.g. How It Works "Try without signing up")
    const skipParam = new URLSearchParams(window.location.search).get("skip");
    if (sessionStorage.getItem("signal-show-landing") === "false" || skipParam === "1") {
      setShowLanding(false);
      if (skipParam === "1") {
        sessionStorage.setItem("signal-show-landing", "false");
        window.history.replaceState({}, "", "/");
      }
    }

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

  // ── localStorage: load profile fields, snapshot, JD, job result, and prep on mount ──
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

      // Restore job fit result + prep content UNLESS user hit "Score a job →" (reset flag)
      const resetFlag = sessionStorage.getItem("signal_reset_job_fit");
      if (resetFlag) {
        sessionStorage.removeItem("signal_reset_job_fit");
      } else {
        const savedJob = localStorage.getItem("signal_last_job");
        if (savedJob) {
          const j = JSON.parse(savedJob) as { jobFitResult?: JobFitResult };
          if (j.jobFitResult) setJobFitResult(normalizeJobFitResult(j.jobFitResult));
        }
        const savedPrep = localStorage.getItem("signal_last_prep");
        if (savedPrep) {
          const p = JSON.parse(savedPrep) as {
            tailoringResult?: TailoringBriefResult;
            outreachResult?: OutreachResult;
            coverLetterResult?: CoverLetterResult;
            resumeUpdateResult?: ResumeUpdateResult;
            interviewPrepResult?: InterviewPrepResult;
            followUpResult?: FollowUpResult;
            companyResearchResult?: CompanyResearchResult;
          };
          if (p.tailoringResult)      setTailoringResult(p.tailoringResult);
          if (p.outreachResult)       setOutreachResult(p.outreachResult);
          if (p.coverLetterResult)    setCoverLetterResult(p.coverLetterResult);
          if (p.resumeUpdateResult)   setResumeUpdateResult(p.resumeUpdateResult);
          if (p.interviewPrepResult)  setInterviewPrepResult(p.interviewPrepResult);
          if (p.followUpResult)       setFollowUpResult(p.followUpResult);
          if (p.companyResearchResult) setCompanyResearchResult(p.companyResearchResult);
        }
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

  // ── localStorage: persist job fit result so refresh restores it ──
  useEffect(() => {
    if (!localStorageLoaded) return;
    try {
      if (jobFitResult) {
        localStorage.setItem("signal_last_job", JSON.stringify({ jobFitResult }));
      }
    } catch { /* ignore quota errors */ }
  }, [jobFitResult, localStorageLoaded]);

  // ── localStorage: persist prep content so refresh restores it ──
  useEffect(() => {
    if (!localStorageLoaded) return;
    try {
      if (tailoringResult) {
        localStorage.setItem("signal_last_prep", JSON.stringify({
          tailoringResult,
          outreachResult,
          coverLetterResult,
          resumeUpdateResult,
          interviewPrepResult,
          followUpResult,
          companyResearchResult,
        }));
      }
    } catch { /* ignore quota errors */ }
  }, [tailoringResult, outreachResult, coverLetterResult, resumeUpdateResult,
      interviewPrepResult, followUpResult, companyResearchResult, localStorageLoaded]);

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
        jobFitResult: normalizeJobFitResult(row.job_fit_result),
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
    setProfileExpanded("none");
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
        setTimeout(() => {
          document.getElementById("profile-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
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
    try {
      localStorage.removeItem("signal_last_job");
      localStorage.removeItem("signal_last_prep");
    } catch { /* ignore */ }
  }

  /** Called by every "Score a job →" CTA — resets state and flags mount to skip restoration */
  function resetAndNavigateToJobFit() {
    handleJobFitReset();
    sessionStorage.setItem("signal_reset_job_fit", "true");
    setActiveTab("job-fit");
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
      <div className="min-h-screen bg-[#F6F0E4] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[rgba(35,24,18,0.15)] border-t-[#231812] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Landing screen ──
  if (showLanding) {
    // Signed in — show welcome (new) or welcome back (returning) view
    if (user) {
      return (
        <div style={{minHeight:'100vh', background:'#EDE7D9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)"}}>
          <a href="/" style={{fontFamily:"var(--font-instrument-serif, 'Instrument Serif', Georgia, serif)", fontStyle:'italic', fontSize:24, color:'#231812', textDecoration:'none', marginBottom:48}}>Claro</a>
          <h1 style={{fontFamily:"var(--font-instrument-serif, 'Instrument Serif', Georgia, serif)", fontStyle:'italic', fontSize:'clamp(36px, 5vw, 56px)', fontWeight:'normal', color:'#231812', marginBottom:16, textAlign:'center'}}>
            Welcome back.
          </h1>
          <p style={{fontFamily:"var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)", fontSize:16, fontWeight:300, color:'#4A3C34', marginBottom:40, textAlign:'center'}}>
            {trackedJobs.length === 1 ? 'You have 1 job scored.' : `You have ${trackedJobs.length} jobs scored.`}
          </p>
          <button
            onClick={() => setShowLanding(false)}
            style={{fontFamily:"var(--font-jetbrains-mono, 'JetBrains Mono', monospace)", fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'#FDF7EA', background:'#231812', border:'none', padding:'13px 28px', borderRadius:2, cursor:'pointer', marginBottom:24}}
          >
            Go to my jobs →
          </button>
          <button
            onClick={handleSignOut}
            style={{fontFamily:"var(--font-jetbrains-mono, 'JetBrains Mono', monospace)", fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'#8A857F', background:'none', border:'none', cursor:'pointer', padding:0}}
          >
            Sign out
          </button>
        </div>
      );
    }

    // Not signed in — show full landing page
    return (
      <LandingPage
        email={email}
        setEmail={setEmail}
        onSendMagicLink={handleSendMagicLink}
        sendingMagicLink={sendingMagicLink}
        magicLinkSent={magicLinkSent}
        magicLinkError={magicLinkError}
        onSkip={() => {
          setShowLanding(false);
          sessionStorage.setItem("signal-show-landing", "false");
        }}
      />
    );
  }

  // ── App shell ──
  const guestBanner = !user ? (
    <div className="border-b border-[rgba(26,26,26,0.08)] bg-[#FDF7EA]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-[72px] py-3">
        {!magicLinkSent ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[13px] font-medium text-[#231812]">Want to save your work?</p>
              <p className="font-sans text-[12px] text-[#8A857F] mt-0.5">
                Enter your email to save your profile, scores, and prep guides — free, no password.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                  className="flex-1 h-9 px-3 font-sans text-[13px] border border-[rgba(26,26,26,0.15)] rounded-[2px] bg-[#FDF7EA] focus:outline-none focus:ring-0 focus:border-[rgba(26,26,26,0.35)] transition-colors"
                />
                <button
                  onClick={handleSendMagicLink}
                  disabled={sendingMagicLink || !email.trim()}
                  className="h-9 px-3 shrink-0 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[10px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {sendingMagicLink ? "Sending…" : "Save progress"}
                </button>
              </div>
              {magicLinkError && (
                <p className="font-sans text-[11px] text-red-600 max-w-xs">{magicLinkError}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="font-sans text-[13px] text-[#4A3C34]">
              Check your inbox — we sent a link to <span className="font-medium text-[#231812]">{email}</span>.
            </p>
            <button
              onClick={() => { setMagicLinkSent(false); setMagicLinkError(""); }}
              className="shrink-0 font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors"
            >
              Use different email
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <ToastProvider>
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onScoreNewJob={resetAndNavigateToJobFit}
      onLogoClick={() => setShowLanding(true)}
      onSignOut={handleSignOut}
      jobCount={trackedJobs.length}
      user={user}
      guestBanner={guestBanner}
    >

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <div>
            <div className="mb-10 pb-5 border-b-2 border-[#231812]">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-instrument-serif text-[56px] font-normal leading-[0.95] tracking-[-0.02em] text-[#231812]">Profile</h2>
                <span className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] shrink-0">Your background</span>
              </div>
              <p className="font-instrument-serif italic text-[19px] text-[#4A3C34] mt-3 max-w-[540px]">Map your strongest role clusters and positioning risks.</p>
            </div>

            {/* No profile yet: onboarding header + uploader */}
            {!profileText && (
              <>
                <div className="mb-7">
                  <h2 className="font-sans text-[16px] font-medium text-[#231812]">Step 1 — Clarify your positioning</h2>
                  <p className="font-sans text-[15px] text-[#4A3C34] mt-1">
                    Upload your resume once. Claro identifies your strongest role clusters, surfaces positioning risks, and adapts every fit score, prep guide, and resume edit to your specific background.
                  </p>
                </div>
                <ProfileUploader onProfileConfirmed={handleProfileConfirmed} />
              </>
            )}

            {/* Profile exists — summary row (always visible when profileText set) */}
            {profileText && (
              <div className="mb-6">
                {/* ── Summary bar ── */}
                <div className="flex items-center justify-between gap-3 py-3 px-4 bg-[#FDF7EA] border border-[rgba(26,26,26,0.12)] rounded-[2px]">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-sans text-[13px] font-medium text-[#231812]">Your profile</span>
                    <span className="text-[#8A857F]">·</span>
                    <span className="font-sans text-[13px] text-[#8A857F]">
                      {resumeSource === "file" && resumeFileName ? resumeFileName : "Resume saved"}
                    </span>
                    {writingSample.trim() && (
                      <>
                        <span className="text-[#8A857F]">·</span>
                        <span className="font-sans text-[13px] text-[#8A857F]">Writing sample added</span>
                      </>
                    )}
                    {pivotTarget.trim() && (
                      <>
                        <span className="text-[#8A857F]">·</span>
                        <span className="font-sans text-[13px] text-[#8A857F]">Pivot target set</span>
                      </>
                    )}
                    {clusterResult && (
                      <>
                        <span className="text-[#8A857F]">·</span>
                        <span className="font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#8A857F]">Analyzed</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {!clusterResult && !isAnalyzing && (
                      <button
                        onClick={handleAnalyze}
                        className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8C3B1F] hover:text-[#231812] transition-colors"
                      >
                        Analyze →
                      </button>
                    )}
                    <button
                      onClick={() => setProfileExpanded(profileExpanded === "view" ? "none" : "view")}
                      className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors"
                    >
                      {profileExpanded === "view" ? "Hide" : "View"}
                    </button>
                    <button
                      onClick={() => setProfileExpanded(profileExpanded === "update" ? "none" : "update")}
                      className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors"
                    >
                      {profileExpanded === "update" ? "Cancel" : "Update"}
                    </button>
                  </div>
                </div>

                {/* ── View: formatted resume text ── */}
                {profileExpanded === "view" && (
                  <div className="mt-3">
                    <div
                      className="overflow-y-auto p-6"
                      style={{
                        maxHeight: "400px",
                        background: "#FDF7EA",
                        border: "1px solid rgba(26,26,26,0.12)",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(26,26,26,0.15) transparent",
                      }}
                    >
                      {profileText.split(/\n\n+/).map((para, pi) => (
                        <p
                          key={pi}
                          className="mb-4 last:mb-0 font-sans text-[13px] leading-[1.6] text-[#4A3C34]"
                          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
                        >
                          {para.split(/\n/).map((line, li, arr) => (
                            <span key={li}>
                              {line}
                              {li < arr.length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Update: full edit form ── */}
                {profileExpanded === "update" && (
                  <div className="mt-3 space-y-4">
                    {/* Resume uploader */}
                    <div className="bg-[#FDF7EA] p-5 border border-[rgba(26,26,26,0.12)]">
                      <p className="font-sans text-[13px] text-[#8A857F] mb-4">Upload or paste a new resume to replace the saved one.</p>
                      <ProfileUploader onProfileConfirmed={(text, source, fileName) => {
                        handleProfileConfirmed(text, source, fileName);
                        setProfileExpanded("none");
                      }} />
                      {!user && resumeSource === "file" && (
                        <p className="mt-2 font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#8A857F]">
                          Uploaded from file — re-upload if you refresh the page.
                        </p>
                      )}
                    </div>

                    {/* Writing sample */}
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <label className="block font-sans text-[13px] font-medium text-[#231812]">
                          Writing sample <span className="font-normal text-[#8A857F]">(optional)</span>
                        </label>
                        {writingSample.trim() && (
                          <span className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#8A857F]">Auto-saved</span>
                        )}
                      </div>
                      <textarea
                        value={writingSample}
                        onChange={(e) => setWritingSample(e.target.value)}
                        placeholder="Paste 2–3 sentences you've written professionally — an email, bio, or message that sounds like you. Claro uses this to match your voice in cover letters, outreach, and follow-ups."
                        rows={3}
                        className="w-full font-sans text-[14px] text-[#4A3C34] bg-[#FDF7EA] rounded-[2px] px-3.5 py-3 border border-[rgba(26,26,26,0.15)] focus:border-[rgba(26,26,26,0.35)] focus:outline-none focus:ring-0 resize-none placeholder:text-[#8A857F]"
                      />
                    </div>

                    {/* Pivot target */}
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <label className="block font-sans text-[13px] font-medium text-[#231812]">
                          Targeting a pivot? <span className="font-normal text-[#8A857F]">(optional)</span>
                        </label>
                        {pivotTarget.trim() && (
                          <span className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#8A857F]">Auto-saved</span>
                        )}
                      </div>
                      <textarea
                        value={pivotTarget}
                        onChange={(e) => setPivotTarget(e.target.value)}
                        placeholder="Optional: Describe the type of role you're trying to move toward — even if it's not an obvious fit for your background. Example: 'I want to move from brand strategy into a chief of staff or business operations role at a growth-stage startup.'"
                        rows={3}
                        className="w-full font-sans text-[14px] text-[#4A3C34] bg-[#FDF7EA] rounded-[2px] px-3.5 py-3 border border-[rgba(26,26,26,0.15)] focus:border-[rgba(26,26,26,0.35)] focus:outline-none focus:ring-0 resize-none placeholder:text-[#8A857F]"
                      />
                    </div>

                    {/* Save & Reanalyze / Cancel */}
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={() => { setProfileExpanded("none"); handleAnalyze(); }}
                        className="px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
                      >
                        Save &amp; Reanalyze
                      </button>
                      <button
                        onClick={() => setProfileExpanded("none")}
                        className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAnalyzing && (
              <div className="mb-6">
                <LoadingState message="Analyzing your profile. This takes about 20 seconds..." />
              </div>
            )}

            {analyzeError && !isAnalyzing && (
              <div className="mb-4 p-4 border-l-2 border-red-400">
                <p className="font-sans text-[14px] text-[#4A3C34]">{analyzeError}</p>
                <button onClick={handleAnalyze} className="mt-1.5 font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8C3B1F] hover:text-[#231812] transition-colors">
                  Try again
                </button>
              </div>
            )}

            {clusterResult && !isAnalyzing && (
              <div className="space-y-6">

                {/* ── Recommended LinkedIn Headline ── */}
                <div id="profile-result" className="result-scroll-target border-t-2 border-[#231812] pt-6">
                  <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] mb-3">
                    Your Recommended LinkedIn Headline
                  </p>
                  <p className="font-instrument-serif text-[28px] font-normal text-[#231812] leading-[1.3]">
                    {clusterResult.recommended_headline}
                  </p>
                </div>

                {/* ── 58/42 grid: left = clusters, right = strengths + risks + headline generator ── */}
                <RoleClusterResults
                  result={clusterResult}
                  resumeText={profileText || undefined}
                  onClusterUpdate={(index, updated) => {
                    setClusterResult(prev => {
                      if (!prev) return prev;
                      const clusters = [...prev.role_clusters];
                      clusters[index] = updated;
                      return { ...prev, role_clusters: clusters };
                    });
                  }}
                  rightColumnExtra={
                    /* ── LinkedIn Headline Generator — 3rd card in right column ── */
                    <div className="bg-[#FDF7EA] border border-[rgba(26,26,26,0.12)] overflow-hidden">
                      <div className="px-5 py-4 border-b border-[rgba(26,26,26,0.08)]">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] mb-1">LinkedIn Headlines</p>
                            <p className="font-sans text-[13px] text-[#4A3C34] leading-snug">
                              {headlineResult
                                ? "Pick the angle that fits where you're headed."
                                : "4 positioning angles calibrated to your career story."}
                            </p>
                          </div>
                          {!isGeneratingHeadlines && (
                            <button
                              onClick={handleGenerateHeadlines}
                              className="shrink-0 px-3 py-1.5 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[10px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
                            >
                              {headlineResult ? "Regenerate" : "Try 4 angles →"}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        {isGeneratingHeadlines && (
                          <LoadingState message="Writing headline angles from your career story…" />
                        )}
                        {headlineError && !isGeneratingHeadlines && (
                          <div className="p-4 border-l-2 border-red-400">
                            <p className="font-sans text-[13px] text-[#4A3C34]">{headlineError}</p>
                            <button
                              onClick={handleGenerateHeadlines}
                              className="mt-1 font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#8C3B1F] hover:text-[#231812] transition-colors"
                            >
                              Try again
                            </button>
                          </div>
                        )}
                        {!headlineResult && !isGeneratingHeadlines && !headlineError && (
                          <p className="font-sans text-[13px] text-[#8A857F] italic">Hit &ldquo;Try 4 angles →&rdquo; to see more headline options.</p>
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
                  }
                />
              </div>
            )}

            {clusterResult && !isAnalyzing && (
              <div className="mt-10 pt-6 border-t border-[rgba(26,26,26,0.10)] flex items-center justify-between gap-4">
                <p className="font-sans text-[13px] text-[#8A857F]">Ready to evaluate a role?</p>
                <div className="flex items-center gap-5 shrink-0">
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors"
                  >
                    Discover jobs →
                  </button>
                  <button
                    onClick={resetAndNavigateToJobFit}
                    className="px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
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
                <div className="mb-10 pb-5 border-b-2 border-[#231812]">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-instrument-serif text-[56px] font-normal leading-[0.95] tracking-[-0.02em] text-[#231812]">Job Fit</h2>
                    <span className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] shrink-0">Score a role</span>
                  </div>
                  <p className="font-instrument-serif italic text-[19px] text-[#4A3C34] mt-3 max-w-[540px]">An honest 1–10 score with the recruiter concern most likely to sink your application.</p>
                </div>
                {activeJobId && trackedJobs.find(j => j.id === activeJobId) && (
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <JobLabelEditor
                      id={activeJobId}
                      label={trackedJobs.find(j => j.id === activeJobId)!.label}
                      onRename={handleRenameJob}
                      className="font-sans text-[18px] font-medium text-[#231812]"
                    />
                    <div className="flex items-center gap-3 shrink-0">
                      {jobFitResult && (
                        <button
                          onClick={() => setActiveTab("tailoring-brief")}
                          className="px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors whitespace-nowrap"
                        >
                          Go to Prep →
                        </button>
                      )}
                      <button
                        onClick={handleJobFitReset}
                        className="px-3 py-1.5 border border-[rgba(26,26,26,0.15)] text-[#231812] font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] rounded-[2px] hover:bg-[rgba(26,26,26,0.04)] transition-colors whitespace-nowrap"
                      >
                        + Score another job
                      </button>
                    </div>
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
                  onSearchSimilarRoles={() => setActiveTab("discover")}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Discover tab ── */}
        {activeTab === "discover" && (
          <div>
            <div className="mb-10 pb-5 border-b-2 border-[#231812]">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-instrument-serif text-[56px] font-normal leading-[0.95] tracking-[-0.02em] text-[#231812]">Discover</h2>
                <span className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] shrink-0">Find roles</span>
              </div>
              <p className="font-instrument-serif italic text-[19px] text-[#4A3C34] mt-3 max-w-[540px]">Search directly from your best-fit role clusters.</p>
            </div>
            <JobDiscovery
              clusterResult={clusterResult}
              onGoToProfile={() => setActiveTab("profile")}
            />
          </div>
        )}

        {/* ── Prep tab ── */}
        {activeTab === "tailoring-brief" && (
          <div>
            <div className="mb-10 pb-5 border-b-2 border-[#231812]">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-instrument-serif text-[56px] font-normal leading-[0.95] tracking-[-0.02em] text-[#231812]">Prep</h2>
                <span className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] shrink-0">Application prep</span>
              </div>
              <p className="font-instrument-serif italic text-[19px] text-[#4A3C34] mt-3 max-w-[540px]">Full application brief, cover letter, outreach, and interview prep.</p>
            </div>
            {activeJobId && trackedJobs.find(j => j.id === activeJobId) && (
              <div className="mb-6">
                <JobLabelEditor
                  id={activeJobId}
                  label={trackedJobs.find(j => j.id === activeJobId)!.label}
                  onRename={handleRenameJob}
                  className="font-sans text-[18px] font-medium text-[#231812]"
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
            <div className="mb-10 pb-5 border-b-2 border-[#231812]">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-instrument-serif text-[56px] font-normal leading-[0.95] tracking-[-0.02em] text-[#231812]">My Jobs</h2>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F]">Pipeline</span>
                  {trackedJobs.length > 0 && (
                    <button
                      onClick={resetAndNavigateToJobFit}
                      className="px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
                    >
                      Score a job →
                    </button>
                  )}
                </div>
              </div>
              <p className="font-instrument-serif italic text-[19px] text-[#4A3C34] mt-3 max-w-[540px]">Every scored role, with fit score, prep status, and pipeline tracking.</p>
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
              onScoreNewJob={resetAndNavigateToJobFit}
            />
          </div>
        )}

    </AppShell>
    </ToastProvider>
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
      <p className="font-sans text-[16px] font-medium text-[#231812]">{message}</p>
      <p className="font-sans text-[14px] text-[#8A857F] mt-2 max-w-xs mx-auto">{sub}</p>
      <button
        onClick={onAction}
        className="mt-6 px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
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
    <div className="bg-[#FDF7EA] p-4 border border-[rgba(26,26,26,0.10)]">
      {/* Angle label + char count */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#8A857F]">
          {headline.angle}
        </span>
        <span className="font-jetbrains-mono text-[10px] text-[#8A857F] tabular-nums">{headline.text.length} chars</span>
      </div>
      {/* Headline text */}
      <p className="font-sans text-[15px] font-medium text-[#231812] leading-snug mb-1.5">{headline.text}</p>
      {/* Best for */}
      <p className="font-sans text-[13px] text-[#8A857F] leading-snug mb-3">{headline.best_for}</p>
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#8C3B1F] hover:text-[#231812] transition-colors"
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
