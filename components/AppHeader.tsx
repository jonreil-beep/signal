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
    <header className={light ? "bg-[#FDF7EA] border-b border-[rgba(26,26,26,0.10)]" : "bg-[#F6F0E4]"}>
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
      <p className="font-instrument-serif italic text-[28px] font-normal text-[#231812] leading-none group-hover:text-[#4A3C34] transition-colors">
        <SignalWordmark />
      </p>
    </Link>
  );
}

export function LogoStatic({ light }: { light?: boolean }) {
  return (
    <div>
      <p className="font-instrument-serif italic text-[28px] font-normal text-[#231812] leading-none">
        <SignalWordmark />
      </p>
    </div>
  );
}

export function BackToAppLink({ light }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] text-[#8A857F] hover:text-[#231812] transition-colors"
    >
      ← Back to app
    </Link>
  );
}
