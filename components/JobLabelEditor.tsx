"use client";

import { useState, useRef, useEffect } from "react";

interface JobLabelEditorProps {
  id: string;
  label: string;
  onRename: (id: string, newLabel: string) => void;
  /** Tailwind text classes applied to the label and input, e.g. "text-sm font-semibold" */
  className?: string;
}

export default function JobLabelEditor({
  id,
  label,
  onRename,
  className = "text-sm font-semibold",
}: JobLabelEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local value in sync if the label changes externally
  useEffect(() => {
    if (!editing) setValue(label);
  }, [label, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== label) {
      onRename(id, trimmed);
    } else {
      setValue(label);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") { setValue(label); setEditing(false); }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`${className} text-brand-text bg-transparent border-b-2 border-brand-accent outline-none w-full leading-snug`}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-2 text-left min-w-0"
      title="Click to rename"
    >
      <span className={`${className} text-brand-text leading-snug truncate`}>{label}</span>
      <svg
        className="shrink-0 text-transparent group-hover:text-brand-text/50 transition-colors"
        style={{ width: "0.875em", height: "0.875em" }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
        />
      </svg>
    </button>
  );
}
