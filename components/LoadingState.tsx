"use client";

import { useState, useEffect } from "react";

interface LoadingStateProps {
  message?: string;
  steps?: string[];
}

export default function LoadingState({ message = "Processing...", steps }: LoadingStateProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!steps || steps.length < 2) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStepIndex(i => (i + 1) % steps.length);
        setVisible(true);
      }, 350);
    }, 4200);
    return () => clearInterval(interval);
  }, [steps]);

  const displayText = steps ? steps[stepIndex] : message;

  return (
    <div className="flex items-center gap-3 py-4">
      <div className="relative h-4 w-4 shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-[rgba(28,35,51,0.12)]" />
        <div className="absolute inset-0 rounded-full border-2 border-[#1C2333] border-t-transparent animate-spin" />
      </div>
      <span
        className="font-sans text-sm text-[rgba(28,35,51,0.50)]"
        style={{
          transition: "opacity 0.35s ease",
          opacity: visible ? 1 : 0,
        }}
      >
        {displayText}
      </span>
    </div>
  );
}
