import { createClient } from "@/lib/supabase/client";

/**
 * Fetch wrapper that retries once on 401 after refreshing the Supabase session.
 * Supabase's browser client auto-refreshes expired tokens, but there is a window
 * between expiry and the next auto-refresh tick where a request can race ahead
 * with a stale cookie. One bounded retry covers this case without bypassing auth.
 */
export async function fetchWithSession(url: string, options: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status !== 401) return res;

  // Trigger a session refresh, then retry once
  const supabase = createClient();
  await supabase.auth.getSession();
  return fetch(url, options);
}
