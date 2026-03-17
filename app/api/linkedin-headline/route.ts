import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { buildLinkedInHeadlinePrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import type { LinkedInHeadlineResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { allowed } = await checkAndLogUsage(user.id, "/api/linkedin-headline");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for LinkedIn headlines. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText, writingSample } = body as { resumeText?: string; writingSample?: string };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Resume text is missing or too short." },
        { status: 400 }
      );
    }

    const prompt = buildLinkedInHeadlinePrompt(resumeText.trim(), writingSample?.trim());

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
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

    let result: LinkedInHeadlineResult;
    try {
      result = JSON.parse(raw) as LinkedInHeadlineResult;
    } catch {
      console.error("[linkedin-headline] Failed to parse Claude response:", raw);
      return NextResponse.json(
        { error: "Claude returned malformed JSON. Try again.", raw },
        { status: 500 }
      );
    }

    if (!Array.isArray(result.headlines) || result.headlines.length === 0) {
      return NextResponse.json(
        { error: "Response was missing required fields. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[linkedin-headline] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
