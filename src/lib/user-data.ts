import type { Job, JdAnalysis } from "@/types";
import { buildAnalysisFromJd } from "@/lib/jd-heuristics";
import { getLocalJobContext } from "@/lib/local-context-registry";

/**
 * Unified data access — the ONLY place that decides whether a request sees
 * demo data (Alex + the seeded jobs), a cloud user's own rows, or a
 * browser-local job (local-first user mode, no Supabase required).
 *
 * Rules:
 *  - Logged in (cloud)   → the user's own rows.
 *  - Local-first job id  → the context the browser uploaded when starting a
 *                          session (see local-context-registry).
 *  - Anything else       → the seeded demo jobs, so the demo keeps working.
 */

export interface JobEntry {
  job: Job;
  /** Always present: demo jobs have curated analyses, user jobs get a
   * heuristic one built from their own JD text (reorganisation only). */
  analysis: JdAnalysis;
  /** True when this is the logged-in user's own job. */
  isUserJob: boolean;
}

export async function getJobEntry(id: string): Promise<JobEntry | null> {
  const userEntry = await getUserJobEntry(id);
  if (userEntry) return userEntry;

  const { findAnalysis, findJob } = await import("@/data/mock-jobs");
  const job = findJob(id);
  if (job) {
    const analysis = findAnalysis(id) ?? buildAnalysisFromJd(job);
    return { job, analysis, isUserJob: false };
  }

  // Local-first mode: a browser-local job uploaded with its session start.
  const local = getLocalJobContext(id);
  if (local) return { job: local.job, analysis: local.analysis, isUserJob: false };

  return null;
}

/** The logged-in user's jobs, or null when not applicable. */
export async function getUserJobs(): Promise<Job[] | null> {
  return getUserJobsInner();
}

export async function listJobsForViewer(): Promise<{ jobs: Job[]; isUser: boolean }> {
  const jobs = await getUserJobs();
  if (jobs) return { jobs, isUser: true };
  const { mockJobs } = await import("@/data/mock-jobs");
  return { jobs: mockJobs, isUser: false };
}

/**
 * The profile the viewer should see. When a `jobId` hint is given and that
 * job is a browser-local one, the profile uploaded with it wins — so the
 * interview engine never falls back to Alex's demo profile for a local job.
 */
export async function getProfileForViewer(jobId?: string): Promise<{
  profile: import("@/types").CareerProfile | null;
  isUser: boolean;
}> {
  const profile = await getUserProfile();
  if (profile) return { profile, isUser: true };
  if (jobId) {
    const local = getLocalJobContext(jobId);
    if (local) return { profile: local.profile, isUser: true };
  }
  const { mockProfile } = await import("@/data/mock-profile");
  return { profile: mockProfile, isUser: false };
}

// ------------------------------------------------------------------ user ---

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SessionUser {
  id: string;
  email: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

async function getSupabase() {
  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  return getSupabaseServerClient();
}

async function getUserJobsInner(): Promise<Job[] | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("jobs")
    .select("data")
    .order("created_at", { ascending: false });
  if (error || !data) return null;
  return data.map((row) => row.data as Job);
}

async function getUserJobEntry(id: string): Promise<JobEntry | null> {
  if (!UUID_RE.test(id)) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("jobs")
    .select("data, analysis_json")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const job = data.data as Job;
  return {
    job,
    analysis:
      (data.analysis_json as JdAnalysis | null) ?? buildAnalysisFromJd(job),
    isUserJob: true,
  };
}

export async function getUserProfile(): Promise<import("@/types").CareerProfile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("career_profile_json")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data?.career_profile_json as import("@/types").CareerProfile) ?? null;
}

export async function getUserResumeText(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("resume_text")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.resume_text ?? null;
}
