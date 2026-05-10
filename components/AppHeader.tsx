import Link from "next/link";
import SignalWordmark from "./SignalWordmark";

interface AppHeaderProps {
  logoSlot: React.ReactNode;
  rightSlot?: React.ReactNode;
  compact?: boolean;
  light?: boolean;
}

export default function AppHeader({ logoSlot, rightSlot, compact, light }: AppHeaderProps) {
  return (
    <header className={light ? "bg-white border-b border-[rgba(28,35,51,0.08)]" : "bg-white border-b border-[rgba(28,35,51,0.08)]"}>
      <div className={`max-w-4xl mx-auto px-6 flex items-center justify-between ${compact ? "py-[14px]" : "py-5"}`}>
        {logoSlot}
        {rightSlot}
      </div>
    </header>
  );
}

export function LogoLink({ light }: { light?: boolean }) {
  return (
    <Link href="/" className="block group">
      <p className="font-sans font-semibold text-[18px] text-[#1C2333] leading-none tracking-[-0.025em] group-hover:opacity-70 transition-opacity">
        <SignalWordmark />
      </p>
    </Link>
  );
}

export function LogoStatic({ light }: { light?: boolean }) {
  return (
    <div>
      <p className="font-sans font-semibold text-[18px] text-[#1C2333] leading-none tracking-[-0.025em]">
        <SignalWordmark />
      </p>
    </div>
  );
}

export function BackToAppLink({ light }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="font-sans text-[13px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors"
    >
      ← Back to app
    </Link>
  );
}
