import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Detect a brand-new signup: created_at within the last 60 seconds
    const isNewUser =
      data.user &&
      Date.now() - new Date(data.user.created_at).getTime() < 60_000;

    if (isNewUser) {
      return NextResponse.redirect(`${origin}/?welcome=true`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
