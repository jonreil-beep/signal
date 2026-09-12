import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildCoverLetterPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import { sanitizeAI } from "@/lib/sanitizeAIText";
import type { CoverLetterResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { allowed } = await checkAndLogUsage(user.id, "/api/generate-cover-letter");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for cover letters. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText, jobDescription, outreachAngle, userNote, writingSample, pivotTarget } = body as {
      resumeText?: string;
      jobDescription?: string;
      outreachAngle?: string;
      userNote?: string;
      writingSample?: string;
      pivotTarget?: string;
    };

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }
    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    const prompt = buildCoverLetterPrompt(
      resumeText.trim(),
      jobDescription.trim(),
      outreachAngle?.trim(),
      userNote?.trim(),
      writingSample?.trim(),
      pivotTarget?.trim()
    );

    const toolSchema = {
      type: "object" as const,
      properties: { cover_letter: { type: "string" } },
      required: ["cover_letter"],
    };

    let result: CoverLetterResult | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const raw = await callClaudeWithTool<CoverLetterResult>(prompt, "submit_cover_letter", toolSchema, 2048);

      let candidate = raw;
      if (typeof raw.cover_letter === "string" && raw.cover_letter.trimStart().startsWith("{")) {
        try {
          const parsed = JSON.parse(raw.cover_letter) as CoverLetterResult;
          if (typeof parsed.cover_letter === "string") candidate = parsed;
        } catch { /* not JSON */ }
      }

      if (typeof candidate.cover_letter !== "string" || candidate.cover_letter.trim().length < 50) {
        console.error(`[generate-cover-letter] Attempt ${attempt}: missing or short cover_letter`);
        if (attempt === 3) return NextResponse.json({ error: "Cover letter generation failed. Try again." }, { status: 500 });
        continue;
      }
      result = candidate;
      break;
    }

    return NextResponse.json(sanitizeAI(result!));
  } catch (err) {
    console.error("[generate-cover-letter] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
