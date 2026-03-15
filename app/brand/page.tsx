import Link from "next/link";
import BrandGuidelines from "@/components/BrandGuidelines";
import SignalWordmark from "@/components/SignalWordmark";

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-brand-bg">

      {/* Header */}
      <header className="bg-brand-text">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-white tracking-tight">
              <SignalWordmark />
            </span>
            <p className="text-sm text-white/40 mt-0.5">Job search intelligence</p>
          </div>
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            ← Back to app
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-14">
        <BrandGuidelines />
      </main>

    </div>
  );
}
