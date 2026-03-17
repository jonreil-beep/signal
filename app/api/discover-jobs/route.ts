import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import anthropic from "@/lib/anthropic";
import { buildJobDiscoveryPrompt, buildSimilarJobsPrompt } from "@/lib/prompts";
import type { JobDiscoveryResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { profileSummary, similarToJD } = body as {
      profileSummary?: string;
      similarToJD?: string;
    };

    if (!profileSummary || typeof profileSummary !== "string" || profileSummary.trim().length < 50) {
      return NextResponse.json(
        { error: "Profile summary is required to search for jobs." },
        { status: 400 }
      );
    }

    const prompt = similarToJD
      ? buildSimilarJobsPrompt(similarToJD, profileSummary.trim())
      : buildJobDiscoveryPrompt(profileSummary.trim());

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "web_search_20250305", name: "web_search" } as any],
      messages: [{ role: "user", content: prompt }],
    });

    // Collect all text blocks — web_search is server-side, Claude returns final answer as text
    const rawText = message.content
      .filter((b) => b.type === "text")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b) => (b as any).text as string)
      .join("");

    if (!rawText) {
      return NextResponse.json(
        { error: "No text response returned. Please try again." },
        { status: 500 }
      );
    }

    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("[discover-jobs] Could not find JSON in response:", rawText.slice(0, 500));
      return NextResponse.json(
        { error: "Could not parse job results. Please try again." },
        { status: 500 }
      );
    }

    let result: JobDiscoveryResult;
    try {
      result = JSON.parse(jsonMatch[0]) as JobDiscoveryResult;
    } catch {
      console.error("[discover-jobs] JSON parse failed:", jsonMatch[0].slice(0, 500));
      return NextResponse.json(
        { error: "Claude returned malformed JSON. Try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(result.jobs)) {
      return NextResponse.json(
        { error: "Response was missing job listings. Try again." },
        { status: 500 }
      );
    }

    // Sanitize: ensure all required fields are present on each job
    result.jobs = result.jobs.filter(
      (j) =>
        typeof j.title === "string" &&
        typeof j.company === "string" &&
        typeof j.url === "string" &&
        typeof j.snippet === "string" &&
        typeof j.why_match === "string"
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("[discover-jobs] Error:", err);

    // Rate limit — return a clean, user-friendly message
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    // Other Anthropic API errors
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Search failed (${err.status}). Please try again.` },
        { status: err.status ?? 500 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
