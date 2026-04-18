import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import { formatBrief } from "@/lib/formatBrief";
import type { JobFitResult, TailoringBriefResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────────────
    const { allowed } = await checkAndLogUsage(user.id, "/api/send-brief");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for email sends. Come back tomorrow." },
        { status: 429 }
      );
    }

    // ── Parse body ────────────────────────────────────────────────────
    const body = await request.json() as { jobId?: string };
    const { jobId } = body;

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json({ error: "jobId is required." }, { status: 400 });
    }

    // ── Fetch job — must belong to this user ──────────────────────────
    const { data: row, error: dbError } = await supabase
      .from("tracked_jobs")
      .select("id, label, job_fit_result, tailoring_result")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (dbError || !row) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 }
      );
    }

    // ── Assemble plain-text brief ─────────────────────────────────────
    const jobFitResult = row.job_fit_result as JobFitResult;
    const tailoringResult = row.tailoring_result as TailoringBriefResult | null;
    const plainText = formatBrief(row.label, jobFitResult, tailoringResult);

    const jobTitle = jobFitResult.job_title || row.label;

    // ── Send via Resend ───────────────────────────────────────────────
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM_ADDRESS ?? "briefs@signal.app";

    const { error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: user.email,
      subject: `Your Signal brief: ${jobTitle}`,
      text: plainText,
      html: `<pre style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;max-width:640px;color:#111">${plainText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`,
    });

    if (sendError) {
      console.error("[send-brief] Resend error:", sendError);
      return NextResponse.json(
        { error: "Failed to send email. Try copying the brief instead." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, email: user.email });

  } catch (err) {
    console.error("[send-brief] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try copying the brief instead." },
      { status: 500 }
    );
  }
}
