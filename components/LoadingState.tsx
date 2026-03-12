"use client";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Processing..." }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="relative h-4 w-4">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-t-transparent animate-spin" />
      </div>
      <span className="text-sm text-gray-500">{message}</span>
    </div>
  );
}
