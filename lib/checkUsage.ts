import { createClient } from "@/lib/supabase/server";

const DAILY_LIMITS: Record<string, number> = {
  "/api/cluster-roles": 3,
  "/api/score-job": 10,
  "/api/tailor": 10,
  "/api/fetch-jd": 20,
};

export async function checkAndLogUsage(
  userId: string,
  route: string
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createClient();
  const limit = DAILY_LIMITS[route] ?? 5;

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("api_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("route", route)
    .gte("created_at", since.toISOString());

  const used = count ?? 0;

  if (used >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabase.from("api_usage").insert({ user_id: userId, route });

  return { allowed: true, remaining: limit - used - 1 };
}
