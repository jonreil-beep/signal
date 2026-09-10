import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildOutreachPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
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

    const result = await callClaudeWithTool<OutreachResult>(
      prompt,
      "submit_outreach",
      {
        type: "object",
        properties: {
          email: { type: "string" },
          linkedin_message: { type: "string" },
        },
        required: ["email", "linkedin_message"],
      },
      2048
    );

    if (typeof result.email !== "string" || typeof result.linkedin_message !== "string") {
      return NextResponse.json(
        { error: "Response was missing required fields. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-outreach] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
