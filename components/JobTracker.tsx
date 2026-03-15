"use client";

import { useState } from "react";
import type { TrackedJob, ApplicationStatus } from "@/types";
import JobLabelEditor from "./JobLabelEditor";

interface JobTrackerProps {
  jobs: TrackedJob[];
  hasProfile: boolean;
  onSelectJob: (job: TrackedJob, goTo: "job-fit" | "tailoring-brief") => void;
  onRemoveJob: (id: string) => void;
  onRenameJob: (id: string, newLabel: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onGoToProfile: () => void;
  onGoToJobFit: () => void;
}

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Tracking", "Applied", "Phone Screen", "Interview", "Offer", "Rejected",
];

const STATUS_CONFIG: Record<ApplicationStatus, { bg: string; text: string }> = {
  "Tracking":     { bg: "bg-brand-text/8",      text: "text-brand-text/50" },
  "Applied":      { bg: "bg-status-tailor/10",  text: "text-status-tailor" },
  "Phone Screen": { bg: "bg-status-tailor/10",  text: "text-status-tailor" },
  "Interview":    { bg: "bg-status-apply/10",   text: "text-status-apply"  },
  "Offer":        { bg: "bg-status-apply/20",   text: "text-status-apply"  },
  "Rejected":     { bg: "bg-status-skip/10",    text: "text-status-skip"   },
};

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  "Apply Now":                  { bg: "bg-status-apply/10",   text: "text-status-apply",   ring: "ring-status-apply/25"   },
  "Apply with Tailoring":       { bg: "bg-status-tailor/10",  text: "text-status-tailor",  ring: "ring-status-tailor/25"  },
  "Stretch — Proceed Carefully":{ bg: "bg-status-stretch/10", text: "text-status-stretch", ring: "ring-status-stretch/25" },
  "Skip":                       { bg: "bg-status-skip/10",    text: "text-status-skip",    ring: "ring-status-skip/25"    },
};

function scoreColor(score: number) {
  if (score >= 7) return "text-status-apply";
  if (score >= 5) return "text-status-tailor";
  return "text-status-stretch";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}


interface JobCardProps {
  job: TrackedJob;
  onSelectJob: (job: TrackedJob, goTo: "job-fit" | "tailoring-brief") => void;
  onRemoveJob: (id: string) => void;
  onRenameJob: (id: string, newLabel: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

function JobCard({ job, onSelectJob, onRemoveJob, onRenameJob, onStatusChange }: JobCardProps) {
  const [showJD, setShowJD] = useState(false);
  const recStyle =
    RECOMMENDATION_STYLES[job.jobFitResult.recommendation] ??
    { bg: "bg-brand-text/6", text: "text-brand-text/60", ring: "ring-brand-text/15" };
  const statusStyle = STATUS_CONFIG[job.applicationStatus] ?? STATUS_CONFIG["Tracking"];

  return (
    <div
      onClick={() => onSelectJob(job, "job-fit")}
      className="bg-white rounded-2xl p-5 shadow cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <JobLabelEditor id={job.id} label={job.label} onRename={onRenameJob} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemoveJob(job.id); }}
          className="shrink-0 text-brand-text/20 hover:text-brand-text/50 transition-colors text-lg leading-none mt-0.5"
          aria-label="Remove job"
        >
          ×
        </button>
      </div>

      {/* Score + recommendation + date */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-xl font-bold tabular-nums ${scoreColor(job.jobFitResult.overall_fit)}`}>
          {job.jobFitResult.overall_fit}
          <span className="text-sm font-normal text-brand-text/40">/10</span>
        </span>
        <span className="text-brand-text/20">·</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${recStyle.bg} ${recStyle.text} ${recStyle.ring}`}>
          {job.jobFitResult.recommendation}
        </span>
        <span className="text-brand-text/20">·</span>
        <span className="text-xs text-brand-text/40">{formatDate(job.scoredAt)}</span>
        {job.tailoringResult && (
          <>
            <span className="text-brand-text/20">·</span>
            <span className="text-xs text-status-apply font-medium">Prep ready</span>
          </>
        )}
      </div>

      {/* Status + actions row */}
      <div className="flex items-center justify-between gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
        <select
          value={job.applicationStatus}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(job.id, e.target.value as ApplicationStatus);
          }}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer border-0 outline-none appearance-none ${statusStyle.bg} ${statusStyle.text}`}
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); setShowJD((v) => !v); }}
            className="text-sm font-medium text-brand-text/35 hover:text-brand-text/70 transition-colors"
          >
            {showJD ? "Hide JD" : "View JD"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSelectJob(job, "tailoring-brief"); }}
            className="text-sm font-medium text-brand-accent hover:text-brand-accent/70 transition-colors"
          >
            View Prep →
          </button>
        </div>
      </div>

      {/* Expandable JD */}
      {showJD && (
        <div className="mt-4 pt-4 border-t border-brand-text/8" onClick={(e) => e.stopPropagation()}>
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/30 mb-2">
            Job Description
          </p>
          <div className="max-h-56 overflow-y-auto rounded-xl bg-brand-text/3 p-3.5">
            <pre className="text-xs text-brand-text/60 whitespace-pre-wrap font-mono leading-relaxed">
              {job.jobDescription}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobTracker({ jobs, hasProfile, onSelectJob, onRemoveJob, onRenameJob, onStatusChange, onGoToProfile, onGoToJobFit }: JobTrackerProps) {
  if (jobs.length === 0) {
    return (
      <div className="py-4">
        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {[
            {
              step: "1",
              title: "Add your profile",
              body: "Upload your resume or paste the text. Your background is the foundation for all scoring and prep.",
              done: hasProfile,
            },
            {
              step: "2",
              title: "Score a job",
              body: "Paste any job description. Get an honest fit score with clear reasoning in about 20 seconds.",
              done: false,
            },
            {
              step: "3",
              title: "Build your prep",
              body: "Get a targeted prep guide covering what to emphasize, what to drop, and how to position yourself.",
              done: false,
            },
          ].map(({ step, title, body, done }) => (
            <div key={step} className={`rounded-2xl p-5 ${done ? "bg-status-apply/6 shadow" : "bg-white shadow"}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${done ? "bg-status-apply text-white" : "bg-brand-text text-white"}`}>
                  {done ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : step}
                </span>
                <p className={`text-sm font-semibold ${done ? "text-status-apply" : "text-brand-text"}`}>{title}</p>
              </div>
              <p className="text-sm text-brand-text/50 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!hasProfile ? (
          <div className="text-center">
            <p className="text-base text-brand-text/50 mb-4">Start by uploading your resume. Everything else follows from there.</p>
            <button
              onClick={onGoToProfile}
              className="inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
            >
              Add your profile
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-base text-brand-text/50 mb-4">Profile saved. Score your first job to get started.</p>
            <button
              onClick={onGoToJobFit}
              className="inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
            >
              Score a job
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onSelectJob={onSelectJob}
          onRemoveJob={onRemoveJob}
          onRenameJob={onRenameJob}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
