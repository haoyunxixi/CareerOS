import type { CareerProfile, JdAnalysis, Job } from "@/types";

/**
 * Server-side registry for browser-local jobs (local-first user mode).
 *
 * localStorage is invisible to the server, but the shared interview engine
 * (question generation, feedback, memory) resolves jobs by id server-side.
 * When a local user starts a mock interview, the client uploads its own
 * job + analysis + profile here once; the existing engine then reads them
 * through the normal `getJobEntry` / `getProfileForViewer` lookups — no
 * second engine, no contract changes.
 *
 * In-memory on purpose (mirrors interview-memory.ts): nothing persisted,
 * nothing logged, entries expire after 24h or the next server restart.
 */

export interface LocalContextEntry {
  job: Job;
  analysis: JdAnalysis;
  profile: CareerProfile;
  expiresAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000;

// Next.js compiles each route as its own bundle, so a plain module-level Map
// would NOT be shared between routes (route A registers, route B reads air).
// The standard fix is a globalThis singleton — one Map per server process.
const globalStore = globalThis as typeof globalThis & {
  __careerosLocalContext?: Map<string, LocalContextEntry>;
};
const byJobId: Map<string, LocalContextEntry> =
  globalStore.__careerosLocalContext ?? new Map();
globalStore.__careerosLocalContext = byJobId;

export function registerLocalContext(
  job: Job,
  analysis: JdAnalysis,
  profile: CareerProfile,
): void {
  byJobId.set(job.id, {
    job,
    analysis,
    profile,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function getLocalJobContext(jobId: string): LocalContextEntry | null {
  const entry = byJobId.get(jobId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    byJobId.delete(jobId);
    return null;
  }
  return entry;
}
