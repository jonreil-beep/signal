"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import LoadingState from "./LoadingState";

interface ProfileUploaderProps {
  onProfileConfirmed: (text: string) => void;
}

type InputMode = "upload" | "paste";

export default function ProfileUploader({ onProfileConfirmed }: ProfileUploaderProps) {
  const [mode, setMode] = useState<InputMode>("upload");
  const [extractedText, setExtractedText] = useState<string>("");
  const [pastedText, setPastedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeText = mode === "upload" ? extractedText : pastedText;

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      setError("Only PDF or DOCX files are supported.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("File is too large. Maximum size is 4MB.");
      return;
    }

    setError("");
    setExtractedText("");
    setFileName(file.name);
    setIsLoading(true);
    setConfirmed(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to parse file. Try pasting your resume text directly.");
        setFileName("");
      } else {
        setExtractedText(data.text);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
      setFileName("");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleReset() {
    setExtractedText("");
    setPastedText("");
    setFileName("");
    setError("");
    setConfirmed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleConfirm() {
    if (!activeText.trim()) return;
    onProfileConfirmed(activeText.trim());
    setConfirmed(true);
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-brand-text/6 rounded-xl p-1 w-fit">
        {(["upload", "paste"] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === m
                ? "bg-white text-brand-text shadow-sm"
                : "text-brand-text/40 hover:text-brand-text/70"
            }`}
          >
            {m === "upload" ? "Upload file" : "Paste text"}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      {mode === "upload" && (
        <div>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-brand-accent/50 bg-brand-accent/5"
                : "border-brand-text/15 hover:border-brand-text/25 hover:bg-brand-text/3"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-text/6 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-text/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text/70">
                  <span className="text-brand-accent">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-brand-text/40 mt-1">PDF or DOCX · max 4MB</p>
              </div>
            </div>
          </div>

          {isLoading && <LoadingState message="Extracting text from file…" />}

          {error && (
            <div className="mt-3 p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={handleReset} className="mt-1 text-xs text-red-500 underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          {fileName && !isLoading && !error && (
            <p className="mt-2.5 text-sm text-brand-text/50">
              <span className="font-medium text-brand-text/80">{fileName}</span> loaded
            </p>
          )}
        </div>
      )}

      {/* Paste mode */}
      {mode === "paste" && (
        <div>
          <textarea
            value={pastedText}
            onChange={(e) => { setPastedText(e.target.value); setConfirmed(false); }}
            placeholder="Paste the full text of your resume here…"
            rows={14}
            className="w-full border border-brand-text/12 rounded-2xl p-4 text-sm text-brand-text font-mono leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-transparent resize-y placeholder:text-brand-text/25 transition-shadow"
          />
        </div>
      )}

      {/* Extracted text preview */}
      {mode === "upload" && extractedText && !isLoading && (
        <div>
          <p className="text-xs font-medium text-brand-text/40 mb-2">Extracted text: confirm it looks right</p>
          <textarea
            readOnly
            value={extractedText}
            rows={14}
            className="w-full border border-brand-text/8 rounded-2xl p-4 text-sm text-brand-text/60 font-mono leading-relaxed bg-brand-text/3 resize-y"
          />
        </div>
      )}

      {/* Confirm button */}
      {activeText.trim() && !isLoading && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={confirmed}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              confirmed
                ? "bg-status-apply text-white cursor-default"
                : "bg-brand-accent text-white hover:bg-brand-accent/90"
            }`}
          >
            {confirmed ? "✓ Profile confirmed" : "Confirm Profile"}
          </button>

          {confirmed && (
            <p className="text-sm text-status-apply font-medium">Ready to score jobs.</p>
          )}

          {!confirmed && (
            <button onClick={handleReset} className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
