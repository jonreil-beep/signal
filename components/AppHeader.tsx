import Link from "next/link";
import SignalWordmark from "./SignalWordmark";

/**
 * Shared header shell — bg, padding, max-width, and layout are defined here.
 * Change once and it applies to every page in the app.
 *
 * logoSlot  — left side (logo + tagline). Use LogoLink, LogoStatic, or a custom element.
 * rightSlot — right side (nav, auth controls, back link, etc.).
 */
interface AppHeaderProps {
  logoSlot: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export default function AppHeader({ logoSlot, rightSlot }: AppHeaderProps) {
  return (
    <header className="bg-brand-text">
      <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
        {logoSlot}
        {rightSlot}
      </div>
    </header>
  );
}

/**
 * Logo + tagline block where the wordmark links to "/" (e.g. /how-it-works).
 * Clicking anywhere in the block navigates home.
 */
export function LogoLink() {
  return (
    <Link href="/" className="block group">
      <p className="text-xl font-bold text-white tracking-tight group-hover:text-white/80 transition-colors">
        <SignalWordmark />
      </p>
      <p className="text-sm text-white/40 mt-0.5">Smarter search for experienced professionals</p>
    </Link>
  );
}

/**
 * Non-clickable logo + tagline block (e.g. /brand — stays on same page).
 */
export function LogoStatic() {
  return (
    <div>
      <p className="text-xl font-bold text-white tracking-tight">
        <SignalWordmark />
      </p>
      <p className="text-sm text-white/40 mt-0.5">Smarter search for experienced professionals</p>
    </div>
  );
}

/**
 * Standard "← Back to app" link used on all secondary pages.
 */
export function BackToAppLink() {
  return (
    <Link href="/" className="text-sm text-white/50 hover:text-white/80 transition-colors">
      ← Back to app
    </Link>
  );
}
