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

const RECOMMENDATION_STYLES: Record<string, { color: string; dotColor: string; bg: string; border: string }> = {
  "Apply Now":                   { color: "#7A8B73", dotColor: "#7A8B73", bg: "rgba(122,139,115,0.08)",  border: "none" },
  "Apply with Tailoring":        { color: "#9B8E73", dotColor: "#9B8E73", bg: "rgba(155,142,115,0.10)", border: "none" },
  "Stretch — Proceed Carefully": { color: "#8A7373", dotColor: "#8A7373", bg: "rgba(138,115,115,0.10)", border: "none" },
  "Skip":                        { color: "rgba(28,35,51,0.45)", dotColor: "rgba(28,35,51,0.28)", bg: "rgba(28,35,51,0.04)", border: "none" },
};

function formatDateRelative(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "YESTERDAY";
  if (diffDays < 7) return `${diffDays}D AGO`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d).toUpperCase();
}

function formatDeadlineDate(deadline: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(deadline + "T00:00:00")
  );
}

function deadlineUrgency(deadline: string): { color: string; label: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return { color: "#8A7373", label: "Overdue" };
  if (diffDays === 0) return { color: "#8A7373", label: "Due today" };
  if (diffDays <= 3)  return { color: "#9B8E73", label: `Due in ${diffDays}d` };
  if (diffDays <= 7)  return { color: "#9B8E73", label: `Due ${formatDeadlineDate(deadline)}` };
  return               { color: "rgba(28,35,51,0.45)", label: `Due ${formatDeadlineDate(deadline)}` };
}

interface TableRowProps {
  job: TrackedJob;
  staggerIndex: number;
  profileUpdatedAt?: Date | null;
  onSelectJob: (job: TrackedJob, goTo: "job-fit" | "tailoring-brief") => void;
  onRemoveJob: (id: string) => void;
  onRenameJob: (id: string, newLabel: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDeadlineChange: (id: string, deadline: string | null) => void;
}

function TableRow({
  job, staggerIndex, profileUpdatedAt,
  onSelectJob, onRemoveJob, onRenameJob,
  onStatusChange, onNotesChange, onDeadlineChange,
}: TableRowProps) {
  const [expanded, setExpanded] = useState<"none" | "notes" | "jd" | "deadline">("none");
  const [notesValue, setNotesValue] = useState(job.notes);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
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

  function toggleExpanded(panel: "notes" | "jd" | "deadline") {
    setExpanded(prev => prev === panel ? "none" : panel);
  }

  const recStyle = RECOMMENDATION_STYLES[job.jobFitResult.recommendation] ??
    { color: "rgba(28,35,51,0.45)", dotColor: "rgba(28,35,51,0.28)", bg: "rgba(28,35,51,0.04)", border: "1px solid rgba(28,35,51,0.10)" };
  const isScoreStale = !!profileUpdatedAt && new Date(job.scoredAt) < profileUpdatedAt;
  const showNotes = expanded === "notes";
  const showJD = expanded === "jd";
  const showDeadlineInput = expanded === "deadline";

  return (
    <div
      className="card-entrance"
      style={{ animationDelay: `${Math.min(staggerIndex, 5) * 50}ms` }}
    >
      {/* ── Main table row ── */}
      <div
        className="group grid items-start border-b border-[rgba(28,35,51,0.08)]"
        style={{
          gridTemplateColumns: "1fr 80px 160px 160px 180px",
          gap: "0 16px",
          padding: "20px 0",
        }}
      >
        {/* ROLE */}
        <div style={{ paddingRight: 32 }}>
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
              className="font-sans text-[17px] font-medium text-[#1C2333] bg-transparent border-b border-[rgba(28,35,51,0.20)] outline-none w-full leading-snug focus:ring-0"
              style={{ letterSpacing: "-0.012em" }}
            />
          ) : (
            <button
              onClick={() => onSelectJob(job, "job-fit")}
              className="font-sans font-medium text-[#1C2333] hover:text-[rgba(28,35,51,0.65)] transition-colors leading-snug text-left"
              style={{ fontSize: 17, letterSpacing: "-0.012em", whiteSpace: "normal", wordBreak: "break-word", maxWidth: 360, display: "block" }}
            >
              {job.label}
            </button>
          )}
          {/* Meta row */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <button
              onClick={() => toggleExpanded("jd")}
              style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13, color: showJD ? "var(--fg)" : "var(--fg-3)" }}
              className="hover:underline hover:text-[var(--fg)] transition-colors"
            >
              {showJD ? "Hide JD" : "View JD"}
            </button>
            <span style={{ color: "var(--fg-4)", fontSize: 10 }}>·</span>
            {confirmingRemove ? (
              <>
                <span style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13, color: "var(--fg-3)" }}>Remove?</span>
                <button
                  onClick={() => onRemoveJob(job.id)}
                  style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13, color: "#8A7373" }}
                  className="hover:underline transition-colors"
                >
                  Yes
                </button>
                <span style={{ color: "var(--fg-4)", fontSize: 10 }}>·</span>
                <button
                  onClick={() => setConfirmingRemove(false)}
                  style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13, color: "var(--fg-3)" }}
                  className="hover:underline transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditingLabel(true)}
                  style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13, color: "var(--fg-3)" }}
                  className="hover:underline hover:text-[var(--fg)] transition-colors"
                >
                  Rename
                </button>
                <span style={{ color: "var(--fg-4)", fontSize: 10 }}>·</span>
                <button
                  onClick={() => setConfirmingRemove(true)}
                  style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13, color: "var(--fg-3)" }}
                  className="hover:underline transition-colors"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* FIT */}
        <div className="flex items-baseline gap-0.5 pt-0.5">
          <span
            className="font-sans font-medium tabular-nums text-[#1C2333]"
            style={{ fontSize: 28, lineHeight: 1, letterSpacing: "-0.03em" }}
          >
            {job.jobFitResult.overall_fit}
          </span>
          <span
            style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13, color: "rgba(28,35,51,0.45)", lineHeight: 1 }}
          >
            /10
          </span>
        </div>

        {/* RECOMMENDATION */}
        <div className="pt-0.5">
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              height: 24,
              padding: "0 10px",
              borderRadius: 9999,
              background: recStyle.bg,
              border: recStyle.border,
              fontFamily: "var(--font-geist-sans)",
              fontSize: 11.5,
              fontWeight: 500,
              color: recStyle.color,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: recStyle.dotColor, flexShrink: 0, display: "inline-block" }} />
            {job.jobFitResult.recommendation === "Stretch — Proceed Carefully" ? "Stretch" : job.jobFitResult.recommendation}
          </span>
          {isScoreStale && (
            <p style={{ fontFamily: "var(--font-geist-sans)", fontSize: 11, color: "#9B8E73", marginTop: 4 }}>
              Profile updated
            </p>
          )}
        </div>

        {/* STAGE */}
        <div className="pt-0.5">
          <div className="relative inline-flex items-center">
            <select
              value={job.applicationStatus}
              onChange={(e) => onStatusChange(job.id, e.target.value as ApplicationStatus)}
              className="appearance-none cursor-pointer outline-none focus:ring-0 pr-6 pl-3"
              style={{
                height: 36,
                borderRadius: 7,
                border: "none",
                fontFamily: "var(--font-geist-sans)",
                fontSize: 14,
                fontWeight: 400,
                color: "#1C2333",
                background: "#F4F4F5",
                transition: "border-color 150ms",
              }}
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <svg
              className="absolute right-2 w-2.5 h-2.5 pointer-events-none text-[rgba(28,35,51,0.45)]"
              viewBox="0 0 10 6" fill="none" aria-hidden="true"
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11,
            color: "rgba(28,35,51,0.45)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginTop: 5,
          }}>
            {formatDateRelative(job.scoredAt)}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-2 pt-0.5">
          {isScoreStale ? (
            <button
              onClick={() => onSelectJob(job, "job-fit")}
              className="font-sans text-[13px] text-[#9B8E73] hover:text-[#1C2333] transition-colors whitespace-nowrap"
            >
              Re-score →
            </button>
          ) : (
            <>
              <button
                onClick={() => onSelectJob(job, "job-fit")}
                className="hover:opacity-90 transition-opacity whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#ffffff",
                  background: "#1C2333",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  height: 36,
                  padding: "0 14px",
                }}
              >
                View Fit
              </button>
              <button
                onClick={() => onSelectJob(job, "tailoring-brief")}
                className="hover:bg-[rgba(28,35,51,0.04)] transition-colors whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--fg)",
                  background: "white",
                  border: "1px solid var(--line-strong)",
                  borderRadius: 7,
                  cursor: "pointer",
                  height: 36,
                  padding: "0 14px",
                }}
              >
                Prep →
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Expandable JD ── */}
      {showJD && (
        <div style={{ padding: "12px 0 16px" }}>
          <div
            className="overflow-y-auto px-6 py-5 rounded-[8px]"
            style={{
              maxHeight: "400px",
              background: "#FAFAFA",
              border: "1px solid rgba(28,35,51,0.08)",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(28,35,51,0.12) transparent",
            }}
          >
            {(job.jobDescription ?? "").split(/\n\n+/).map((para, pi) => (
              <p key={pi} className="mb-3 last:mb-0 font-sans text-[13px] leading-[1.7] text-[rgba(28,35,51,0.65)]">
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

type SortBy = "date" | "score";
type StatusFilter = ApplicationStatus | "All";

export default function JobTracker({
  jobs, hasProfile, profileUpdatedAt,
  onSelectJob, onRemoveJob, onRenameJob, onStatusChange,
  onNotesChange, onDeadlineChange,
  onGoToProfile, onGoToJobFit, onScoreNewJob,
}: JobTrackerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortBy, setSortBy] = useState<SortBy>("date");

  /* ── Empty state ── */
  if (jobs.length === 0) {
    return (
      <div className="py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {[
            { step: "01", title: "Add your profile", body: "Upload your resume or paste the text. Your background is the foundation for all scoring and prep.", done: hasProfile },
            { step: "02", title: "Score a job", body: "Paste any job description. Get an honest fit score with clear reasoning in about 20 seconds.", done: false },
            { step: "03", title: "Build your prep", body: "Get a targeted prep guide covering what to emphasize, what to drop, and how to position yourself.", done: false },
          ].map(({ step, title, body, done }) => (
            <div
              key={step}
              className={`rounded-[10px] px-5 py-5 ${done ? "bg-[rgba(122,139,115,0.06)]" : "bg-[#F9F9FA]"}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`font-sans text-[11px] px-1.5 py-0.5 rounded-[5px] shrink-0 ${done ? "bg-[rgba(122,139,115,0.15)] text-[#7A8B73]" : "bg-[rgba(28,35,51,0.06)] text-[rgba(28,35,51,0.45)]"}`}>
                  {done ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="inline">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : step}
                </span>
                <p className={`font-sans text-[14px] font-medium ${done ? "text-[#7A8B73]" : "text-[#1C2333]"}`}>{title}</p>
              </div>
              <p className="font-sans text-[13px] text-[rgba(28,35,51,0.65)] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          {!hasProfile ? (
            <>
              <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)] mb-4">Start by uploading your resume. Everything else follows from there.</p>
              <button
                onClick={onGoToProfile}
                className="inline-flex items-center gap-1 px-5 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity"
                style={{ height: 40 }}
              >
                Add your profile
              </button>
            </>
          ) : (
            <>
              <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)] mb-4">Profile saved. Score your first job to get started.</p>
              <button
                onClick={onGoToJobFit}
                className="inline-flex items-center gap-1 px-5 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity"
                style={{ height: 40 }}
              >
                Score a job
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const filtered = jobs
    .filter((j) => statusFilter === "All" || j.applicationStatus === statusFilter)
    .filter((j) => !searchQuery.trim() || j.label.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "score") return b.jobFitResult.overall_fit - a.jobFitResult.overall_fit;
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(28,35,51,0.35)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search jobs..."
          className="w-full pl-9 pr-4 py-2 rounded-[8px] bg-[#FAFAFA] border border-[rgba(28,35,51,0.08)] font-sans text-[14px] text-[#1C2333] placeholder:text-[rgba(28,35,51,0.35)] focus:outline-none focus:ring-0 focus:border-[rgba(28,35,51,0.20)] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(28,35,51,0.35)] hover:text-[#1C2333] transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 10 10" stroke="currentColor">
              <path d="M1 1l8 8M9 1L1 9" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Filter pills + sort ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1" style={{ scrollbarWidth: "none" }}>
          {(["All", ...APPLICATION_STATUSES] as StatusFilter[]).map((s) => {
            const isActive = statusFilter === s;
            const count = s !== "All" ? jobs.filter((j) => j.applicationStatus === s).length : jobs.length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="shrink-0 font-sans font-medium text-[13px] transition-all whitespace-nowrap"
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 9999,
                  background: isActive ? "#1C2333" : "#F0F0F0",
                  color: isActive ? "#fff" : "rgba(28,35,51,0.65)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {s}
                {" "}
                <span style={{ opacity: isActive ? 0.65 : 0.45 }}>{count}</span>
              </button>
            );
          })}
        </div>
        {/* Sort toggle */}
        <div
          className="flex items-center shrink-0 self-start sm:self-auto"
          style={{
            background: "#fff",
            border: "1px solid rgba(28,35,51,0.08)",
            borderRadius: 8,
            padding: 4,
          }}
        >
          {(["date", "score"] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="font-sans text-[11px] transition-all"
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: sortBy === s ? "rgba(28,35,51,0.06)" : "transparent",
                color: sortBy === s ? "#1C2333" : "rgba(28,35,51,0.45)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {s === "date" ? "Date" : "Score"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filtered count ── */}
      {isFiltered && (
        <div className="flex items-center justify-between">
          <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)]">
            {filtered.length === 0
              ? "No jobs match your filters."
              : `${filtered.length} of ${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}
          </p>
          <button onClick={clearFilters} className="font-sans text-[12px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors">
            Clear filters
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {filtered.length > 0 ? (
        <div>
          {/* Table header */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "1fr 80px 160px 160px 180px",
              gap: "0 16px",
              paddingBottom: 12,
              borderBottom: "1px solid rgba(28,35,51,0.08)",
            }}
          >
            {["Role", "Fit", "Recommendation", "Stage", "Actions"].map((col) => (
              <p
                key={col}
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "rgba(28,35,51,0.45)",
                  textAlign: col === "Actions" ? "right" : "left",
                }}
              >
                {col}
              </p>
            ))}
          </div>

          {/* Rows */}
          <div>
            {filtered.map((job, i) => (
              <TableRow
                key={job.id}
                job={job}
                staggerIndex={i}
                profileUpdatedAt={profileUpdatedAt}
                onSelectJob={onSelectJob}
                onRemoveJob={onRemoveJob}
                onRenameJob={onRenameJob}
                onStatusChange={onStatusChange}
                onNotesChange={onNotesChange}
                onDeadlineChange={onDeadlineChange}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center bg-white border border-[rgba(28,35,51,0.08)] rounded-[10px]" style={{ boxShadow: "0 1px 2px rgba(15,25,35,0.04), 0 6px 24px rgba(15,25,35,0.05)" }}>
          <p className="font-sans text-[14px] text-[rgba(28,35,51,0.45)]">No jobs match your filters.</p>
          <button onClick={clearFilters} className="mt-2 font-sans text-[13px] text-[rgba(28,35,51,0.55)] hover:text-[#1C2333] transition-colors">
            Clear filters →
          </button>
        </div>
      )}

      {/* ── Score another job card ── */}
      {!isFiltered && filtered.length > 0 && (
        <button
          onClick={onScoreNewJob}
          className="w-full flex items-center justify-between text-left group transition-colors border-2 border-dashed border-[rgba(28,35,51,0.14)] hover:border-[rgba(28,35,51,0.28)] hover:bg-[rgba(28,35,51,0.02)]"
          style={{
            borderRadius: 14,
            padding: "24px 32px",
            cursor: "pointer",
            background: "transparent",
          }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-geist-sans)", fontSize: 15, fontWeight: 500, color: "#1C2333", marginBottom: 4 }}>
              + Score another job
            </p>
            <p style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14, fontWeight: 400, color: "rgba(28,35,51,0.65)" }}>
              Paste a JD or LinkedIn URL — get a 1–10 fit and a tailored brief in 30 seconds.
            </p>
          </div>
          <span
            className="font-sans font-medium text-white bg-[#1C2333] group-hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 flex items-center justify-center"
            style={{ height: 36, padding: "0 14px", borderRadius: 7, fontSize: 13 }}
          >
            Add a job →
          </span>
        </button>
      )}
    </div>

    </>
  );
}
