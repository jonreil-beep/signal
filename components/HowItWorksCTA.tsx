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

  // Signed-in user
  if (user) {
    return (
      <div className="flex flex-col items-start gap-3 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] text-white text-[14px] font-[500] rounded-full hover:from-[#1E40AF] hover:to-[#3730A3] transition-colors"
        >
          Go to app →
        </Link>
        <p className="text-[13px] text-[#9CA3AF]">Signed in as {user.email}</p>
      </div>
    );
  }

  // Sent confirmation
  if (sent) {
    return (
      <div className="flex flex-col gap-3 pb-4 max-w-md">
        <p className="text-[15px] font-[500] text-[#111827]">Check your inbox</p>
        <p className="text-[14px] text-[#6B7280] leading-relaxed">
          We sent a sign-in link to{" "}
          <span className="font-[500] text-[#111827]">{email}</span>.
          Click it to get started — your progress will be saved automatically.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors w-fit"
        >
          Use a different email
        </button>
      </div>
    );
  }

  // Sign-up form — stacked vertical pills, full-width
  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col gap-2 max-w-md w-full">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="w-full px-5 py-3.5 border border-[#D1D5DB] rounded-full text-[14px] text-[#111827] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#6B7280] transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="w-full px-6 py-3 bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] text-white text-[14px] font-[500] rounded-full hover:from-[#1E40AF] hover:to-[#3730A3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {sending ? "Sending…" : "Get started →"}
        </button>
      </div>
      {error && <p className="text-[13px] text-red-500">{error}</p>}
      <Link href="/?skip=1" className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
        Try without signing up
      </Link>
    </div>
  );
}
