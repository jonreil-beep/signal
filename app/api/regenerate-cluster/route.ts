import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { buildSingleClusterPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import type { RoleCluster } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { resumeText, clusterName } = body as { resumeText?: string; clusterName?: string };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is missing or too short." }, { status: 400 });
    }
    if (!clusterName || typeof clusterName !== "string") {
      return NextResponse.json({ error: "Cluster name is required." }, { status: 400 });
    }

    const prompt = buildSingleClusterPrompt(resumeText.trim(), clusterName.trim());

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response format from Claude." }, { status: 500 });
    }

    const raw = content.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let cluster: RoleCluster;
    try {
      cluster = JSON.parse(raw) as RoleCluster;
    } catch {
      console.error("[regenerate-cluster] Failed to parse Claude response:", raw);
      return NextResponse.json({ error: "Claude returned malformed JSON. Try again.", raw }, { status: 500 });
    }

    if (!cluster.name || !cluster.confidence || !cluster.signals) {
      return NextResponse.json({ error: "Response was missing required fields. Try again." }, { status: 500 });
    }

    return NextResponse.json({ cluster });
  } catch (err) {
    console.error("[regenerate-cluster] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
