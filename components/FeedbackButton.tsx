"use client";

// Set this to your Tally form URL — e.g. https://tally.so/r/YOUR_FORM_ID
const FEEDBACK_URL = "https://tally.so/r/Bz1MyQ";

export default function FeedbackButton() {
  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 px-3 py-1.5 text-xs font-medium text-brand-text/40 hover:text-brand-text/75 border border-brand-text/12 hover:border-brand-text/25 rounded-full transition-all bg-white/70 backdrop-blur-sm"
    >
      Share feedback
    </a>
  );
}
