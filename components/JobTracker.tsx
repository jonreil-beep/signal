"use client";

import { useState, useRef, useEffect } from "react";
import type { TrackedJob, ApplicationStatus } from "@/types";

interface JobTrackerProps {
  jobs: TrackedJob[];
  hasProfile: boolean;
  profileUpdatedAt?: Date | null;
  onSelectJob: (job: TrackedJob, goTo: "job-fit" | "tailoring-brief") => void;
  onRemoveJob: (id: string) => void;
  onRenameJob: (id: string, newLabel: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDeadlineChange: (id: string, deadline: string | null) => void;
  onGoToProfile: () => void;
  onGoToJobFit: () => void;
  onScoreNewJob: () => void;
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

function formatDeadlineDate(deadline: string): string {
  // Parse as local date to avoid UTC offset shifting the day
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(deadline + "T00:00:00")
  );
}

function deadlineUrgency(deadline: string): { textClass: string; label: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { textClass: "text-status-skip",    label: "Overdue" };
  if (diffDays === 0) return { textClass: "text-status-skip",    label: "Due today" };
  if (diffDays <= 3)  return { textClass: "text-status-stretch", label: `Due in ${diffDays}d` };
  if (diffDays <= 7)  return { textClass: "text-status-tailor",  label: `Due ${formatDeadlineDate(deadline)}` };
  return                     { textClass: "text-brand-text/40",  label: `Due ${formatDeadlineDate(deadline)}` };
}

interface JobCardProps {
  job: TrackedJob;
  profileUpdatedAt?: Date | null;
  onSelectJob: (job: TrackedJob, goTo: "job-fit" | "tailoring-brief") => void;
  onRemoveJob: (id: string) => void;
  onRenameJob: (id: string, newLabel: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDeadlineChange: (id: string, deadline: string | null) => void;
}

function JobCard({ job, profileUpdatedAt, onSelectJob, onRemoveJob, onRenameJob, onStatusChange, onNotesChange, onDeadlineChange }: JobCardProps) {
  const [showJD, setShowJD] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(job.notes);
  const [showOverflow, setShowOverflow] = useState(false);
  const [showDeadlineInput, setShowDeadlineInput] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(job.label);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editingLabel) setLabelValue(job.label); }, [job.label, editingLabel]);
  useEffect(() => { if (editingLabel) labelInputRef.current?.select(); }, [editingLabel]);

  function commitLabel() {
    const trimmed = labelValue.trim();
    if (trimmed && trimmed !== job.label) onRenameJob(job.id, trimmed);
    else setLabelValue(job.label);
    setEditingLabel(false);
  }

  const recStyle =
    RECOMMENDATION_STYLES[job.jobFitResult.recommendation] ??
    { bg: "bg-brand-text/6", text: "text-brand-text/60", ring: "ring-brand-text/15" };
  const statusStyle = STATUS_CONFIG[job.applicationStatus] ?? STATUS_CONFIG["Tracking"];
  const isScoreStale = !!profileUpdatedAt && new Date(job.scoredAt) < profileUpdatedAt;

  // Overflow row is always rendered when something is expanded so actions stay accessible
  const overflowVisible = showOverflow || showNotes || showJD || showDeadlineInput;

  return (
    <div className="group relative bg-white rounded-2xl shadow px-6 pt-5 pb-5 hover:shadow-md hover:bg-[rgba(26,26,26,0.005)] transition-all">

      {/* ── ROW 1: Title + Primary CTA ── */}
      <div className="flex items-start justify-between gap-4">

        {/* Title area */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {editingLabel ? (
            <input
              ref={labelInputRef}
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLabel();
                if (e.key === "Escape") { setLabelValue(job.label); setEditingLabel(false); }
              }}
              className="text-base font-bold text-brand-text bg-transparent border-b border-brand-text/30 outline-none w-full leading-snug focus:ring-0"
            />
          ) : (
            <button
              onClick={() => onSelectJob(job, "job-fit")}
              className="text-base font-bold text-brand-text hover:text-brand-accent transition-colors leading-snug truncate text-left"
            >
              {job.label}
            </button>
          )}
          {/* Pencil — only visible on card hover, not when editing */}
          {!editingLabel && (
            <button
              onClick={() => setEditingLabel(true)}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-brand-text/25 hover:text-brand-text/60"
              aria-label="Rename job"
            >
              <svg style={{ width: "0.8rem", height: "0.8rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Primary CTA */}
        {isScoreStale ? (
          <button
            onClick={() => onSelectJob(job, "job-fit")}
            className="shrink-0 text-sm font-bold text-status-stretch hover:text-status-stretch/70 transition-colors whitespace-nowrap"
          >
            Re-score →
          </button>
        ) : (
          <button
            onClick={() => onSelectJob(job, "tailoring-brief")}
            className="shrink-0 text-sm font-bold text-brand-accent hover:text-brand-accent/70 transition-colors whitespace-nowrap"
          >
            View Prep →
          </button>
        )}
      </div>

      {/* ── ROW 2: Score + badge + status + meta ── */}
      <div className="flex items-center justify-between gap-3 mt-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Score */}
          <span className={`text-xl font-bold tabular-nums leading-none ${scoreColor(job.jobFitResult.overall_fit)}`}>
            {job.jobFitResult.overall_fit}
            <span className="text-xs font-normal text-brand-text/40">/10</span>
          </span>
          <span className="text-brand-text/20 text-xs">·</span>
          {/* Recommendation badge */}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${recStyle.bg} ${recStyle.text} ${recStyle.ring}`}>
            {job.jobFitResult.recommendation}
          </span>
          <span className="text-brand-text/20 text-xs">·</span>
          {/* Status dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={job.applicationStatus}
              onChange={(e) => onStatusChange(job.id, e.target.value as ApplicationStatus)}
              className={`text-xs font-semibold pl-2.5 pr-6 py-1 rounded-full cursor-pointer border border-brand-text/15 outline-none appearance-none transition-all hover:opacity-80 focus:ring-0 focus:border-brand-text/30 ${statusStyle.bg} ${statusStyle.text}`}
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <svg
              className={`absolute right-1.5 w-2.5 h-2.5 pointer-events-none shrink-0 ${statusStyle.text}`}
              viewBox="0 0 10 6" fill="none" aria-hidden="true"
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-brand-text/20 text-xs">·</span>
          {/* Scored date */}
          <span className="text-xs text-brand-text/35">{formatDate(job.scoredAt)}</span>
          {/* Prep ready */}
          {job.tailoringResult && !isScoreStale && (
            <>
              <span className="text-brand-text/20 text-xs">·</span>
              <span className="text-xs text-status-apply font-medium">Prep ready</span>
            </>
          )}
          {/* Profile updated */}
          {isScoreStale && (
            <>
              <span className="text-brand-text/20 text-xs">·</span>
              <span className="text-xs text-status-stretch font-medium">Profile updated</span>
            </>
          )}
          {/* Deadline — only shown if set */}
          {job.deadline && (() => {
            const { textClass, label } = deadlineUrgency(job.deadline);
            return (
              <>
                <span className="text-brand-text/20 text-xs">·</span>
                <span className={`text-xs font-medium ${textClass}`}>{label}</span>
              </>
            );
          })()}
        </div>

        {/* ••• overflow toggle — fades in on hover, stays visible when open */}
        <button
          onClick={() => setShowOverflow((v) => !v)}
          className={`shrink-0 text-brand-text/30 hover:text-brand-text/60 transition-all text-base leading-none tracking-widest px-1 ${
            overflowVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          aria-label="More options"
        >
          •••
        </button>
      </div>

      {/* ── OVERFLOW ROW: secondary actions (Notes, View JD, Deadline, Remove) ── */}
      {overflowVisible && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-brand-text/6">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className={`text-sm font-medium transition-colors ${showNotes ? "text-brand-text/70" : "text-brand-text/35 hover:text-brand-text/70"}`}
          >
            {showNotes ? "Hide Notes" : "Notes"}
          </button>
          <button
            onClick={() => setShowJD((v) => !v)}
            className={`text-sm font-medium transition-colors ${showJD ? "text-brand-text/70" : "text-brand-text/35 hover:text-brand-text/70"}`}
          >
            {showJD ? "Hide JD" : "View JD"}
          </button>
          {/* Deadline in overflow */}
          {showDeadlineInput ? (
            <input
              type="date"
              defaultValue={job.deadline ?? ""}
              autoFocus
              onChange={(e) => {
                const val = e.target.value || null;
                onDeadlineChange(job.id, val);
                setShowDeadlineInput(false);
              }}
              onBlur={() => setShowDeadlineInput(false)}
              className="text-xs border border-brand-text/15 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-0 focus:border-brand-text/30"
            />
          ) : job.deadline ? (
            <button
              onClick={() => onDeadlineChange(job.id, null)}
              className="flex items-center gap-1 text-xs text-brand-text/35 hover:text-status-skip transition-colors group/dl"
              title="Clear deadline"
            >
              <span>{formatDeadlineDate(job.deadline)}</span>
              <span className="opacity-0 group-hover/dl:opacity-100 transition-opacity">×</span>
            </button>
          ) : (
            <button
              onClick={() => setShowDeadlineInput(true)}
              className="text-sm font-medium text-brand-text/35 hover:text-brand-text/70 transition-colors"
            >
              + Deadline
            </button>
          )}
          {/* Remove — pushed right */}
          <div className="flex-1" />
          <button
            onClick={() => onRemoveJob(job.id)}
            className="text-sm font-medium text-brand-text/25 hover:text-status-skip transition-colors"
            aria-label="Remove job"
          >
            Remove
          </button>
        </div>
      )}

      {/* ── Expandable Notes ── */}
      {showNotes && (
        <div className="mt-4 pt-4 border-t border-brand-text/8">
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/30 mb-2">Notes</p>
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            onBlur={() => onNotesChange(job.id, notesValue)}
            placeholder="Recruiter name, contacts, follow-up dates, anything relevant…"
            rows={3}
            className="w-full rounded-xl bg-brand-text/3 border border-brand-text/15 px-3.5 py-3 text-base text-brand-text/80 placeholder:text-brand-text/25 leading-relaxed resize-none focus:outline-none focus:ring-0 focus:border-brand-text/30 transition-colors"
          />
        </div>
      )}

      {/* ── Expandable JD ── */}
      {showJD && (
        <div className="mt-4 pt-4 border-t border-brand-text/8">
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/30 mb-2">Job Description</p>
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

type SortBy = "date" | "score" | "deadline";
type StatusFilter = ApplicationStatus | "All";

export default function JobTracker({ jobs, hasProfile, profileUpdatedAt, onSelectJob, onRemoveJob, onRenameJob, onStatusChange, onNotesChange, onDeadlineChange, onGoToProfile, onGoToJobFit, onScoreNewJob }: JobTrackerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortBy, setSortBy] = useState<SortBy>("date");

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

  // Compute filtered + sorted list
  const filtered = jobs
    .filter((j) => statusFilter === "All" || j.applicationStatus === statusFilter)
    .filter((j) => !searchQuery.trim() || j.label.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "score") return b.jobFitResult.overall_fit - a.jobFitResult.overall_fit;
      if (sortBy === "deadline") {
        const aTime = a.deadline ? new Date(a.deadline + "T00:00:00").getTime() : Infinity;
        const bTime = b.deadline ? new Date(b.deadline + "T00:00:00").getTime() : Infinity;
        return aTime - bTime;
      }
      return new Date(b.scoredAt).getTime() - new Date(a.scoredAt).getTime();
    });

  const isFiltered = searchQuery.trim() !== "" || statusFilter !== "All";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("All");
  }

  return (
    <div className="space-y-4">
      {/* ── Search row ── */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search jobs…"
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-brand-text/15 text-sm text-brand-text placeholder:text-brand-text/30 focus:outline-none focus:ring-0 focus:border-brand-text/30 transition-colors shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text/30 hover:text-brand-text/60 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 10 10" stroke="currentColor">
              <path d="M1 1l8 8M9 1L1 9" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Status filter pills + sort toggle ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
        {(["All", ...APPLICATION_STATUSES] as StatusFilter[]).map((s) => {
          const isActive = statusFilter === s;
          const cfg = s !== "All" ? STATUS_CONFIG[s] : null;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                isActive
                  ? s === "All"
                    ? "bg-brand-text text-white"
                    : `${cfg!.bg} ${cfg!.text} ring-1 ring-inset ring-current/20 opacity-100`
                  : "bg-white text-brand-text/40 hover:text-brand-text/70 border border-brand-text/10"
              }`}
            >
              {s}
              {s !== "All" && (
                <span className="ml-1 opacity-60">
                  {jobs.filter((j) => j.applicationStatus === s).length}
                </span>
              )}
            </button>
          );
        })}
        </div>
        {/* Sort toggle */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-brand-text/10 shadow-sm p-1 shrink-0">
          {(["date", "score", "deadline"] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                sortBy === s ? "bg-brand-text text-white shadow-sm" : "text-brand-text/40 hover:text-brand-text/70"
              }`}
            >
              {s === "date" ? "Date" : s === "score" ? "Score" : "Due"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Result count when filtered ── */}
      {isFiltered && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-brand-text/40">
            {filtered.length === 0
              ? "No jobs match your filters."
              : `${filtered.length} of ${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}
          </p>
          <button
            onClick={clearFilters}
            className="text-sm text-brand-accent hover:text-brand-accent/70 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Job cards ── */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              profileUpdatedAt={profileUpdatedAt}
              onSelectJob={onSelectJob}
              onRemoveJob={onRemoveJob}
              onRenameJob={onRenameJob}
              onStatusChange={onStatusChange}
              onNotesChange={onNotesChange}
              onDeadlineChange={onDeadlineChange}
            />
          ))}
          {/* Score another job — dashed card at bottom of list */}
          {!isFiltered && (
            <button
              onClick={onScoreNewJob}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-brand-text/15 text-sm font-medium text-brand-text/35 hover:border-brand-text/30 hover:text-brand-text/55 transition-colors"
            >
              Score a job →
            </button>
          )}
        </div>
      ) : (
        <div className="py-8 text-center bg-white rounded-2xl shadow">
          <p className="text-base text-brand-text/50">No jobs match your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-brand-accent hover:text-brand-accent/70 transition-colors"
          >
            Clear filters →
          </button>
        </div>
      )}
    </div>
  );
}
