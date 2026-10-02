import { NextRequest, NextResponse } from "next/server";
import { findJob } from "@/data/mock-jobs";
import { getLocalJobContext } from "@/lib/local-context-registry";
import { getJobEntry } from "@/lib/user-data";
import { saveMemorySession } from "@/lib/interview-memory";
import type {
  InterviewAnswer,
  InterviewSession,
  InterviewStage,
  LocalizedText,
} from "@/types";

/**
 * POST /api/interview-sessions
 *
 * Saves one completed mock-interview session into the server-side Interview
 * Memory (in-memory store). The stored session is what the Review tab reads
 * back and what the next session's question generator uses to target
 * recurring STAR gaps.
 *
 * The payload is normalised and capped here — anything oversized or
 * malformed is dropped rather than trusted. No transcript content is
 * logged.
 */

const MAX_ANSWERS = 12;
const MAX_TEXT = 5000;
const MAX_ITEMS = 6;
const VALID_STAGES: ReadonlySet<InterviewStage> = new Set([
  "screening",
  "first_round",
  "second_round",
  "final_round",
  "other",
]);
const VALID_STATUSES: ReadonlySet<string> = new Set([
  "recorded",
  "reviewed",
  "skipped",
]);

function cleanString(value: unknown, max = MAX_TEXT): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;
}

function cleanLocalized(value: unknown): LocalizedText | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  const zh = cleanString(record["zh-CN"], 1000);
  const en = cleanString(record.en, 1000);
  if (!zh && !en) return undefined;
  return { "zh-CN": zh ?? en ?? "", en: en ?? zh ?? "" };
}

function cleanStatus(value: unknown): InterviewAnswer["status"] {
  return typeof value === "string" && VALID_STATUSES.has(value)
    ? (value as InterviewAnswer["status"])
    : "recorded";
}

function cleanAnswers(raw: unknown): InterviewAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> =>
      typeof entry === "object" && entry !== null,
    )
    .slice(0, MAX_ANSWERS)
    .map((entry, index) => {
      const starSnapshotRaw = entry.starSnapshot;
      const snapshot =
        typeof starSnapshotRaw === "object" && starSnapshotRaw !== null
          ? (starSnapshotRaw as Record<string, unknown>)
          : null;
      let starSnapshot: InterviewAnswer["starSnapshot"];
      if (snapshot && typeof snapshot.questionId === "string") {
        const part = (key: string) =>
          key === "clear" || key === "partial" || key === "missing"
            ? key
            : "missing";
        const missingParts = Array.isArray(snapshot.missingParts)
          ? snapshot.missingParts.filter(
              (p): p is "situation" | "task" | "action" | "result" =>
                typeof p === "string" &&
                ["situation", "task", "action", "result"].includes(p),
            )
          : [];
        starSnapshot = {
          questionId: String(snapshot.questionId),
          situation: part(String(snapshot.situation ?? "missing")),
          task: part(String(snapshot.task ?? "missing")),
          action: part(String(snapshot.action ?? "missing")),
          result: part(String(snapshot.result ?? "missing")),
          missingParts,
          userConfirmed: snapshot.userConfirmed === true,
        };
      }

      const feedbackRaw =
        typeof entry.feedback === "object" && entry.feedback !== null
          ? (entry.feedback as Record<string, unknown>)
          : {};
      const list = (value: unknown): LocalizedText[] =>
        Array.isArray(value)
          ? value
              .map(cleanLocalized)
              .filter((v): v is LocalizedText => v !== null)
              .slice(0, MAX_ITEMS)
          : [];

      return {
        id:
          cleanString(entry.id, 100) ??
          `ans-${Date.now()}-${index}`,
        questionId: cleanString(entry.questionId, 100) ?? `unknown-${index}`,
        questionText: cleanLocalized(entry.questionText),
        inputMode: entry.inputMode === "text" ? "text" : "voice",
        duration:
          typeof entry.duration === "number" && entry.duration >= 0
            ? Math.round(entry.duration)
            : undefined,
        rawTranscript: cleanString(entry.rawTranscript),
        editedTranscript: cleanString(entry.editedTranscript),
        followUpQuestion: cleanString(entry.followUpQuestion, 300),
        followUpTranscript: cleanString(entry.followUpTranscript),
        ...(starSnapshot ? { starSnapshot } : {}),
        feedback: {
          strengths: list(feedbackRaw.strengths),
          missing: list(feedbackRaw.missing),
          suggestions: list(feedbackRaw.suggestions),
          evidenceIds: Array.isArray(feedbackRaw.evidenceIds)
            ? feedbackRaw.evidenceIds
                .filter((id): id is string => typeof id === "string")
                .slice(0, MAX_ITEMS)
            : [],
        },
        status: cleanStatus(entry.status),
      } satisfies InterviewAnswer;
    });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const jobId = cleanString(body?.jobId, 100);
  // Demo jobs, cloud user jobs and browser-local jobs are all valid targets.
  if (
    !jobId ||
    !(findJob(jobId) || getLocalJobContext(jobId) || (await getJobEntry(jobId)))
  ) {
    return NextResponse.json(
      { error: { code: "not_found" } },
      { status: 404 },
    );
  }

  const stage =
    typeof body?.stage === "string" && VALID_STAGES.has(
      body.stage as InterviewStage,
    )
      ? (body.stage as InterviewStage)
      : "first_round";

  const answers = cleanAnswers(body?.answers);

  const session: InterviewSession = {
    id: `session-${jobId}-${Date.now()}`,
    jobId,
    type: "mock",
    stage,
    startedAt:
      cleanString(body?.startedAt, 40) ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
    questionIds: answers.map((a) => a.questionId),
    answers,
    strengths: [],
    weakPoints: Array.isArray(body?.weakPoints)
      ? body.weakPoints
          .map(cleanLocalized)
          .filter((v): v is LocalizedText => v !== null)
          .slice(0, MAX_ITEMS)
      : [],
    nextFocus: Array.isArray(body?.nextFocus)
      ? body.nextFocus
          .map(cleanLocalized)
          .filter((v): v is LocalizedText => v !== null)
          .slice(0, MAX_ITEMS)
      : [],
  };

  saveMemorySession(session);
  return NextResponse.json({ session: { id: session.id } });
}
