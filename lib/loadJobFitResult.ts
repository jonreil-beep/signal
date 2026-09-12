import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobFitResult } from "@/types";

export interface JobFitLookup {
  result: JobFitResult;
  jobDescription: string;
}

/**
 * Load and verify a saved JobFitResult from the DB for an authenticated user.
 * Returns the result + authoritative job_description on success,
 * null if no jobId was provided (guest flow — caller proceeds without established analysis),
 * or an error object if the jobId is invalid, not owned, or has no saved assessment.
 */
export async function loadJobFitResult(
  supabase: SupabaseClient,
  userId: string,
  jobId: string | undefined
): Promise<JobFitLookup | { error: string; status: number } | null> {
  if (!jobId) return null; // guest flow

  const { data, error } = await supabase
    .from("tracked_jobs")
    .select("job_fit_result, job_description, user_id")
    .eq("id", jobId)
    .single();

  if (error || !data) {
    return { error: "Job not found.", status: 404 };
  }

  if (data.user_id !== userId) {
    return { error: "Forbidden.", status: 403 };
  }

  if (!data.job_fit_result) {
    return { error: "No saved assessment for this job. Score it first.", status: 422 };
  }

  return {
    result: data.job_fit_result as JobFitResult,
    jobDescription: (data.job_description as string) ?? "",
  };
}
