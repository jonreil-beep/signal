"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function HowItWorksCTA() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setChecked(true);
    });
  }, []);

  async function handleSend() {
    if (!email.trim()) return;
    setSending(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (err) {
      setError(err.message);
      setSending(false);
    } else {
      setSent(true);
      setSending(false);
    }
  }

  // Don't flash anything until we know auth state
  if (!checked) return null;

  // Signed-in user — just go back to the app
  if (user) {
    return (
      <div className="flex flex-col items-start gap-3 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
        >
          Go to app →
        </Link>
        <p className="text-base text-brand-text/40">Signed in as {user.email}</p>
      </div>
    );
  }

  // Guest — sent confirmation
  if (sent) {
    return (
      <div className="flex flex-col gap-3 pb-4 max-w-md">
        <p className="text-base font-semibold text-brand-text">Check your inbox</p>
        <p className="text-base text-brand-text/50">
          We sent a sign-in link to <span className="font-medium text-brand-text">{email}</span>.
          Click it to get started — your progress will be saved automatically.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors w-fit"
        >
          Use a different email
        </button>
      </div>
    );
  }

  // Guest — sign-up form
  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col sm:flex-row gap-2 max-w-md">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 px-4 py-3 border border-brand-text/15 rounded-2xl sm:rounded-full text-base bg-white focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="px-6 py-3 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {sending ? "Sending…" : "Get started →"}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-center gap-4">
        <p className="text-sm text-brand-text/40">Free to use. No credit card required.</p>
        <Link href="/" className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors">
          Try without signing up
        </Link>
      </div>
    </div>
  );
}
