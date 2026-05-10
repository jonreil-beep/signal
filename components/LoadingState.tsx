"use client";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Processing..." }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="relative h-4 w-4">
        <div className="absolute inset-0 rounded-full border-2 border-[rgba(28,35,51,0.12)]" />
        <div className="absolute inset-0 rounded-full border-2 border-[#1C2333] border-t-transparent animate-spin" />
      </div>
      <span className="font-sans text-sm text-[rgba(28,35,51,0.50)]">{message}</span>
    </div>
  );
}
