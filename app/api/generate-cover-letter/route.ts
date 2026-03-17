import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { buildCoverLetterPrompt } from "@/lib/prompts";
import type { CoverLetterResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { resumeText, jobDescription, outreachAngle, userNote } = body as {
      resumeText?: string;
      jobDescription?: string;
      outreachAngle?: string;
      userNote?: string;
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
      userNote?.trim()
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response format from Claude." }, { status: 500 });
    }

    const raw = content.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let result: CoverLetterResult;
    try {
      result = JSON.parse(raw) as CoverLetterResult;
    } catch {
      console.error("[generate-cover-letter] Failed to parse Claude response:", raw);
      return NextResponse.json({ error: "Claude returned malformed JSON. Try again." }, { status: 500 });
    }

    if (typeof result.cover_letter !== "string") {
      return NextResponse.json({ error: "Response was missing required fields. Try again." }, { status: 500 });
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
