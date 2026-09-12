import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildOutreachPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import { sanitizeAI } from "@/lib/sanitizeAIText";
import type { OutreachResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { allowed } = await checkAndLogUsage(user.id, "/api/generate-outreach");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for outreach messages. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { outreachAngle, resumeText, jobDescription, userNote, writingSample, pivotTarget } = body as {
      outreachAngle?: string;
      resumeText?: string;
      jobDescription?: string;
      userNote?: string;
      writingSample?: string;
      pivotTarget?: string;
    };

    if (!outreachAngle || typeof outreachAngle !== "string" || outreachAngle.trim().length < 10) {
      return NextResponse.json({ error: "Outreach angle is missing or too short." }, { status: 400 });
    }
    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }
    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    const prompt = buildOutreachPrompt(
      outreachAngle.trim(),
      resumeText.trim(),
      jobDescription.trim(),
      userNote?.trim(),
      writingSample?.trim(),
      pivotTarget?.trim()
    );

    const toolSchema = {
      type: "object" as const,
      properties: {
        email: { type: "string" },
        linkedin_message: { type: "string" },
      },
      required: ["email", "linkedin_message"],
    };

    let result: OutreachResult | null = null;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const raw = await callClaudeWithTool<OutreachResult>(prompt, "submit_outreach", toolSchema, 2048);

      // Guard against Claude putting the full JSON blob into the email field
      // (happens when prompt instructions conflict with tool forcing)
      let candidate = raw;
      if (typeof raw.email === "string" && raw.email.trimStart().startsWith("{")) {
        try {
          const parsed = JSON.parse(raw.email) as OutreachResult;
          if (typeof parsed.email === "string" && typeof parsed.linkedin_message === "string") {
            candidate = parsed;
          }
        } catch { /* not JSON — leave as-is */ }
      }

      if (typeof candidate.email !== "string" || typeof candidate.linkedin_message !== "string") {
        console.error(`[generate-outreach] Attempt ${attempt}: missing required fields`, JSON.stringify(raw));
        if (attempt === maxAttempts) {
          return NextResponse.json({ error: "Outreach generation failed after multiple attempts. Try again." }, { status: 500 });
        }
        continue;
      }

      result = candidate;
      break;
    }

    if (!result) {
      return NextResponse.json({ error: "Outreach generation failed. Try again." }, { status: 500 });
    }

    return NextResponse.json(sanitizeAI(result));
  } catch (err) {
    console.error("[generate-outreach] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
