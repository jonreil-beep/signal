// Shared TypeScript types for Signal

export type TabId = "profile" | "job-fit" | "tailoring-brief" | "my-jobs" | "discover";

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

export type RoleRecommendation =
  | "Pursue"
  | "Pursue Selectively"
  | "Stretch — Prep Required"
  | "Avoid"
  | "Reframe First";

export interface RoleCluster {
  name: string;
  confidence: "Strong" | "Moderate" | "Stretch";
  recommendation: RoleRecommendation;
  market_read: string; // how the market is likely to categorize this candidate
  reasoning: string;
  signals: string[];
}

export interface PositioningRisk {
  risk: string;
  what_to_do: string;
}

export interface RoleClusterResult {
  role_clusters: RoleCluster[];
  core_strengths: string[];
  positioning_risks: PositioningRisk[];
  recommended_headline: string;
}

export interface DimensionScore {
  score: number;
  reasoning: string;
}

export type MismatchType = "title" | "comp" | "scope" | "domain" | "functional";

export interface JobFitResult {
  job_title: string; // extracted from JD — e.g. "Senior Product Manager, Growth"
  overall_fit: number;
  summary: string;
  dimensions: {
    functional_fit: DimensionScore;
    seniority_fit: DimensionScore;
    industry_fit: DimensionScore;
    keyword_overlap: DimensionScore;
  };
  mismatch_types: MismatchType[]; // what kind of gap is driving a lower score
  what_she_has: string[];
  whats_missing: string[];
  recommendation: "Apply Now" | "Apply with Tailoring" | "Stretch — Proceed Carefully" | "Skip";
  recruiter_concern: string; // required — "None identified" if no concern
}

export type StrengthMatchType = "Direct match" | "Strong inference" | "Reframe";

export interface LeadStrength {
  strength: string;
  match_type: StrengthMatchType; // how solid the underlying claim is
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
  honest_take: string; // one unvarnished sentence a career advisor would say — not softened
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
  original: string;
  suggested: string;
  what_changed: string;
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

export interface CompanyResearchQuestion {
  question: string;
  what_youre_probing: string;
}

export interface CompanyWhatWeKnow {
  summary: string;
  sources: string;
}

export interface CompanyRedFlag {
  flag: string;
  how_to_probe: string;
}

export interface CompanyResearchResult {
  company_name: string;
  // Tiered provenance: fact → inference → hypotheses to test
  what_we_know: CompanyWhatWeKnow;       // reasonably verifiable facts
  what_we_re_reading: string[];          // inferences from JD / market signals — labeled as interpretation
  culture_signals: string[];             // inferred from JD tone and requirements
  red_flags_to_probe: CompanyRedFlag[];  // concerns worth surfacing in interview
  questions_to_test: CompanyResearchQuestion[]; // hypotheses to test in interview
  caveat?: string;
}

export interface LinkedInHeadlineOption {
  text: string;
  angle: string;
  best_for: string;
}

export interface LinkedInHeadlineResult {
  headlines: LinkedInHeadlineOption[];
}

export interface DiscoveredJob {
  title: string;
  company: string;
  url: string;
  snippet: string;
  why_match: string;
}

export interface JobDiscoveryResult {
  jobs: DiscoveredJob[];
  search_summary: string;
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
  companyResearchResult: CompanyResearchResult | null;
  deadline: string | null;
  scoredAt: Date;
  applicationStatus: ApplicationStatus;
  notes: string;
}
