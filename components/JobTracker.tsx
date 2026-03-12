"use client";

import type { TrackedJob } from "@/types";

interface JobTrackerProps {
  jobs: TrackedJob[];
  onSelectJob: (job: TrackedJob, goTo: "job-fit" | "tailoring-brief") => void;
  onRemoveJob: (id: string) => void;
}

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  "Apply Now":                  { bg: "bg-green-50",  text: "text-green-700",  ring: "ring-green-200"  },
  "Apply with Tailoring":       { bg: "bg-blue-50",   text: "text-blue-700",   ring: "ring-blue-200"   },
  "Stretch — Proceed Carefully":{ bg: "bg-yellow-50", text: "text-yellow-700", ring: "ring-yellow-200" },
  "Skip":                       { bg: "bg-red-50",    text: "text-red-700",    ring: "ring-red-200"    },
};

function scoreColor(score: number) {
  if (score >= 7) return "text-green-600";
  if (score >= 5) return "text-yellow-500";
  return "text-red-500";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

export default function JobTracker({ jobs, onSelectJob, onRemoveJob }: JobTrackerProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-gray-900">No jobs tracked yet</p>
        <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
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
          { bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-200" };

        return (
          <div
            key={job.id}
            className="bg-white rounded-2xl p-5 ring-1 ring-gray-200/80 shadow-sm"
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900 leading-snug">{job.label}</p>
              <button
                onClick={() => onRemoveJob(job.id)}
                className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none mt-0.5"
                aria-label="Remove job"
              >
                ×
              </button>
            </div>

            {/* Score + recommendation + date */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xl font-bold tabular-nums ${scoreColor(job.jobFitResult.overall_fit)}`}>
                {job.jobFitResult.overall_fit}
                <span className="text-sm font-normal text-gray-400">/10</span>
              </span>
              <span className="text-gray-200">·</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${recStyle.bg} ${recStyle.text} ${recStyle.ring}`}>
                {job.jobFitResult.recommendation}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">{formatDate(job.scoredAt)}</span>
              {job.tailoringResult && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-blue-500 font-medium">Brief ready</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => onSelectJob(job, "job-fit")}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                View Fit →
              </button>
              <button
                onClick={() => onSelectJob(job, "tailoring-brief")}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
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
