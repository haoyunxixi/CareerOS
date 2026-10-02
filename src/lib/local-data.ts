import type { CareerEvent, CareerProfile, JdAnalysis, Job } from "@/types";
import { buildAnalysisFromJd } from "@/lib/jd-heuristics";

/**
 * Local-first user mode — no Supabase required.
 *
 * The browser-local "my CareerOS" space. Everything the user creates without
 * a cloud account (career profile, jobs) lives in localStorage under the
 * `careeros:` namespace and is strictly separated from the demo data
 * (Alex + the seeded jobs) and from any future cloud account.
 *
 * All helpers are SSR-safe (no-ops without `window`).
 */

export const LOCAL_JOB_PREFIX = "local-";

const MODE_KEY = "careeros:mode";
const PROFILE_KEY = "careeros:local-profile";
const JOBS_KEY = "careeros:local-jobs";
const EVENTS_KEY = "careeros:local-events";

export type ViewerMode = "demo" | "local";

export interface LocalProfileRecord {
  profile: CareerProfile;
  name: string;
  resumeText: string;
  savedAt: string;
}

export interface LocalJobRecord {
  job: Job;
  analysis: JdAnalysis;
}

export interface LocalJobForm {
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  jd: string;
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / disabled — degrade silently, the UI keeps working.
  }
}

/** A job id created by this browser (never collides with demo ids or uuids). */
export function isLocalJobId(id: string): boolean {
  return id.startsWith(LOCAL_JOB_PREFIX);
}

export function getLocalMode(): ViewerMode {
  return read<ViewerMode>(MODE_KEY) === "local" ? "local" : "demo";
}

export function setLocalMode(mode: ViewerMode): void {
  write(MODE_KEY, mode);
}

export function getLocalProfile(): LocalProfileRecord | null {
  return read<LocalProfileRecord>(PROFILE_KEY);
}

export function saveLocalProfile(
  record: Omit<LocalProfileRecord, "savedAt">,
): void {
  write(PROFILE_KEY, { ...record, savedAt: new Date().toISOString() });
}

/** Newest first. */
export function getLocalJobs(): LocalJobRecord[] {
  return read<LocalJobRecord[]>(JOBS_KEY) ?? [];
}

export function saveLocalJob(record: LocalJobRecord): void {
  write(JOBS_KEY, [
    record,
    ...getLocalJobs().filter((r) => r.job.id !== record.job.id),
  ]);
}

/** Wipe the browser-local space (profile, jobs, events, mode) — "Reset local data". */
export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  for (const key of [MODE_KEY, PROFILE_KEY, JOBS_KEY, EVENTS_KEY]) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

// ------------------------------------------------------------- career events ---

/** Career Events (Journey / Career Memory / Bubble), newest first. */
export function getLocalEvents(): CareerEvent[] {
  return read<CareerEvent[]>(EVENTS_KEY) ?? [];
}

export function saveLocalEvent(event: CareerEvent): void {
  write(EVENTS_KEY, [
    event,
    ...getLocalEvents().filter((e) => e.id !== event.id),
  ]);
}

export function removeLocalEvent(id: string): void {
  write(EVENTS_KEY, getLocalEvents().filter((e) => e.id !== id));
}

/** Collision-safe id for locally created events. */
export function newEventId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** Build the Job object (mirrors the /api/jobs cloud shape) + its heuristic
 * JD analysis, so a local job enters the exact same workspace as any other. */
export function buildLocalJob(form: LocalJobForm): LocalJobRecord {
  const clean = (v: string) => v.trim();
  const job: Job = {
    id: `${LOCAL_JOB_PREFIX}${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    company: { "zh-CN": clean(form.company), en: clean(form.company) },
    title: { "zh-CN": clean(form.title), en: clean(form.title) },
    ...(clean(form.location)
      ? { location: { "zh-CN": clean(form.location), en: clean(form.location) } }
      : {}),
    jd: clean(form.jd),
    ...(clean(form.jobUrl) ? { jobUrl: clean(form.jobUrl) } : {}),
    status: "interested",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  return { job, analysis: buildAnalysisFromJd(job) };
}
