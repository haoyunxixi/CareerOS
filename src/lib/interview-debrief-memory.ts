import type { InterviewDebrief } from "@/types";

/**
 * Real-interview debrief memory — server-side in-memory store, the exact
 * same pattern as `interview-memory` (Phase 7.1). Confirmed debriefs are
 * saved here by POST /api/interview-debriefs and read back by:
 *
 *  - the Review tab (history)
 *  - the dynamic Interview Preparation (nextRoundFocus → focuses)
 *  - the AI feedback context (previous weak points)
 *
 * In-memory on purpose: consistent with the rest of the persistence layer
 * — no new database table, no migration, nothing logged. The store lives
 * on `globalThis` so every route bundle (pages + API routes) sees ONE
 * instance even when the dev server hot-reloads modules.
 */

const globalStore = globalThis as typeof globalThis & {
  __careerOsDebriefMemory?: Map<string, InterviewDebrief[]>;
};

const debriefsByJob: Map<string, InterviewDebrief[]> =
  (globalStore.__careerOsDebriefMemory ??= new Map());

/** Latest first. */
export function listMemoryDebriefs(jobId: string): InterviewDebrief[] {
  return debriefsByJob.get(jobId) ?? [];
}

export function saveMemoryDebrief(debrief: InterviewDebrief): void {
  const existing = debriefsByJob.get(debrief.jobId) ?? [];
  const next = [
    debrief,
    ...existing.filter((d) => d.id !== debrief.id),
  ];
  debriefsByJob.set(debrief.jobId, next);
}
