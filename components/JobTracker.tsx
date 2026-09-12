"use client";

import { useState, useRef, useEffect } from "react";
import type { TrackedJob } from "@/types";

interface JobTrackerProps {
  jobs: TrackedJob[];
  hasProfile: boolean;
  profileUpdatedAt?: Date | null;
  onSelectJob: (job: TrackedJob, goTo: "job-fit") => void;
  onRemoveJob: (id: string) => void;
  onRenameJob: (id: string, newLabel: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDeadlineChange: (id: string, deadline: string | null) => void;
  onGoToProfile: () => void;
  onGoToJobFit: () => void;
  onScoreNewJob: () => void;
  onOpenBrief: (jobId: string) => void;
  generatingBriefIds?: Set<string>;
}


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
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
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
  onSelectJob: (job: TrackedJob, goTo: "job-fit") => void;
  onRemoveJob: (id: string) => void;
  onRenameJob: (id: string, newLabel: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDeadlineChange: (id: string, deadline: string | null) => void;
  onOpenBrief: (jobId: string) => void;
  generatingBrief?: boolean;
}

function TableRow({
  job, staggerIndex, profileUpdatedAt,
  onSelectJob, onRemoveJob, onRenameJob,
  onNotesChange, onDeadlineChange, onOpenBrief, generatingBrief,
}: TableRowProps) {
  const [expanded, setExpanded] = useState<"none" | "notes" | "jd" | "deadline">("none");
  const [notesValue, setNotesValue] = useState(job.notes);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(job.label);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (removeTimerRef.current) clearTimeout(removeTimerRef.current); }, []);

  function handleConfirmRemove() {
    setConfirmingRemove(false);
    setRemoving(true);
    removeTimerRef.current = setTimeout(() => onRemoveJob(job.id), 320);
  }

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
      style={{
        animationDelay: `${Math.min(staggerIndex, 5) * 50}ms`,
        overflow: "hidden",
        maxHeight: removing ? 0 : 800,
        opacity: removing ? 0 : 1,
        transform: removing ? "translateY(-6px)" : "translateY(0)",
        transition: removing
          ? "max-height 300ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease, transform 220ms ease"
          : "none",
      }}
    >
      {/* ── Main table row ── */}
      <div
        className="group grid items-start border-b border-[rgba(28,35,51,0.08)]"
        style={{
          gridTemplateColumns: "1fr 80px 160px 180px",
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
          <p style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12, color: "rgba(28,35,51,0.35)", marginTop: 3 }}>
            {formatDateRelative(job.scoredAt)}
          </p>
          {/* Hover-only actions */}
          <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  onClick={handleConfirmRemove}
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
              fontSize: 12,
              fontWeight: 500,
              color: recStyle.color,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: recStyle.dotColor, flexShrink: 0, display: "inline-block" }} />
            {job.jobFitResult.recommendation === "Stretch — Proceed Carefully" ? "Stretch" : job.jobFitResult.recommendation}
          </span>
          {isScoreStale && (
            <p style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12, color: "#9B8E73", marginTop: 4 }}>
              Profile updated
            </p>
          )}
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
              {generatingBrief ? (
                <span style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12, color: "rgba(28,35,51,0.45)", whiteSpace: "nowrap" }}>
                  Building brief…
                </span>
              ) : job.tailoringResult ? (
                <button
                  onClick={() => onOpenBrief(job.id)}
                  className="hover:opacity-80 transition-opacity whitespace-nowrap glass-card"
                  style={{
                    fontFamily: "var(--font-geist-sans)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--fg)",
                    borderRadius: 7,
                    cursor: "pointer",
                    height: 36,
                    padding: "0 14px",
                    boxShadow: "0 1px 3px rgba(15,25,35,0.07), 0 6px 20px rgba(15,25,35,0.10)",
                  }}
                >
                  See brief
                </button>
              ) : null}
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

export default function JobTracker({
  jobs, hasProfile, profileUpdatedAt,
  onSelectJob, onRemoveJob, onRenameJob,
  onNotesChange, onDeadlineChange,
  onGoToProfile, onGoToJobFit, onScoreNewJob, onOpenBrief, generatingBriefIds,
}: JobTrackerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");

  /* ── Empty state ── */
  if (jobs.length === 0) {
    return (
      <div className="py-2">
        <div className="grid grid-cols-1 md:grid-cols-3">

          {/* Step 01 — Add profile */}
          <div className="md:border-r border-[rgba(28,35,51,0.08)] md:pr-10 pb-10 md:pb-0">
            <div className="flex items-end gap-3 mb-5">
              <span
                className="font-sans font-bold leading-none"
                style={{ fontSize: 80, letterSpacing: "-0.04em", color: hasProfile ? "#7A8B73" : "#1C2333" }}
              >
                01
              </span>
              {hasProfile && (
                <span
                  className="font-sans mb-2.5"
                  style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", color: "#7A8B73", border: "1.5px solid rgba(122,139,115,0.45)", borderRadius: 100, padding: "3px 9px" }}
                >
                  SAVED
                </span>
              )}
            </div>
            <p className="font-sans font-semibold text-[18px] text-[#1C2333] mb-2" style={{ letterSpacing: "-0.01em" }}>
              Add your profile
            </p>
            <p className="font-sans text-[14px] leading-relaxed text-[rgba(28,35,51,0.55)] mb-5">
              Upload your resume or paste the text. Your background is the foundation for all scoring and prep.
            </p>
            {!hasProfile && (
              <button
                onClick={onGoToProfile}
                className="font-sans font-semibold text-[14px] text-[#1C2333] hover:opacity-70 transition-opacity"
                style={{ background: "none", border: "none", borderBottom: "2px solid #1C2333", paddingBottom: 1, cursor: "pointer" }}
              >
                Add your profile →
              </button>
            )}
          </div>

          {/* Step 02 — Score a job */}
          <div className="md:border-r border-[rgba(28,35,51,0.08)] md:px-10 py-10 md:py-0">
            <div className="flex items-end gap-3 mb-5">
              <span
                className="font-sans font-bold leading-none"
                style={{ fontSize: 80, letterSpacing: "-0.04em", color: hasProfile ? "#1C2333" : "rgba(28,35,51,0.18)" }}
              >
                02
              </span>
              {hasProfile && (
                <span
                  className="font-sans mb-2.5"
                  style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", color: "#fff", background: "#1C2333", borderRadius: 100, padding: "4px 10px" }}
                >
                  NOW
                </span>
              )}
            </div>
            <p
              className="font-sans font-semibold text-[18px] mb-2"
              style={{ letterSpacing: "-0.01em", color: hasProfile ? "#1C2333" : "rgba(28,35,51,0.30)" }}
            >
              Score a job
            </p>
            <p
              className="font-sans text-[14px] leading-relaxed mb-5"
              style={{ color: hasProfile ? "rgba(28,35,51,0.55)" : "rgba(28,35,51,0.28)" }}
            >
              Paste any job description. Get a 1–10 fit score with clear reasoning in about 20 seconds.
            </p>
            {hasProfile && (
              <button
                onClick={onGoToJobFit}
                className="font-sans font-semibold text-[14px] text-[#1C2333] hover:opacity-70 transition-opacity"
                style={{ background: "none", border: "none", borderBottom: "2px solid #1C2333", paddingBottom: 1, cursor: "pointer" }}
              >
                Paste a description
              </button>
            )}
          </div>

          {/* Step 03 — Build prep */}
          <div className="md:pl-10 pt-10 md:pt-0">
            <div className="mb-5">
              <span
                className="font-sans font-bold leading-none"
                style={{ fontSize: 80, letterSpacing: "-0.04em", color: "rgba(28,35,51,0.14)" }}
              >
                03
              </span>
            </div>
            <p className="font-sans font-semibold text-[18px] mb-2" style={{ letterSpacing: "-0.01em", color: "rgba(28,35,51,0.30)" }}>
              Build your prep
            </p>
            <p className="font-sans text-[14px] leading-relaxed" style={{ color: "rgba(28,35,51,0.28)" }}>
              Get a targeted prep guide covering what to emphasize, what to drop, and how to position yourself.
            </p>
          </div>

        </div>
      </div>
    );
  }

  const filtered = jobs
    .filter((j) => !searchQuery.trim() || j.label.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "score") return b.jobFitResult.overall_fit - a.jobFitResult.overall_fit;
      return new Date(b.scoredAt).getTime() - new Date(a.scoredAt).getTime();
    });

  const isFiltered = searchQuery.trim() !== "";

  function clearFilters() {
    setSearchQuery("");
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
          className="w-full pl-9 pr-4 py-2 rounded-[8px] border font-sans text-[14px] text-[#1C2333] placeholder:text-[rgba(28,35,51,0.35)] focus:outline-none focus:ring-0 transition-colors"
          style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderColor: "rgba(255,255,255,0.55)" }}
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

      {/* ── Sort toggle ── */}
      <div className="flex justify-end">
        {/* Sort toggle */}
        <div
          className="flex items-center shrink-0 self-start sm:self-auto"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.55)",
            borderRadius: 8,
            padding: 4,
          }}
        >
          {(["date", "score"] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="font-sans text-[12px] transition-all"
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
              gridTemplateColumns: "1fr 80px 160px 180px",
              gap: "0 16px",
              paddingBottom: 12,
              borderBottom: "1px solid rgba(28,35,51,0.08)",
            }}
          >
            {["Role", "Fit", "Recommendation", ""].map((col) => (
              <p
                key={col}
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  color: "rgba(28,35,51,0.45)",
                  textAlign: "left",
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
                onNotesChange={onNotesChange}
                onDeadlineChange={onDeadlineChange}
                onOpenBrief={onOpenBrief}
                generatingBrief={generatingBriefIds?.has(job.id)}
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
              Paste a JD or LinkedIn URL to get a 1–10 fit and a tailored brief in about 20 seconds.
            </p>
          </div>
          <span
            className="font-sans font-medium text-white bg-[#1C2333] group-hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 flex items-center justify-center btn-shadow-dark"
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
