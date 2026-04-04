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

const STATUS_CONFIG: Record<ApplicationStatus, { bg: string; text: string; border: string }> = {
  "Tracking":     { bg: "bg-white",                           text: "text-[#374151]",  border: "border border-[#E5E7EB]" },
  "Applied":      { bg: "bg-[rgba(61,90,76,0.08)]",           text: "text-[#3D5A4C]",  border: "border-0" },
  "Phone Screen": { bg: "bg-[rgba(124,139,154,0.08)]",        text: "text-[#7C8B9A]",  border: "border-0" },
  "Interview":    { bg: "bg-[rgba(75,155,126,0.08)]",         text: "text-[#4B9B7E]",  border: "border-0" },
  "Offer":        { bg: "bg-[rgba(75,155,126,0.12)]",         text: "text-[#4B9B7E]",  border: "border-0" },
  "Rejected":     { bg: "bg-[rgba(163,163,163,0.08)]",        text: "text-[#9CA3AF]",  border: "border-0" },
};

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  "Apply Now":                   { bg: "bg-[rgba(75,155,126,0.10)]",   text: "text-[#4B9B7E]", ring: "" },
  "Apply with Tailoring":        { bg: "bg-[rgba(124,139,154,0.10)]",  text: "text-[#7C8B9A]", ring: "" },
  "Stretch — Proceed Carefully": { bg: "bg-[rgba(176,144,110,0.10)]",  text: "text-[#B0906E]", ring: "" },
  "Skip":                        { bg: "bg-[rgba(163,163,163,0.10)]",  text: "text-[#A3A3A3]", ring: "" },
};

function scoreColor(score: number) {
  if (score >= 7) return "text-[#4B9B7E]";
  if (score >= 5) return "text-[#B0906E]";
  return "text-[#C45C5C]";
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
  return                     { textClass: "text-[#9CA3AF]",  label: `Due ${formatDeadlineDate(deadline)}` };
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
    { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", ring: "ring-[#E5E7EB]" };
  const statusStyle = STATUS_CONFIG[job.applicationStatus] ?? STATUS_CONFIG["Tracking"];
  const isScoreStale = !!profileUpdatedAt && new Date(job.scoredAt) < profileUpdatedAt;

  // Overflow row is always rendered when something is expanded so actions stay accessible
  const overflowVisible = showOverflow || showNotes || showJD || showDeadlineInput;

  return (
    <div className="group relative bg-white rounded-xl px-6 pt-5 pb-5 transition-all duration-150 hover:-translate-y-px" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)"; }}>

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
              className="text-[15px] font-[500] text-[#111827] bg-transparent border-b border-[#D1D5DB] outline-none w-full leading-snug focus:ring-0"
            />
          ) : (
            <button
              onClick={() => onSelectJob(job, "job-fit")}
              className="text-[15px] font-[500] text-[#111827] hover:text-[#3D5A4C] transition-colors leading-snug truncate text-left"
            >
              {job.label}
            </button>
          )}
          {/* Pencil — only visible on card hover, not when editing */}
          {!editingLabel && (
            <button
              onClick={() => setEditingLabel(true)}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#9CA3AF] hover:text-[#6B7280]"
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
            className="shrink-0 text-sm font-[500] text-[#B0906E] hover:text-[#B0906E]/70 transition-colors whitespace-nowrap"
          >
            Re-score →
          </button>
        ) : (
          <button
            onClick={() => onSelectJob(job, "tailoring-brief")}
            className="shrink-0 px-5 py-2 bg-[#3D5A4C] text-white text-[14px] font-[500] rounded-full hover:bg-[#2E4A3C] transition-colors whitespace-nowrap"
          >
            Go to Prep →
          </button>
        )}
      </div>

      {/* ── ROW 2: Score + badge + status + meta ── */}
      <div className="flex items-center justify-between gap-3 mt-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Score */}
          <span className={`text-xl font-semibold tabular-nums leading-none ${scoreColor(job.jobFitResult.overall_fit)}`}>
            {job.jobFitResult.overall_fit}
            <span className="text-xs font-normal text-[#9CA3AF]">/10</span>
          </span>
          <span className="text-[#9CA3AF] text-xs">·</span>
          {/* Recommendation badge */}
          <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${recStyle.bg} ${recStyle.text}`}>
            {job.jobFitResult.recommendation}
          </span>
          <span className="text-[#9CA3AF] text-xs">·</span>
          {/* Status dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={job.applicationStatus}
              onChange={(e) => onStatusChange(job.id, e.target.value as ApplicationStatus)}
              className={`text-[12px] font-[400] pl-2.5 pr-6 py-1 rounded-full cursor-pointer border border-[#D1D5DB] outline-none appearance-none transition-all hover:opacity-80 focus:ring-0 focus:border-[#3D5A4C] ${statusStyle.bg} ${statusStyle.text}`}
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
          <span className="text-[#9CA3AF] text-xs">·</span>
          {/* Scored date */}
          <span className="text-xs text-[#9CA3AF]">{formatDate(job.scoredAt)}</span>
          {/* Prep ready */}
          {job.tailoringResult && !isScoreStale && (
            <>
              <span className="text-[#9CA3AF] text-xs">·</span>
              <span className="text-[12px] text-[#4B9B7E] font-medium">Prep ready</span>
            </>
          )}
          {/* Profile updated */}
          {isScoreStale && (
            <>
              <span className="text-[#9CA3AF] text-xs">·</span>
              <span className="text-[12px] text-[#B0906E] font-medium">Profile updated</span>
            </>
          )}
          {/* Deadline — only shown if set */}
          {job.deadline && (() => {
            const { textClass, label } = deadlineUrgency(job.deadline);
            return (
              <>
                <span className="text-[#9CA3AF] text-xs">·</span>
                <span className={`text-xs font-medium ${textClass}`}>{label}</span>
              </>
            );
          })()}
        </div>

        {/* ••• overflow toggle — fades in on hover, stays visible when open */}
        <button
          onClick={() => setShowOverflow((v) => !v)}
          className={`shrink-0 text-[#9CA3AF] hover:text-[#6B7280] transition-all text-base leading-none tracking-widest px-1 ${
            overflowVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          aria-label="More options"
        >
          •••
        </button>
      </div>

      {/* ── OVERFLOW ROW: secondary actions (Notes, View JD, Deadline, Remove) ── */}
      {overflowVisible && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F3F4F6]">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className={`text-[13px] font-medium transition-colors ${showNotes ? "text-[#374151]" : "text-[#9CA3AF] hover:text-[#6B7280]"}`}
          >
            {showNotes ? "Hide Notes" : "Notes"}
          </button>
          <button
            onClick={() => setShowJD((v) => !v)}
            className={`text-[13px] font-medium transition-colors ${showJD ? "text-[#374151]" : "text-[#9CA3AF] hover:text-[#6B7280]"}`}
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
              className="text-xs border border-[#D1D5DB] rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-0 focus:border-[#3D5A4C]"
            />
          ) : job.deadline ? (
            <button
              onClick={() => onDeadlineChange(job.id, null)}
              className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#888888] transition-colors group/dl"
              title="Clear deadline"
            >
              <span>{formatDeadlineDate(job.deadline)}</span>
              <span className="opacity-0 group-hover/dl:opacity-100 transition-opacity">×</span>
            </button>
          ) : (
            <button
              onClick={() => setShowDeadlineInput(true)}
              className="text-[13px] font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              + Deadline
            </button>
          )}
          {/* Remove — pushed right */}
          <div className="flex-1" />
          <button
            onClick={() => onRemoveJob(job.id)}
            className="text-[13px] text-[#DC2626] hover:bg-[rgba(220,38,38,0.05)] transition-colors px-2 py-0.5 rounded"
            aria-label="Remove job"
          >
            Remove
          </button>
        </div>
      )}

      {/* ── Expandable Notes ── */}
      {showNotes && (
        <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
          <p className="text-[12px] font-medium tracking-[0.05em] uppercase text-[#6B7280] mb-2">Notes</p>
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            onBlur={() => onNotesChange(job.id, notesValue)}
            placeholder="Recruiter name, contacts, follow-up dates, anything relevant…"
            rows={3}
            className="w-full rounded-lg bg-[#F9FAFB] border border-[#D1D5DB] px-3.5 py-3 text-[14px] text-[#374151] placeholder:text-[#9CA3AF] leading-relaxed resize-none focus:outline-none focus:ring-0 focus:border-[#3D5A4C] transition-colors"
          />
        </div>
      )}

      {/* ── Expandable JD ── */}
      {showJD && (
        <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
          <p className="text-[12px] font-medium tracking-[0.05em] uppercase text-[#6B7280] mb-2">Job Description</p>
          <div className="max-h-56 overflow-y-auto rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] p-3.5">
            <pre className="text-xs text-[#6B7280] whitespace-pre-wrap font-mono leading-relaxed">
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
            <div key={step} className={`rounded-xl p-5 ${done ? "bg-[rgba(75,155,126,0.06)]" : "bg-white"}`} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-[500] shrink-0 ${done ? "bg-[#4B9B7E] text-white" : "bg-[#111827] text-white"}`}>
                  {done ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : step}
                </span>
                <p className={`text-sm font-[500] ${done ? "text-[#4B9B7E]" : "text-[#111827]"}`}>{title}</p>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!hasProfile ? (
          <div className="text-center">
            <p className="text-[14px] text-[#6B7280] mb-4">Start by uploading your resume. Everything else follows from there.</p>
            <button
              onClick={onGoToProfile}
              className="inline-flex items-center gap-1 px-5 py-2 bg-[#3D5A4C] text-white text-[14px] font-[500] rounded-full hover:bg-[#2E4A3C] transition-colors"
            >
              Add your profile
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[14px] text-[#6B7280] mb-4">Profile saved. Score your first job to get started.</p>
            <button
              onClick={onGoToJobFit}
              className="inline-flex items-center gap-1 px-5 py-2 bg-[#3D5A4C] text-white text-[14px] font-[500] rounded-full hover:bg-[#2E4A3C] transition-colors"
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search jobs..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-white text-[14px] text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D5A4C] transition-colors"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
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
              className={`text-[13px] font-[400] px-3 py-1 rounded-full transition-all ${
                isActive
                  ? s === "All"
                    ? "bg-[#F3F4F6] text-[#111827] border border-[#D1D5DB]"
                    : `${cfg!.bg} ${cfg!.text} border border-current/20`
                  : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#111827] hover:bg-[#F9FAFB]"
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
        <div className="flex items-center gap-1 bg-white rounded-lg border border-[#E5E7EB] p-1 shrink-0">
          {(["date", "score", "deadline"] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-md text-[13px] font-[400] transition-all ${
                sortBy === s ? "bg-[#F3F4F6] text-[#111827] border border-[#D1D5DB]" : "text-[#9CA3AF] hover:text-[#6B7280]"
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
          <p className="text-[14px] text-[#6B7280]">
            {filtered.length === 0
              ? "No jobs match your filters."
              : `${filtered.length} of ${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}
          </p>
          <button
            onClick={clearFilters}
            className="text-[14px] text-[#3D5A4C] hover:text-[#2E4A3C] transition-colors"
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
              className="w-full py-4 rounded-xl border-[1.5px] border-dashed border-[#E5E7EB] text-[14px] font-[400] text-[#9CA3AF] hover:border-[#D1D5DB] hover:text-[#6B7280] transition-colors"
            >
              Score a job →
            </button>
          )}
        </div>
      ) : (
        <div className="py-8 text-center bg-white rounded-xl" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
          <p className="text-[14px] text-[#9CA3AF]">No jobs match your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-[14px] text-[#3D5A4C] hover:text-[#2E4A3C] transition-colors"
          >
            Clear filters →
          </button>
        </div>
      )}
    </div>
  );
}
