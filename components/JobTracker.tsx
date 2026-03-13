"use client";

import type { TrackedJob } from "@/types";

interface JobTrackerProps {
  jobs: TrackedJob[];
  onSelectJob: (job: TrackedJob, goTo: "job-fit" | "tailoring-brief") => void;
  onRemoveJob: (id: string) => void;
}

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

export default function JobTracker({ jobs, onSelectJob, onRemoveJob }: JobTrackerProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-brand-text">No jobs tracked yet</p>
        <p className="text-sm text-brand-text/40 mt-1 max-w-xs mx-auto">
          Score a job in the Job Fit tab and it will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const recStyle =
          RECOMMENDATION_STYLES[job.jobFitResult.recommendation] ??
          { bg: "bg-brand-text/6", text: "text-brand-text/60", ring: "ring-brand-text/15" };

        return (
          <div
            key={job.id}
            className="bg-white rounded-2xl p-5 ring-1 ring-brand-text/8 shadow-sm"
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-brand-text leading-snug">{job.label}</p>
              <button
                onClick={() => onRemoveJob(job.id)}
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
                  <span className="text-xs text-status-apply font-medium">Brief ready</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => onSelectJob(job, "job-fit")}
                className="text-sm font-medium text-brand-accent hover:text-brand-accent/70 transition-colors"
              >
                View Fit →
              </button>
              <button
                onClick={() => onSelectJob(job, "tailoring-brief")}
                className="text-sm font-medium text-brand-accent hover:text-brand-accent/70 transition-colors"
              >
                View Brief →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
