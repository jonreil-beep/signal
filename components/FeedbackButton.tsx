"use client";

// Set this to your Tally form URL — e.g. https://tally.so/r/YOUR_FORM_ID
const FEEDBACK_URL = "https://tally.so/r/REPLACE_WITH_YOUR_FORM_ID";

export default function FeedbackButton() {
  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-brand-text text-white text-xs font-medium rounded-full shadow-lg hover:bg-brand-text/80 transition-colors"
    >
      Share feedback
    </a>
  );
}
