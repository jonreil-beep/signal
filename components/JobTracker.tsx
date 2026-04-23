"use client";

import { useState, useRef, useEffect } from "react";
import type { TrackedJob, ApplicationStatus } from "@/types";
import ApplicationBrief from "@/components/ApplicationBrief";

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
  "Tracking":     { bg: "bg-[#FDF7EA]",                      text: "text-[#4A3C34]",  border: "border border-[rgba(26,26,26,0.15)]" },
  "Applied":      { bg: "bg-[rgba(26,26,26,0.04)]",          text: "text-[#231812]",  border: "border-0" },
  "Phone Screen": { bg: "bg-[rgba(138,133,127,0.10)]",       text: "text-[#4A3C34]",  border: "border-0" },
  "Interview":    { bg: "bg-[rgba(45,106,79,0.08)]",         text: "text-[#2D6A4F]",  border: "border-0" },
  "Offer":        { bg: "bg-[rgba(45,106,79,0.12)]",         text: "text-[#2D6A4F]",  border: "border-0" },
  "Rejected":     { bg: "bg-[rgba(107,102,96,0.08)]",        text: "text-[#6B6660]",  border: "border-0" },
};

const RECOMMENDATION_STYLES: Record<string, { color: string; border: string }> = {
  "Apply Now":                   { color: "#2D6A4F", border: "1px solid #2D6A4F" },
  "Apply with Tailoring":        { color: "#A86B2D", border: "1px solid #A86B2D" },
  "Stretch — Proceed Carefully": { color: "#C4622D", border: "1px solid #C4622D" },
  "Skip":                        { color: "#6B6660", border: "1px solid #6B6660" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

function formatDeadlineDate(deadline: string): string {
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
  return                     { textClass: "text-[#8A857F]",      label: `Due ${formatDeadlineDate(deadline)}` };
}

interface JobCardProps {
  job: TrackedJob;
  staggerIndex: number;
  profileUpdatedAt?: Date | null;
  onSelectJob: (job: TrackedJob, goTo: "job-fit" | "tailoring-brief") => void;
  onOpenBrief: (job: TrackedJob) => void;
  onRemoveJob: (id: string) => void;
  onRenameJob: (id: string, newLabel: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDeadlineChange: (id: string, deadline: string | null) => void;
}

function JobCard({ job, staggerIndex, profileUpdatedAt, onSelectJob, onOpenBrief, onRemoveJob, onRenameJob, onStatusChange, onNotesChange, onDeadlineChange }: JobCardProps) {
  const [expanded, setExpanded] = useState<"none" | "notes" | "jd" | "deadline">("none");
  const [notesValue, setNotesValue] = useState(job.notes);
  const showNotes = expanded === "notes";
  const showJD = expanded === "jd";
  const showDeadlineInput = expanded === "deadline";
  function toggleExpanded(panel: "notes" | "jd" | "deadline") {
    setExpanded(prev => prev === panel ? "none" : panel);
  }
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
    { color: "#8A857F", border: "1px solid #8A857F" };
  const statusStyle = STATUS_CONFIG[job.applicationStatus] ?? STATUS_CONFIG["Tracking"];
  const isScoreStale = !!profileUpdatedAt && new Date(job.scoredAt) < profileUpdatedAt;

  return (
    <div
      className="group relative border-b border-[rgba(26,26,26,0.10)] py-6 card-entrance"
      style={{ animationDelay: `${Math.min(staggerIndex, 5) * 50}ms` }}
    >

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
              className="text-[15px] font-[500] text-[#231812] bg-transparent border-b border-[rgba(26,26,26,0.20)] outline-none w-full leading-snug focus:ring-0"
            />
          ) : (
            <button
              onClick={() => onSelectJob(job, "job-fit")}
              className="text-[15px] font-[500] text-[#231812] hover:text-[#4A3C34] transition-colors leading-snug truncate text-left"
            >
              {job.label}
            </button>
          )}
          {!editingLabel && (
            <button
              onClick={() => setEditingLabel(true)}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#8A857F] hover:text-[#4A3C34]"
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

        {/* View Brief link */}
        <button
          onClick={() => onOpenBrief(job)}
          className="shrink-0 font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors whitespace-nowrap self-center"
        >
          View Brief →
        </button>

        {/* Primary CTA */}
        {isScoreStale ? (
          <button
            onClick={() => onSelectJob(job, "job-fit")}
            className="shrink-0 font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#A86B2D] hover:text-[#8C5520] transition-colors whitespace-nowrap"
          >
            Re-score →
          </button>
        ) : (
          <button
            onClick={() => onSelectJob(job, "tailoring-brief")}
            className="shrink-0 px-4 py-1.5 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] rounded-[2px] hover:bg-[#3D2A22] transition-colors whitespace-nowrap"
          >
            Go to Prep →
          </button>
        )}
      </div>

      {/* ── ROW 2: Score + badge + status + meta ── */}
      <div className="flex items-center justify-between gap-3 mt-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Score */}
          <span className="font-instrument-serif text-[28px] leading-none text-[#231812]">
            {job.jobFitResult.overall_fit}
            <span className="font-sans text-[11px] font-normal text-[#8A857F] ml-0.5">/10</span>
          </span>
          <span className="text-[rgba(26,26,26,0.2)] text-xs">·</span>
          {/* Recommendation badge */}
          <span
            className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[2px]"
            style={{ color: recStyle.color, border: recStyle.border }}
          >
            {job.jobFitResult.recommendation}
          </span>
          <span className="text-[rgba(26,26,26,0.2)] text-xs">·</span>
          {/* Status dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={job.applicationStatus}
              onChange={(e) => onStatusChange(job.id, e.target.value as ApplicationStatus)}
              className={`font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] pl-2.5 pr-6 py-1 rounded-[2px] cursor-pointer outline-none appearance-none hover:opacity-80 focus:ring-0 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              style={{ transition: "background-color 200ms ease-out, color 200ms ease-out" }}
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
          <span className="text-[rgba(26,26,26,0.2)] text-xs">·</span>
          {/* Scored date */}
          <span className="font-jetbrains-mono text-[10px] text-[#8A857F]">{formatDate(job.scoredAt)}</span>
          {/* Prep ready */}
          {job.tailoringResult && !isScoreStale && (
            <>
              <span className="text-[rgba(26,26,26,0.2)] text-xs">·</span>
              <span className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#2D6A4F]">Prep ready</span>
            </>
          )}
          {/* Profile updated */}
          {isScoreStale && (
            <>
              <span className="text-[rgba(26,26,26,0.2)] text-xs">·</span>
              <span className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#A86B2D]">Profile updated</span>
            </>
          )}
          {/* Deadline — only shown if set */}
          {job.deadline && (() => {
            const { textClass, label } = deadlineUrgency(job.deadline);
            return (
              <>
                <span className="text-[rgba(26,26,26,0.2)] text-xs">·</span>
                <span className={`font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] ${textClass}`}>{label}</span>
              </>
            );
          })()}
        </div>

      </div>

      {/* ── ROW 3: always-visible action row ── */}
      <div className="flex items-center mt-3 pt-3 border-t border-[rgba(26,26,26,0.08)]">
        {/* Left group: Notes · View JD · Deadline */}
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={() => toggleExpanded("notes")}
            className={`font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] transition-colors ${showNotes ? "text-[#231812]" : "text-[#8A857F] hover:text-[#231812]"}`}
          >
            {showNotes ? "Hide Notes" : job.notes?.trim() ? "Notes (1)" : "Notes"}
          </button>
          <span className="text-[rgba(26,26,26,0.15)] text-xs mx-1">·</span>
          <button
            onClick={() => toggleExpanded("jd")}
            className={`font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] transition-colors ${showJD ? "text-[#231812]" : "text-[#8A857F] hover:text-[#231812]"}`}
          >
            {showJD ? "Hide JD" : "View JD"}
          </button>
          <span className="text-[rgba(26,26,26,0.15)] text-xs mx-1">·</span>
          {showDeadlineInput ? (
            <input
              type="date"
              defaultValue={job.deadline ?? ""}
              autoFocus
              onChange={(e) => {
                const val = e.target.value || null;
                onDeadlineChange(job.id, val);
                setExpanded("none");
              }}
              onBlur={() => setExpanded("none")}
              className="font-jetbrains-mono text-[10px] border border-[rgba(26,26,26,0.15)] rounded-[2px] px-2 py-0.5 bg-[#FDF7EA] focus:outline-none focus:ring-0 focus:border-[rgba(26,26,26,0.35)] text-[#231812]"
            />
          ) : job.deadline ? (
            <button
              onClick={() => onDeadlineChange(job.id, null)}
              className="flex items-center gap-1 font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#8A857F] hover:text-[#231812] transition-colors group/dl"
              title="Clear deadline"
            >
              <span>{formatDeadlineDate(job.deadline)}</span>
              <span className="opacity-0 group-hover/dl:opacity-100 transition-opacity text-[#8A857F]">×</span>
            </button>
          ) : (
            <button
              onClick={() => toggleExpanded("deadline")}
              className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#8A857F] hover:text-[#231812] transition-colors"
            >
              + Deadline
            </button>
          )}
        </div>
        {/* Right: Remove */}
        <button
          onClick={() => onRemoveJob(job.id)}
          className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#8A857F] hover:text-[#C4622D] transition-colors px-2 py-0.5"
          aria-label="Remove job"
        >
          Remove
        </button>
      </div>

      {/* ── Expandable Notes ── */}
      {showNotes && (
        <div className="mt-3">
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            onBlur={() => onNotesChange(job.id, notesValue)}
            placeholder="Recruiter name, contacts, follow-up dates, anything relevant…"
            rows={3}
            className="w-full rounded-[2px] bg-[#F6F0E4] border border-[rgba(26,26,26,0.12)] px-3.5 py-3 font-sans text-[13px] text-[#4A3C34] placeholder:text-[#8A857F] leading-relaxed resize-none focus:outline-none focus:ring-0 focus:border-[rgba(26,26,26,0.30)] transition-colors"
          />
        </div>
      )}

      {/* ── Expandable JD ── */}
      {showJD && (
        <div className="mt-4">
          <p className="font-jetbrains-mono text-[10px] uppercase tracking-[0.10em] text-[#8A857F] mb-3">Job Description</p>
          <div
            className="overflow-y-auto px-6 py-5"
            style={{
              maxHeight: "500px",
              background: "#F6F0E4",
              border: "1px solid rgba(26,26,26,0.10)",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(26,26,26,0.15) transparent",
            }}
          >
            {(job.jobDescription ?? "").split(/\n\n+/).map((para, pi) => (
              <p
                key={pi}
                className="mb-3 last:mb-0 font-sans text-[13px] leading-[1.7] text-[#4A3C34]"
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
    </div>
  );
}

type SortBy = "date" | "score" | "deadline";
type StatusFilter = ApplicationStatus | "All";

export default function JobTracker({ jobs, hasProfile, profileUpdatedAt, onSelectJob, onRemoveJob, onRenameJob, onStatusChange, onNotesChange, onDeadlineChange, onGoToProfile, onGoToJobFit, onScoreNewJob }: JobTrackerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [briefJob, setBriefJob] = useState<TrackedJob | null>(null);

  useEffect(() => {
    if (!briefJob) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setBriefJob(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [briefJob]);

  if (jobs.length === 0) {
    return (
      <div className="py-4">
        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {[
            {
              step: "01",
              title: "Add your profile",
              body: "Upload your resume or paste the text. Your background is the foundation for all scoring and prep.",
              done: hasProfile,
            },
            {
              step: "02",
              title: "Score a job",
              body: "Paste any job description. Get an honest fit score with clear reasoning in about 20 seconds.",
              done: false,
            },
            {
              step: "03",
              title: "Build your prep",
              body: "Get a targeted prep guide covering what to emphasize, what to drop, and how to position yourself.",
              done: false,
            },
          ].map(({ step, title, body, done }) => (
            <div key={step} className={`border px-5 py-5 ${done ? "bg-[rgba(45,106,79,0.04)] border-[rgba(45,106,79,0.15)]" : "bg-[#FDF7EA] border-[rgba(26,26,26,0.10)]"}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`font-jetbrains-mono text-[10px] px-1.5 py-0.5 rounded-[2px] shrink-0 ${done ? "bg-[rgba(45,106,79,0.12)] text-[#2D6A4F]" : "bg-[rgba(26,26,26,0.06)] text-[#8A857F]"}`}>
                  {done ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="inline">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : step}
                </span>
                <p className={`font-sans text-[14px] font-[500] ${done ? "text-[#2D6A4F]" : "text-[#231812]"}`}>{title}</p>
              </div>
              <p className="font-sans text-[13px] text-[#4A3C34] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!hasProfile ? (
          <div className="text-center">
            <p className="font-sans text-[14px] text-[#4A3C34] mb-4">Start by uploading your resume. Everything else follows from there.</p>
            <button
              onClick={onGoToProfile}
              className="inline-flex items-center gap-1 px-5 py-2.5 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
            >
              Add your profile
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-sans text-[14px] text-[#4A3C34] mb-4">Profile saved. Score your first job to get started.</p>
            <button
              onClick={onGoToJobFit}
              className="inline-flex items-center gap-1 px-5 py-2.5 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
            >
              Score a job
            </button>
          </div>
        )}
      </div>
    );
  }

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
    <>
    <div className="space-y-5">
      {/* ── Search row ── */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A857F] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search jobs..."
          className="w-full pl-9 pr-4 py-2 rounded-[2px] bg-[#FDF7EA] border border-[rgba(26,26,26,0.12)] font-sans text-[14px] text-[#4A3C34] placeholder:text-[#8A857F] focus:outline-none focus:ring-0 focus:border-[rgba(26,26,26,0.30)] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A857F] hover:text-[#4A3C34] transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 10 10" stroke="currentColor">
              <path d="M1 1l8 8M9 1L1 9" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Status filter pills + sort toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {(["All", ...APPLICATION_STATUSES] as StatusFilter[]).map((s) => {
          const isActive = statusFilter === s;
          const cfg = s !== "All" ? STATUS_CONFIG[s] : null;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] px-2.5 py-1 rounded-[2px] transition-all ${
                isActive
                  ? s === "All"
                    ? "bg-[rgba(26,26,26,0.06)] text-[#231812] border border-[rgba(26,26,26,0.15)]"
                    : `${cfg!.bg} ${cfg!.text} ${cfg!.border}`
                  : "bg-[#FDF7EA] text-[#8A857F] border border-[rgba(26,26,26,0.10)] hover:text-[#231812] hover:border-[rgba(26,26,26,0.20)]"
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
        <div className="flex items-center gap-0 bg-[#FDF7EA] border border-[rgba(26,26,26,0.12)] p-1 shrink-0 self-start sm:self-auto">
          {(["date", "score", "deadline"] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] transition-all ${
                sortBy === s ? "bg-[rgba(26,26,26,0.06)] text-[#231812]" : "text-[#8A857F] hover:text-[#4A3C34]"
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
          <p className="font-sans text-[14px] text-[#4A3C34]">
            {filtered.length === 0
              ? "No jobs match your filters."
              : `${filtered.length} of ${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}
          </p>
          <button
            onClick={clearFilters}
            className="font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Job cards ── */}
      {filtered.length > 0 ? (
        <div className="space-y-0">
          {filtered.map((job, i) => (
            <JobCard
              key={job.id}
              job={job}
              staggerIndex={i}
              profileUpdatedAt={profileUpdatedAt}
              onSelectJob={onSelectJob}
              onOpenBrief={setBriefJob}
              onRemoveJob={onRemoveJob}
              onRenameJob={onRenameJob}
              onStatusChange={onStatusChange}
              onNotesChange={onNotesChange}
              onDeadlineChange={onDeadlineChange}
            />
          ))}
          {/* Score another job */}
          {!isFiltered && (
            <button
              onClick={onScoreNewJob}
              className="group/add w-full py-4 border border-dashed border-[rgba(26,26,26,0.15)] font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:border-solid hover:border-[rgba(26,26,26,0.25)] hover:text-[#4A3C34] hover:bg-[rgba(26,26,26,0.02)] transition-all duration-200 ease-out"
            >
              Score a job →
            </button>
          )}
        </div>
      ) : (
        <div className="py-8 text-center bg-[#FDF7EA] border border-[rgba(26,26,26,0.10)]">
          <p className="font-sans text-[14px] text-[#8A857F]">No jobs match your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-2 font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#4A3C34] hover:text-[#231812] transition-colors"
          >
            Clear filters →
          </button>
        </div>
      )}
    </div>

    {/* ── Application Brief slide-over ── */}
    {briefJob && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[rgba(26,26,26,0.25)] z-40"
          onClick={() => setBriefJob(null)}
          aria-hidden="true"
        />
        {/* Panel */}
        <div
          className="fixed top-0 right-0 h-full bg-[#FDF7EA] border-l border-[rgba(26,26,26,0.10)] z-50 overflow-hidden flex flex-col"
          style={{
            width: "min(480px, 100vw)",
          }}
        >
          <ApplicationBrief
            job={briefJob}
            onGoToPrep={(job) => {
              setBriefJob(null);
              onSelectJob(job, "tailoring-brief");
            }}
            onClose={() => setBriefJob(null)}
          />
        </div>
      </>
    )}
    </>
  );
}
