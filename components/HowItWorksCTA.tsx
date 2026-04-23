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

  if (!checked) return null;

  if (user) {
    return (
      <div className="flex flex-col items-start gap-3 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
        >
          Go to app →
        </Link>
        <p className="font-jetbrains-mono text-[11px] text-[#8A857F]">Signed in as {user.email}</p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-3 pb-4 max-w-md">
        <p className="font-sans text-[15px] font-medium text-[#231812]">Check your inbox</p>
        <p className="font-sans text-[14px] text-[#4A3C34] leading-relaxed">
          We sent a sign-in link to{" "}
          <span className="font-medium text-[#231812]">{email}</span>.
          Click it to get started — your progress will be saved automatically.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors w-fit"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col gap-2 max-w-md w-full">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="w-full px-4 py-3 border border-[rgba(26,26,26,0.18)] rounded-[2px] font-sans text-[14px] text-[#231812] bg-[#FDF7EA] placeholder:text-[#8A857F] focus:outline-none focus:ring-0 focus:border-[rgba(26,26,26,0.4)] transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="w-full px-4 py-2.5 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Sending…" : "Get started →"}
        </button>
      </div>
      {error && <p className="font-sans text-[13px] text-red-600">{error}</p>}
      <Link href="/?skip=1" className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors">
        Try without signing up
      </Link>
    </div>
  );
}
