import { NextRequest, NextResponse } from "next/server";
import { fetchJobDescription } from "@/lib/fetchJD";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { allowed } = await checkAndLogUsage(user.id, "/api/fetch-jd");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for URL fetches. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
    }

    const text = await fetchJobDescription(url);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[fetch-jd] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not fetch the URL. Paste the job description text instead.",
      },
      { status: 422 }
    );
  }
}
