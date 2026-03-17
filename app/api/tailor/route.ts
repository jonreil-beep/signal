import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { buildTailoringPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import type { TailoringBriefResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { allowed } = await checkAndLogUsage(user.id, "/api/tailor");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for prep guides. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText, jobDescription, userNote, writingSample, pivotTarget } = body as {
      resumeText?: string;
      jobDescription?: string;
      userNote?: string;
      writingSample?: string;
      pivotTarget?: string;
    };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is missing or too short." }, { status: 400 });
    }

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description is missing or too short." },
        { status: 400 }
      );
    }

    const prompt = buildTailoringPrompt(resumeText.trim(), jobDescription.trim(), userNote?.trim(), writingSample?.trim(), pivotTarget?.trim());

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format from Claude." },
        { status: 500 }
      );
    }

    const raw = content.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let result: TailoringBriefResult;
    try {
      result = JSON.parse(raw) as TailoringBriefResult;
    } catch {
      console.error("[tailor] Failed to parse Claude response:", raw);
      return NextResponse.json(
        { error: "Claude returned malformed JSON. Try again.", raw },
        { status: 500 }
      );
    }

    // Basic shape validation
    if (!Array.isArray(result.lead_strengths) || !result.recruiter_concern_to_preempt) {
      return NextResponse.json(
        { error: "Response was missing required fields. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[tailor] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
