import { NextRequest, NextResponse } from "next/server";
import { getJobEntry } from "@/lib/user-data";
import { saveMemoryDebrief } from "@/lib/interview-debrief-memory";
import type {
  InterviewDebrief,
  InterviewDebriefQuestion,
  InterviewStage,
  LocalizedText,
} from "@/types";

/**
 * POST /api/interview-debriefs
 *
 * Saves one CONFIRMED real-interview debrief into the server-side debrief
 * memory (same in-memory pattern as /api/interview-sessions). The stored
 * record is what the Review tab reads back and what the dynamic Interview
 * Preparation uses for nextRoundFocus.
 *
 * The payload is normalised and capped here — anything oversized or
 * malformed is dropped rather than trusted. Transcript content is not
 * logged.
 */

const MAX_ITEMS = 8;
const MAX_TEXT = 20_000;
const MAX_HINTS = 2;
const VALID_STAGES: ReadonlySet<InterviewStage> = new Set([
  "screening",
  "first_round",
  "second_round",
  "final_round",
  "other",
]);

function cleanString(value: unknown, max = 1000): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;
}

function cleanLocalized(value: unknown): LocalizedText | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  const zh = cleanString(record["zh-CN"]);
  const en = cleanString(record.en);
  if (!zh && !en) return undefined;
  return { "zh-CN": zh ?? en ?? "", en: en ?? zh ?? "" };
}

function cleanList(raw: unknown): LocalizedText[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(cleanLocalized)
    .filter((x): x is LocalizedText => x !== undefined)
    .slice(0, MAX_ITEMS);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return NextResponse.json(
      { error: { code: "invalid_request" } },
      { status: 400 },
    );
  }

  const jobId = cleanString(body.jobId, 100);
  if (!jobId) {
    return NextResponse.json(
      { error: { code: "invalid_request" } },
      { status: 400 },
    );
  }

  // Only jobs that actually exist can own a debrief.
  const entry = await getJobEntry(jobId);
  if (!entry) {
    return NextResponse.json({ error: { code: "not_found" } }, { status: 404 });
  }

  const stageRaw = cleanString(body.stage, 30);
  const stage: InterviewStage =
    stageRaw && VALID_STAGES.has(stageRaw as InterviewStage)
      ? (stageRaw as InterviewStage)
      : "first_round";

  const questions: InterviewDebriefQuestion[] = Array.isArray(body.questions)
    ? (body.questions as unknown[])
        .map((q, i): InterviewDebriefQuestion | null => {
          if (typeof q !== "object" || q === null) return null;
          const rec = q as Record<string, unknown>;
          const question = cleanLocalized(rec.question);
          if (!question) return null;
          return {
            id: cleanString(rec.id, 100) ?? `dq-saved-${Date.now()}-${i}`,
            question,
            notes: cleanLocalized(rec.notes),
          };
        })
        .filter((q): q is InterviewDebriefQuestion => q !== null)
        .slice(0, MAX_ITEMS)
    : [];

  const storyHints = Array.isArray(body.storyHints)
    ? (body.storyHints as unknown[])
        .map((h) => {
          if (typeof h !== "object" || h === null) return null;
          const rec = h as Record<string, unknown>;
          const storyId = cleanString(rec.storyId, 100);
          const reason = cleanLocalized(rec.reason);
          if (!storyId || !reason) return null;
          return { storyId, reason };
        })
        .filter(
          (h): h is { storyId: string; reason: LocalizedText } => h !== null,
        )
        .slice(0, MAX_HINTS)
    : [];

  const debrief: InterviewDebrief = {
    id: cleanString(body.id, 120) ?? `debrief-real-${jobId}-${Date.now()}`,
    jobId,
    stage,
    occurredAt:
      cleanString(body.occurredAt, 10) ??
      new Date().toISOString().slice(0, 10),
    rawNotes: cleanString(body.rawNotes, MAX_TEXT) ?? "",
    questions,
    weakPoints: cleanList(body.weakPoints),
    interviewerSignals: cleanList(body.interviewerSignals),
    nextRoundFocus: cleanList(body.nextRoundFocus),
    userConfirmed: body.userConfirmed === true,
    sourceType:
      body.sourceType === "mock_interview" ? "mock_interview" : "real_interview",
    ...(storyHints.length > 0 ? { storyHints } : {}),
  };

  saveMemoryDebrief(debrief);
  return NextResponse.json({ ok: true, debrief });
}
