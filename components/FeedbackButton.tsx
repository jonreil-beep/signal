"use client";

// Set this to your Tally form URL — e.g. https://tally.so/r/YOUR_FORM_ID
const FEEDBACK_URL = "https://tally.so/r/Bz1MyQ";

export default function FeedbackButton() {
  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 px-3 py-1.5 font-sans text-xs font-medium text-[rgba(28,35,51,0.40)] hover:text-[rgba(28,35,51,0.75)] border border-[rgba(28,35,51,0.12)] hover:border-[rgba(28,35,51,0.25)] rounded-full transition-all bg-white/70 backdrop-blur-sm"
    >
      Share feedback
    </a>
  );
}
