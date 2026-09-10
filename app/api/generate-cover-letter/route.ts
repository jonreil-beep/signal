import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildCoverLetterPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
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

    const result = await callClaudeWithTool<CoverLetterResult>(
      prompt,
      "submit_cover_letter",
      {
        type: "object",
        properties: {
          cover_letter: { type: "string" },
        },
        required: ["cover_letter"],
      },
      2048
    );

    if (typeof result.cover_letter !== "string") {
      return NextResponse.json(
        { error: "Response was missing required fields. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-cover-letter] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
