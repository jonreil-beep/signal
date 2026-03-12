import { NextRequest, NextResponse } from "next/server";
import { fetchJobDescription } from "@/lib/fetchJD";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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
