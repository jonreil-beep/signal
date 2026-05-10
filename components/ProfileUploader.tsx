"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import LoadingState from "./LoadingState";

interface ProfileUploaderProps {
  onProfileConfirmed: (text: string, source: "paste" | "file", fileName?: string) => void;
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
    onProfileConfirmed(
      activeText.trim(),
      mode === "upload" ? "file" : "paste",
      mode === "upload" ? fileName : undefined
    );
    setConfirmed(true);
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-0 border-b border-[rgba(28,35,51,0.08)]">
        {(["upload", "paste"] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); }}
            className={`px-4 py-2.5 font-sans text-[13px] transition-all border-b-2 -mb-px ${
              mode === m
                ? "border-[#1C2333] text-[#1C2333]"
                : "border-transparent text-[rgba(28,35,51,0.45)] hover:text-[#1C2333]"
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
            className={`border-2 border-dashed p-12 text-center cursor-pointer transition-all rounded-[10px] ${
              isDragging
                ? "border-[rgba(28,35,51,0.40)] bg-[rgba(28,35,51,0.03)]"
                : "border-[rgba(28,35,51,0.12)] hover:border-[rgba(28,35,51,0.25)] hover:bg-[rgba(28,35,51,0.02)]"
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
              <div className="w-10 h-10 bg-[rgba(28,35,51,0.04)] border border-[rgba(28,35,51,0.08)] rounded-[8px] flex items-center justify-center">
                <svg className="w-5 h-5 text-[rgba(28,35,51,0.45)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-sans text-[14px] font-medium text-[#1C2333]">
                  Click to upload or drag and drop
                </p>
                <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)] mt-1">PDF or DOCX · max 4MB</p>
              </div>
            </div>
          </div>

          {isLoading && <LoadingState message="Extracting text from file…" />}

          {error && (
            <div className="mt-3 p-4 border-l-2 border-[#8A7373]">
              <p className="font-sans text-[14px] text-[#1C2333]">{error}</p>
              <button onClick={handleReset} className="mt-1 font-sans text-[13px] text-[#8A7373] hover:text-[#1C2333] transition-colors">
                Try again
              </button>
            </div>
          )}

          {fileName && !isLoading && !error && (
            <p className="mt-2.5 font-sans text-[13px] text-[rgba(28,35,51,0.55)]">
              <span className="font-medium text-[#1C2333]">{fileName}</span> loaded
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
            className="w-full border border-[rgba(28,35,51,0.08)] rounded-[10px] p-4 font-mono text-[14px] text-[#1C2333] leading-relaxed bg-[#FAFAFA] focus:outline-none focus:ring-0 focus:border-[rgba(28,35,51,0.20)] resize-y placeholder:text-[rgba(28,35,51,0.35)] transition-colors"
          />
        </div>
      )}

      {/* Extracted text preview */}
      {mode === "upload" && extractedText && !isLoading && (
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.06em] text-[rgba(28,35,51,0.45)] mb-2">Extracted text — confirm it looks right</p>
          <textarea
            readOnly
            value={extractedText}
            rows={14}
            className="w-full border border-[rgba(28,35,51,0.08)] rounded-[10px] p-4 font-mono text-[14px] text-[rgba(28,35,51,0.65)] leading-relaxed bg-[#FAFAFA] resize-y"
          />
        </div>
      )}

      {/* Confirm button */}
      {activeText.trim() && !isLoading && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={confirmed}
            className={`px-5 font-sans font-medium text-[13px] rounded-[8px] transition-all ${
              confirmed
                ? "bg-[rgba(122,139,115,0.12)] text-[#7A8B73] cursor-default"
                : "text-white bg-[#1C2333] hover:opacity-90"
            }`}
            style={{ height: 40 }}
          >
            {confirmed ? "✓ Profile confirmed" : "Confirm Profile"}
          </button>

          {confirmed && (
            <p className="font-sans text-[14px] text-[#7A8B73] font-medium">Ready to score jobs.</p>
          )}

          {!confirmed && (
            <button onClick={handleReset} className="font-sans text-[14px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
