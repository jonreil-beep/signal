"use client";

interface TypingIndicatorProps {
  message?: string;
}

/**
 * 3-dot bouncing typing animation — used wherever Claude is writing prose
 * (cover letter, outreach, interview prep, company research, resume bullets,
 *  follow-up templates). For "computing" tasks (scoring, profile analysis)
 * keep the spinner in LoadingState instead.
 */
export default function TypingIndicator({ message }: TypingIndicatorProps) {
  return (
    <div className="flex flex-col gap-2 py-4 px-1">
      {/* Three bouncing dots */}
      <div className="flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#9CA3AF",
              animation: "typingBounce 1.2s infinite",
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </div>
      {/* Label */}
      {message && (
        <p className="text-[13px] text-[#9CA3AF] italic leading-snug">{message}</p>
      )}
    </div>
  );
}
