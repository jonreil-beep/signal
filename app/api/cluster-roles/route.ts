import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { buildRoleClusterPrompt } from "@/lib/prompts";
import type { RoleClusterResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { resumeText } = body as { resumeText?: string };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is missing or too short." }, { status: 400 });
    }

    const prompt = buildRoleClusterPrompt(resumeText.trim());

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text content from the response
    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format from Claude." },
        { status: 500 }
      );
    }

    // Strip any markdown fences Claude might add despite instructions
    const raw = content.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let result: RoleClusterResult;
    try {
      result = JSON.parse(raw) as RoleClusterResult;
    } catch {
      console.error("[cluster-roles] Failed to parse Claude response:", raw);
      return NextResponse.json(
        { error: "Claude returned malformed JSON. Try again.", raw },
        { status: 500 }
      );
    }

    // Basic shape validation
    if (!Array.isArray(result.role_clusters) || result.role_clusters.length === 0) {
      return NextResponse.json(
        { error: "Response was missing role clusters. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[cluster-roles] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
