// Shared TypeScript types for Signal

export type TabId = "profile" | "job-fit" | "tailoring-brief" | "my-jobs";

export type ApplicationStatus =
  | "Tracking"
  | "Applied"
  | "Phone Screen"
  | "Interview"
  | "Offer"
  | "Rejected";

export interface ParseResumeResponse {
  text: string;
}

export interface ParseResumeError {
  error: string;
}

// Placeholder types for future sessions

export interface RoleCluster {
  name: string;
  confidence: "Strong" | "Moderate" | "Stretch";
  reasoning: string;
  signals: string[];
}

export interface RoleClusterResult {
  role_clusters: RoleCluster[];
  core_strengths: string[];
  positioning_risks: string[];
  recommended_headline: string;
}

export interface DimensionScore {
  score: number;
  reasoning: string;
}

export interface JobFitResult {
  overall_fit: number;
  summary: string;
  dimensions: {
    functional_fit: DimensionScore;
    seniority_fit: DimensionScore;
    industry_fit: DimensionScore;
    keyword_overlap: DimensionScore;
  };
  what_she_has: string[];
  whats_missing: string[];
  recommendation: "Apply Now" | "Apply with Tailoring" | "Stretch — Proceed Carefully" | "Skip";
  recruiter_concern?: string;
}

export interface LeadStrength {
  strength: string;
  framing_language: string;
}

export interface JDPhrase {
  phrase: string;
  context: string;
}

export interface DeemphasizeItem {
  item: string;
  reason: string;
}

export interface RecruiterConcern {
  concern: string;
  suggested_response: string;
}

export interface TailoringBriefResult {
  lead_strengths: LeadStrength[];
  jd_language_to_mirror: JDPhrase[];
  what_to_deemphasize: DeemphasizeItem[];
  recruiter_concern_to_preempt: RecruiterConcern;
  outreach_angle?: string;
}

export interface OutreachResult {
  email: string;
  linkedin_message: string;
}

export interface CoverLetterResult {
  cover_letter: string;
}

export interface ResumeBulletUpdate {
  section: string;
  original_paraphrase: string;
  suggested_rewrite: string;
  why: string;
}

export interface ResumeKeywordSuggestion {
  keyword: string;
  suggested_context: string;
}

export interface ResumeUpdateResult {
  summary_rewrite: string;
  bullet_updates: ResumeBulletUpdate[];
  keywords_to_weave_in: ResumeKeywordSuggestion[];
}

export interface InterviewQuestion {
  question: string;
  why_likely: string;
  suggested_approach: string;
}

export interface InterviewPrepResult {
  questions: InterviewQuestion[];
}

export interface FollowUpResult {
  thank_you_note: string;
  check_in_email: string;
}

export interface TrackedJob {
  id: string;
  label: string;
  jobDescription: string;
  jobFitResult: JobFitResult;
  tailoringResult: TailoringBriefResult | null;
  outreachResult: OutreachResult | null;
  resumeUpdateResult: ResumeUpdateResult | null;
  coverLetterResult: CoverLetterResult | null;
  interviewPrepResult: InterviewPrepResult | null;
  followUpResult: FollowUpResult | null;
  deadline: string | null;
  scoredAt: Date;
  applicationStatus: ApplicationStatus;
  notes: string;
}
