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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["upload", "paste"] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === m
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
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
                ? "border-slate-400 bg-slate-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
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
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  <span className="text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF or DOCX · max 4MB</p>
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
            <p className="mt-2.5 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{fileName}</span> loaded
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
            className="w-full border border-gray-200 rounded-2xl p-4 text-sm text-gray-900 font-mono leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent resize-y placeholder:text-gray-300 transition-shadow"
          />
        </div>
      )}

      {/* Extracted text preview */}
      {mode === "upload" && extractedText && !isLoading && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Extracted text — confirm it looks right</p>
          <textarea
            readOnly
            value={extractedText}
            rows={14}
            className="w-full border border-gray-100 rounded-2xl p-4 text-sm text-gray-600 font-mono leading-relaxed bg-gray-50 resize-y"
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
                ? "bg-green-600 text-white cursor-default"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {confirmed ? "✓ Profile confirmed" : "Confirm Profile"}
          </button>

          {confirmed && (
            <p className="text-sm text-green-700 font-medium">Ready to score jobs.</p>
          )}

          {!confirmed && (
            <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
