import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildFollowUpPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import { sanitizeAI } from "@/lib/sanitizeAIText";
import type { FollowUpResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { allowed } = await checkAndLogUsage(user.id, "/api/follow-up");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for follow-up templates. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText, jobDescription, writingSample, pivotTarget } = body as {
      resumeText?: string;
      jobDescription?: string;
      writingSample?: string;
      pivotTarget?: string;
    };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is missing or too short." }, { status: 400 });
    }
    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json({ error: "Job description is missing or too short." }, { status: 400 });
    }

    const prompt = buildFollowUpPrompt(
      resumeText.trim(),
      jobDescription.trim(),
      writingSample?.trim(),
      pivotTarget?.trim()
    );

    const toolSchema = {
      type: "object" as const,
      properties: {
        thank_you_note: { type: "string" },
        check_in_email: { type: "string" },
      },
      required: ["thank_you_note", "check_in_email"],
    };

    let result: FollowUpResult | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const raw = await callClaudeWithTool<FollowUpResult>(prompt, "submit_follow_up", toolSchema, 2048);

      // Recover if Claude put the full JSON in the first field
      let candidate = raw;
      if (typeof raw.thank_you_note === "string" && raw.thank_you_note.trimStart().startsWith("{")) {
        try {
          const parsed = JSON.parse(raw.thank_you_note) as FollowUpResult;
          if (typeof parsed.thank_you_note === "string" && typeof parsed.check_in_email === "string") candidate = parsed;
        } catch { /* not JSON */ }
      }

      if (typeof candidate.thank_you_note !== "string" || typeof candidate.check_in_email !== "string") {
        console.error(`[follow-up] Attempt ${attempt}: missing required fields`);
        if (attempt === 3) return NextResponse.json({ error: "Follow-up generation failed. Try again." }, { status: 500 });
        continue;
      }
      result = candidate;
      break;
    }

    return NextResponse.json(sanitizeAI(result!));
  } catch (err) {
    console.error("[follow-up] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
