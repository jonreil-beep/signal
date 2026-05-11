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
import YourBriefModal from "@/components/YourBriefModal";
import type { TabId, RoleClusterResult, JobFitResult, TailoringBriefResult, OutreachResult, CoverLetterResult, ResumeUpdateResult, InterviewPrepResult, FollowUpResult, CompanyResearchResult, TrackedJob, ApplicationStatus } from "@/types";

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
  const [currentHeadline, setCurrentHeadline] = useState<string>("");
  const [isGeneratingHeadline, setIsGeneratingHeadline] = useState(false);
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
  const [briefModalOpen, setBriefModalOpen] = useState(false);

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
    setCurrentHeadline("");
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
    setCurrentHeadline("");
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

  async function handleRegenerateHeadline() {
    if (!profileText) return;
    setIsGeneratingHeadline(true);
    setHeadlineError("");
    try {
      const response = await fetch("/api/linkedin-headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, writingSample: writingSample || undefined, pivotTarget: pivotTarget || undefined }),
      });
      const data = await response.json() as { headline?: string; error?: string };
      if (!response.ok || !data.headline) {
        setHeadlineError(data.error ?? "Failed to generate headline. Please try again.");
      } else {
        setCurrentHeadline(data.headline);
      }
    } catch {
      setHeadlineError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingHeadline(false);
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
      <div style={{minHeight:'100vh', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{width:20, height:20, border:'2px solid rgba(28,35,51,0.12)', borderTopColor:'#1C2333', borderRadius:'50%', animation:'spin 0.7s linear infinite'}} />
      </div>
    );
  }

  // ── Landing screen ──
  if (showLanding) {
    // Signed in — show welcome (new) or welcome back (returning) view
    if (user) {
      return (
        <div style={{minHeight:'100vh', background:'#1C2333', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif)"}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:8, textDecoration:'none', marginBottom:48}}>
            <div style={{width:18, height:18, background:'#fff', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
              <span style={{color:'#1C2333', fontSize:10, fontWeight:600, fontFamily:"var(--font-geist-sans)", lineHeight:1, letterSpacing:'-0.01em'}}>C</span>
            </div>
            <span style={{fontFamily:"var(--font-geist-sans)", fontWeight:500, fontSize:17, letterSpacing:'-0.02em', color:'#fff'}}>Claro</span>
          </a>
          <h1 style={{fontFamily:"var(--font-geist-sans)", fontWeight:500, fontSize:'clamp(40px, 5vw, 64px)', lineHeight:1, letterSpacing:'-0.03em', color:'#fff', marginBottom:16, textAlign:'center'}}>
            Welcome back.
          </h1>
          <p style={{fontFamily:"var(--font-geist-sans)", fontSize:16, fontWeight:400, color:'rgba(255,255,255,0.55)', marginBottom:44, textAlign:'center'}}>
            {trackedJobs.length === 1 ? 'You have 1 job scored.' : `You have ${trackedJobs.length} jobs scored.`}
          </p>
          <button
            onClick={() => setShowLanding(false)}
            style={{fontFamily:"var(--font-geist-sans)", fontWeight:500, fontSize:14, letterSpacing:'-0.005em', color:'#1C2333', background:'#fff', border:'none', padding:'0 24px', height:44, borderRadius:8, cursor:'pointer', marginBottom:24}}
          >
            Go to my jobs →
          </button>
          <button
            onClick={handleSignOut}
            style={{fontFamily:"var(--font-geist-mono)", fontSize:11, letterSpacing:'0.05em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', background:'none', border:'none', cursor:'pointer', padding:0}}
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
    <div className="border-b border-[rgba(28,35,51,0.08)] bg-white">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-[72px] py-3">
        {!magicLinkSent ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[13px] font-medium text-[#1C2333]">Want to save your work?</p>
              <p className="font-sans text-[12px] text-[rgba(28,35,51,0.55)] mt-0.5">
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
                  className="flex-1 h-9 px-3 font-sans text-[13px] border border-[rgba(28,35,51,0.12)] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:ring-0 focus:border-[rgba(28,35,51,0.32)] transition-colors"
                />
                <button
                  onClick={handleSendMagicLink}
                  disabled={sendingMagicLink || !email.trim()}
                  className="h-9 px-3 shrink-0 bg-[#1C2333] text-white font-sans font-medium text-[13px] rounded-[8px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
            <p className="font-sans text-[13px] text-[rgba(28,35,51,0.65)]">
              Check your inbox — we sent a link to <span className="font-medium text-[#1C2333]">{email}</span>.
            </p>
            <button
              onClick={() => { setMagicLinkSent(false); setMagicLinkError(""); }}
              className="shrink-0 font-sans text-[12px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors"
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
            <div className="mb-10 pb-8 border-b border-[rgba(28,35,51,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 10 }}>
                    02 / Your Background
                  </p>
                  <h1 className="font-sans font-medium text-[36px] text-[#1C2333] leading-none" style={{ letterSpacing: "-0.025em", marginBottom: 8 }}>Profile</h1>
                  <p className="font-sans text-[15px] text-[rgba(28,35,51,0.65)]">Your strongest role clusters and the positioning risks that come with them.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 mt-1">
                  <button
                    onClick={resetAndNavigateToJobFit}
                    className="font-sans font-medium text-white bg-[#1C2333] hover:opacity-90 transition-opacity"
                    style={{ height: 36, padding: "0 14px", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer" }}
                  >
                    Score a job →
                  </button>
                </div>
              </div>
            </div>

            {/* No profile yet: onboarding header + uploader */}
            {!profileText && (
              <>
                <div className="mb-7">
                  <h2 className="font-sans text-[16px] font-medium text-[#1C2333]">Step 1 — Clarify your positioning</h2>
                  <p className="font-sans text-[15px] text-[rgba(28,35,51,0.65)] mt-1">
                    Upload your resume once. Claro identifies your strongest role clusters, surfaces positioning risks, and adapts every fit score, prep guide, and resume edit to your specific background.
                  </p>
                </div>
                <ProfileUploader onProfileConfirmed={handleProfileConfirmed} />
              </>
            )}

            {/* Profile exists — summary row (always visible when profileText set) */}
            {profileText && (
              <div className="mb-8">
                {/* ── Resume status bar ── */}
                <div
                  className="flex items-center justify-between gap-4"
                  style={{
                    borderTop: "1px solid rgba(28,35,51,0.08)",
                    borderBottom: "1px solid rgba(28,35,51,0.08)",
                    padding: "14px 0",
                  }}
                >
                  <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7A8B73", flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)" }}>
                      Resume saved
                    </span>
                    {clusterResult && (
                      <>
                        <span style={{ color: "rgba(28,35,51,0.20)" }}>·</span>
                        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)" }}>
                          Analyzed
                        </span>
                      </>
                    )}
                    {resumeSource === "file" && resumeFileName && (
                      <>
                        <span style={{ color: "rgba(28,35,51,0.20)" }}>·</span>
                        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)" }}>
                          {resumeFileName}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center shrink-0" style={{ gap: 16 }}>
                    {!clusterResult && !isAnalyzing && (
                      <button
                        onClick={handleAnalyze}
                        style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        className="hover:text-[#1C2333] transition-colors"
                      >
                        Analyze →
                      </button>
                    )}
                    <button
                      onClick={() => setProfileExpanded(profileExpanded === "view" ? "none" : "view")}
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      className="hover:text-[#1C2333] transition-colors"
                    >
                      {profileExpanded === "view" ? "Hide" : "View"}
                    </button>
                    <button
                      onClick={() => setProfileExpanded(profileExpanded === "update" ? "none" : "update")}
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      className="hover:text-[#1C2333] transition-colors"
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
                        background: "#FAFAFA",
                        border: "1px solid rgba(28,35,51,0.08)",
                        borderRadius: "10px",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(28,35,51,0.15) transparent",
                      }}
                    >
                      {profileText.split(/\n\n+/).map((para, pi) => (
                        <p
                          key={pi}
                          className="mb-4 last:mb-0 font-sans text-[13px] leading-[1.6] text-[rgba(28,35,51,0.65)]"
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
                    <div className="bg-[#FAFAFA] p-5 border border-[rgba(28,35,51,0.08)] rounded-[10px]">
                      <p className="font-sans text-[13px] text-[rgba(28,35,51,0.55)] mb-4">Upload or paste a new resume to replace the saved one.</p>
                      <ProfileUploader onProfileConfirmed={(text, source, fileName) => {
                        handleProfileConfirmed(text, source, fileName);
                        setProfileExpanded("none");
                      }} />
                      {!user && resumeSource === "file" && (
                        <p className="mt-2 font-sans text-[11px] text-[rgba(28,35,51,0.45)]">
                          Uploaded from file — re-upload if you refresh the page.
                        </p>
                      )}
                    </div>

                    {/* Writing sample */}
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <label className="block font-sans text-[13px] font-medium text-[#1C2333]">
                          Writing sample <span className="font-normal text-[rgba(28,35,51,0.45)]">(optional)</span>
                        </label>
                        {writingSample.trim() && (
                          <span className="font-sans text-[11px] text-[rgba(28,35,51,0.45)]">Auto-saved</span>
                        )}
                      </div>
                      <textarea
                        value={writingSample}
                        onChange={(e) => setWritingSample(e.target.value)}
                        placeholder="Paste 2–3 sentences you've written professionally — an email, bio, or message that sounds like you. Claro uses this to match your voice in cover letters, outreach, and follow-ups."
                        rows={3}
                        className="w-full font-sans text-[14px] text-[#1C2333] bg-[#FAFAFA] rounded-[10px] px-3.5 py-3 border border-[rgba(28,35,51,0.08)] focus:border-[rgba(28,35,51,0.20)] focus:outline-none focus:ring-0 resize-none placeholder:text-[rgba(28,35,51,0.35)]"
                      />
                    </div>

                    {/* Pivot target */}
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <label className="block font-sans text-[13px] font-medium text-[#1C2333]">
                          Targeting a pivot? <span className="font-normal text-[rgba(28,35,51,0.45)]">(optional)</span>
                        </label>
                        {pivotTarget.trim() && (
                          <span className="font-sans text-[11px] text-[rgba(28,35,51,0.45)]">Auto-saved</span>
                        )}
                      </div>
                      <textarea
                        value={pivotTarget}
                        onChange={(e) => setPivotTarget(e.target.value)}
                        placeholder="Optional: Describe the type of role you're trying to move toward — even if it's not an obvious fit for your background. Example: 'I want to move from brand strategy into a chief of staff or business operations role at a growth-stage startup.'"
                        rows={3}
                        className="w-full font-sans text-[14px] text-[#1C2333] bg-[#FAFAFA] rounded-[10px] px-3.5 py-3 border border-[rgba(28,35,51,0.08)] focus:border-[rgba(28,35,51,0.20)] focus:outline-none focus:ring-0 resize-none placeholder:text-[rgba(28,35,51,0.35)]"
                      />
                    </div>

                    {/* Save & Reanalyze / Cancel */}
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={() => { setProfileExpanded("none"); handleAnalyze(); }}
                        className="px-4 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity"
                        style={{ height: 40 }}
                      >
                        Save &amp; Reanalyze
                      </button>
                      <button
                        onClick={() => setProfileExpanded("none")}
                        className="font-sans text-[13px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors"
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
              <div className="mb-4 p-4 border-l-2 border-[#8A7373]">
                <p className="font-sans text-[14px] text-[#1C2333]">{analyzeError}</p>
                <button onClick={handleAnalyze} className="mt-1.5 font-sans text-[12px] text-[#8A7373] hover:text-[#1C2333] transition-colors">
                  Try again
                </button>
              </div>
            )}

            {clusterResult && !isAnalyzing && (
              <div className="space-y-6">

                {/* ── Recommended LinkedIn Headline ── */}
                <div id="profile-result" className="result-scroll-target border-t border-[rgba(28,35,51,0.08)] pt-8">
                  <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 16 }}>
                    Recommended LinkedIn Headline
                  </p>
                  <p className="font-sans font-medium text-[#1C2333] leading-[1.2]" style={{ fontSize: 38, letterSpacing: "-0.025em", marginBottom: 14 }}>
                    {currentHeadline || clusterResult.recommended_headline}
                  </p>
                  {isGeneratingHeadline ? (
                    <span style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 400, fontSize: 13, color: "var(--fg-3)", letterSpacing: "0.02em" }}>
                      Regenerating...
                    </span>
                  ) : headlineError ? (
                    <button
                      onClick={handleRegenerateHeadline}
                      style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 400, fontSize: 13, color: "var(--status-stretch)", letterSpacing: "0.02em", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      className="hover:underline"
                    >
                      Try again →
                    </button>
                  ) : (
                    <button
                      onClick={handleRegenerateHeadline}
                      style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 400, fontSize: 13, color: "var(--fg-3)", letterSpacing: "0.02em", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      className="hover:underline"
                    >
                      Regenerate →
                    </button>
                  )}
                </div>

                {/* ── 58/42 grid: left = clusters, right = strengths + risks ── */}
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
                />
              </div>
            )}

            {clusterResult && !isAnalyzing && (
              <div className="mt-10 pt-6 border-t border-[rgba(28,35,51,0.08)] flex items-center justify-between gap-4">
                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.55)]">Ready to evaluate a role?</p>
                <div className="flex items-center gap-5 shrink-0">
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="font-sans text-[13px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors"
                  >
                    Discover jobs →
                  </button>
                  <button
                    onClick={resetAndNavigateToJobFit}
                    className="px-4 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity"
                    style={{ height: 36 }}
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
                <div className="mb-10 pb-8 border-b border-[rgba(28,35,51,0.08)]">
                  <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 10 }}>
                    01 / Pipeline
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" }}>
                    <button onClick={() => setActiveTab("my-jobs")} className="focus:outline-none" style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 36, color: "var(--fg-3)", background: "none", border: "none", padding: 0, cursor: "pointer", letterSpacing: "-0.025em", lineHeight: 1 }}>My Jobs</button>
                    <span aria-hidden="true" style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 36, color: "var(--fg-4)", userSelect: "none", margin: "0 12px", lineHeight: 1 }}>{">"}</span>
                    <span style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 36, color: "var(--fg)", letterSpacing: "-0.025em", lineHeight: 1 }}>Job Fit</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 400, fontSize: 15, color: "var(--fg-2)", marginTop: 8 }}>An honest 1–10 score with the recruiter concern most likely to sink your application.</p>
                </div>
                {activeJobId && trackedJobs.find(j => j.id === activeJobId) && (
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <JobLabelEditor
                      id={activeJobId}
                      label={trackedJobs.find(j => j.id === activeJobId)!.label}
                      onRename={handleRenameJob}
                      className="font-sans text-[18px] font-medium text-[#1C2333]"
                    />
                    {jobFitResult && (
                      <button
                        onClick={() => setActiveTab("tailoring-brief")}
                        className="px-4 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                        style={{ height: 36 }}
                      >
                        Go to Prep →
                      </button>
                    )}
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
            <div className="mb-10 pb-8 border-b border-[rgba(28,35,51,0.08)]">
              <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 10 }}>
                03 / Discover
              </p>
              <h1 className="font-sans font-medium text-[36px] text-[#1C2333] leading-none" style={{ letterSpacing: "-0.025em", marginBottom: 8 }}>Discover</h1>
              <p className="font-sans text-[15px] text-[rgba(28,35,51,0.65)]">Search directly from your best-fit role clusters.</p>
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
            <div className="mb-10 pb-8 border-b border-[rgba(28,35,51,0.08)]">
              <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 10 }}>
                01 / Pipeline
              </p>
              <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" }}>
                <button onClick={() => setActiveTab("my-jobs")} className="focus:outline-none" style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 36, color: "var(--fg-3)", background: "none", border: "none", padding: 0, cursor: "pointer", letterSpacing: "-0.025em", lineHeight: 1 }}>My Jobs</button>
                <span aria-hidden="true" style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 36, color: "var(--fg-4)", userSelect: "none", margin: "0 12px", lineHeight: 1 }}>{">"}</span>
                <button onClick={() => setActiveTab("job-fit")} className="focus:outline-none" style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 36, color: "var(--fg-3)", background: "none", border: "none", padding: 0, cursor: "pointer", letterSpacing: "-0.025em", lineHeight: 1 }}>Job Fit</button>
                <span aria-hidden="true" style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 36, color: "var(--fg-4)", userSelect: "none", margin: "0 12px", lineHeight: 1 }}>{">"}</span>
                <span style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 36, color: "var(--fg)", letterSpacing: "-0.025em", lineHeight: 1 }}>Prep</span>
              </div>
              <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 400, fontSize: 15, color: "var(--fg-2)", marginTop: 8 }}>Everything you need to apply. Built from your fit score.</p>
            </div>
            {activeJobId && trackedJobs.find(j => j.id === activeJobId) && (
              <div className="flex items-center justify-between gap-4 mb-6">
                <JobLabelEditor
                  id={activeJobId}
                  label={trackedJobs.find(j => j.id === activeJobId)!.label}
                  onRename={handleRenameJob}
                  className="font-sans text-[18px] font-medium text-[#231812]"
                />
                {tailoringResult && (
                  <button
                    onClick={() => setBriefModalOpen(true)}
                    className="hover:bg-[rgba(28,35,51,0.04)] transition-colors whitespace-nowrap shrink-0 focus:outline-none"
                    style={{ height: 36, padding: "0 14px", borderRadius: 7, fontSize: 13, fontFamily: "var(--font-geist-sans)", fontWeight: 500, color: "var(--fg)", background: "white", border: "1px solid var(--line-strong)", cursor: "pointer" }}
                  >
                    Your brief →
                  </button>
                )}
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
              onOpenBrief={tailoringResult ? () => setBriefModalOpen(true) : undefined}
            />
          </div>
        )}

        {/* ── Your Brief modal (Prep screen) ── */}
        {briefModalOpen && activeJobId && (() => { const j = trackedJobs.find(j => j.id === activeJobId); return j ? <YourBriefModal job={j} onClose={() => setBriefModalOpen(false)} /> : null; })()}

        {/* ── My Jobs tab ── */}
        {activeTab === "my-jobs" && (
          <div>
            <div className="mb-10 pb-8 border-b border-[rgba(28,35,51,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 10 }}>
                    01 / Pipeline
                  </p>
                  <h1 className="font-sans font-medium text-[36px] text-[#1C2333] leading-none" style={{ letterSpacing: "-0.025em", marginBottom: 8 }}>My Jobs</h1>
                  <p className="font-sans text-[15px] text-[rgba(28,35,51,0.65)]">Every scored role, with fit score, prep status, and pipeline tracking.</p>
                </div>
                {trackedJobs.length > 0 && (
                  <div className="shrink-0 mt-1">
                    <button
                      onClick={resetAndNavigateToJobFit}
                      className="font-sans font-medium text-white bg-[#1C2333] hover:opacity-90 transition-opacity"
                      style={{ height: 36, padding: "0 14px", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer" }}
                    >
                      Score a job →
                    </button>
                  </div>
                )}
              </div>
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
      <p className="font-sans text-[16px] font-medium text-[#1C2333]">{message}</p>
      <p className="font-sans text-[14px] text-[rgba(28,35,51,0.55)] mt-2 max-w-xs mx-auto">{sub}</p>
      <button
        onClick={onAction}
        className="mt-6 px-4 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity"
        style={{ height: 40 }}
      >
        {action} →
      </button>
    </div>
  );
}

