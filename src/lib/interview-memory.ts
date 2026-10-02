import type { InterviewSession } from "@/types";

/**
 * Interview Memory — server-side in-memory store for completed mock
 * interview sessions (Phase 7.1).
 *
 * Sessions saved here carry the full answer memory the product logic needs:
 * question, confirmed transcript, framework, framework review snapshot,
 * follow-up, evidence used, weak points and next focus. The question
 * generator reads them back so the next session can target recurring gaps
 * (e.g. "project answers keep missing the Result").
 *
 * In-memory on purpose: consistent with the rest of the mock world — no
 * database, nothing persisted across server restarts, no user content
 * logged. The store lives on `globalThis` so every route bundle (pages +
 * API routes) sees ONE instance even when the dev server hot-reloads
 * modules.
 */

const globalStore = globalThis as typeof globalThis & {
  __careerOsSessionMemory?: Map<string, InterviewSession[]>;
};

const sessionsByJob: Map<string, InterviewSession[]> =
  (globalStore.__careerOsSessionMemory ??= new Map());

/** Latest first, mirroring the review history order. */
export function listMemorySessions(jobId: string): InterviewSession[] {
  return sessionsByJob.get(jobId) ?? [];
}

export function saveMemorySession(session: InterviewSession): void {
  const existing = sessionsByJob.get(session.jobId) ?? [];
  // Replace if re-saved, otherwise prepend (newest first).
  const next = [
    session,
    ...existing.filter((s) => s.id !== session.id),
  ];
  sessionsByJob.set(session.jobId, next);
}
