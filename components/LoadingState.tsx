"use client";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Processing..." }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="relative h-4 w-4">
        <div className="absolute inset-0 rounded-full border-2 border-brand-text/10" />
        <div className="absolute inset-0 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
      </div>
      <span className="text-sm text-brand-text/50">{message}</span>
    </div>
  );
}
