import Link from "next/link";
import SignalWordmark from "./SignalWordmark";

/**
 * Shared header shell — bg, padding, max-width, and layout are defined here.
 *
 * logoSlot  — left side (logo + tagline). Use LogoLink, LogoStatic, or a custom element.
 * rightSlot — right side (nav, auth controls, back link, etc.).
 * light     — use white/light-bordered header instead of the dark default.
 */
interface AppHeaderProps {
  logoSlot: React.ReactNode;
  rightSlot?: React.ReactNode;
  compact?: boolean;
  light?: boolean;
}

export default function AppHeader({ logoSlot, rightSlot, compact, light }: AppHeaderProps) {
  return (
    <header
      className={light
        ? "bg-white border-b border-[#E5E7EB]"
        : "bg-brand-text"}
    >
      <div className={`max-w-4xl mx-auto px-6 flex items-center justify-between ${compact ? "py-[14px]" : "py-5"}`}>
        {logoSlot}
        {rightSlot}
      </div>
    </header>
  );
}

/** Logo block (links to "/") — light or dark variant inferred from prop. */
export function LogoLink({ light }: { light?: boolean }) {
  return (
    <Link href="/" className="block group">
      <p className={`text-[18px] font-[700] tracking-[0.14em] transition-colors ${
        light
          ? "text-[#111827] group-hover:text-[#374151]"
          : "text-white group-hover:text-white/80"
      }`}>
        <SignalWordmark />
      </p>
      <p className={`text-[13px] mt-0.5 ${light ? "text-[#9CA3AF]" : "text-white/40"}`}>
        Smarter search for experienced professionals
      </p>
    </Link>
  );
}

/** Non-clickable logo block (e.g. /brand). */
export function LogoStatic({ light }: { light?: boolean }) {
  return (
    <div>
      <p className={`text-[18px] font-[700] tracking-[0.14em] ${light ? "text-[#111827]" : "text-white"}`}>
        <SignalWordmark />
      </p>
      <p className={`text-[13px] mt-0.5 ${light ? "text-[#9CA3AF]" : "text-white/40"}`}>
        Smarter search for experienced professionals
      </p>
    </div>
  );
}

/** "← Back to app" link — light or dark variant. */
export function BackToAppLink({ light }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`text-[13px] font-[400] transition-colors ${
        light
          ? "text-[#9CA3AF] hover:text-[#6B7280]"
          : "text-white/50 hover:text-white/80"
      }`}
    >
      ← Back to app
    </Link>
  );
}
