import type {
  CareerEvent,
  InterviewDebrief,
  InterviewSession,
  InterviewStage,
  Job,
  LocalizedText,
  StarPart,
} from "@/types";
import { createTranslator } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { pick } from "@/lib/localize";

/**
 * Phase 10 — Journey / Career Memory mapper.
 *
 * Journey is a VIEW over existing business data, not a second store: jobs,
 * job statuses, mock-interview sessions, real-interview debriefs and career
 * events (bubbles included) are merged here into one timeline plus a
 * deterministic "Current Focus" aggregation. No AI, no numeric scores —
 * the same lines the interview reviews already produced, counted.
 */

export interface TimelineItem {
  id: string;
  /** ISO timestamp. */
  date: string;
  company?: string;
  role?: string;
  eventType: CareerEvent["eventType"];
  /** Localized event label, e.g. "模拟面试". */
  title: string;
  /** Short content / reflection line. */
  content: string;
  /** Localized next action, when one exists. */
  nextAction?: string;
  /** Present when the item links into a job workspace. */
  jobId?: string;
}

/** What a session contributes to Current Focus. */
export interface FocusSource {
  weakPoints: LocalizedText[];
  nextFocus: LocalizedText[];
  starMissingParts: StarPart[];
}

export interface JourneySessionSummary extends FocusSource {
  jobId: string;
  type: "mock" | "real";
  stage: InterviewStage;
  startedAt: string;
  answeredCount: number;
}

export interface JourneyDebriefSummary {
  jobId: string;
  stage: InterviewStage;
  occurredAt?: string;
  weakPoints: LocalizedText[];
  nextRoundFocus: LocalizedText[];
  /** Kept verbatim as a fallback reflection line. */
  rawNotes?: string;
}

export interface JourneySources {
  jobs: Job[];
  sessions: JourneySessionSummary[];
  debriefs: JourneyDebriefSummary[];
  events: CareerEvent[];
}

const STAR_LABELS: Record<StarPart, string> = {
  situation: "Situation",
  task: "Task",
  action: "Action",
  result: "Result",
};

const MAX_FOCUS = 5;

/** Map the stored InterviewSession shape (demo + memory store) into the
 *  compact summary Journey needs — including the STAR missing aggregation. */
export function sessionSummaries(
  sessions: InterviewSession[],
): JourneySessionSummary[] {
  return sessions.map((session) => ({
    jobId: session.jobId,
    type: session.type,
    stage: session.stage,
    startedAt: session.startedAt,
    answeredCount: session.answers.filter((a) => a.status !== "skipped").length,
    weakPoints: session.weakPoints,
    nextFocus: session.nextFocus,
    starMissingParts: session.answers.flatMap(
      (a) => a.starSnapshot?.missingParts ?? [],
    ),
  }));
}

export function debriefSummaries(
  debriefs: InterviewDebrief[],
): JourneyDebriefSummary[] {
  return debriefs.map((d) => ({
    jobId: d.jobId,
    stage: d.stage,
    occurredAt: d.occurredAt,
    weakPoints: d.weakPoints,
    nextRoundFocus: d.nextRoundFocus,
    rawNotes: d.rawNotes,
  }));
}

/** Timeline + Current Focus in one pass. Both are pure and deterministic. */
export function buildJourney(
  sources: JourneySources,
  locale: Locale,
): { timeline: TimelineItem[]; focus: string[] } {
  const t = createTranslator(locale);
  const jobById = new Map(sources.jobs.map((job) => [job.id, job]));
  const focusParts = aggregateFocus(sources, locale);

  const items: TimelineItem[] = [];

  // Jobs themselves → "job added" entries (the spine of the journey).
  for (const job of sources.jobs) {
    items.push({
      id: `job-${job.id}`,
      date: job.createdAt || new Date().toISOString(),
      company: pick(job.company, locale),
      role: pick(job.title, locale),
      eventType: "job",
      title: t("journey.event.jobAdded"),
      content: t(jobStatusKey(job.status)),
      jobId: job.id,
    });
  }

  // Mock sessions → interview entries.
  for (const session of sources.sessions) {
    const job = jobById.get(session.jobId);
    items.push({
      id: `session-${session.jobId}-${session.startedAt}`,
      date: session.startedAt,
      company: job ? pick(job.company, locale) : undefined,
      role: job ? pick(job.title, locale) : undefined,
      eventType: session.type === "real" ? "real_interview" : "mock_interview",
      title:
        session.type === "real"
          ? t("journey.event.realInterview")
          : t("journey.event.mockInterview"),
      content:
        firstLine(session.weakPoints, locale) ??
        t("journey.event.sessionDone", { count: session.answeredCount }),
      nextAction: firstLine(session.nextFocus, locale),
      jobId: session.jobId,
    });
  }

  // Real-interview debriefs → review entries.
  for (const debrief of sources.debriefs) {
    const job = jobById.get(debrief.jobId);
    items.push({
      id: `debrief-${debrief.jobId}-${debrief.occurredAt ?? ""}`,
      date: debrief.occurredAt ?? new Date().toISOString(),
      company: job ? pick(job.company, locale) : undefined,
      role: job ? pick(job.title, locale) : undefined,
      eventType: "real_interview",
      title: t("journey.event.realInterview"),
      content:
        firstLine(debrief.weakPoints, locale) ?? debrief.rawNotes ?? "",
      nextAction: firstLine(debrief.nextRoundFocus, locale),
      jobId: debrief.jobId,
    });
  }

  // Career events → bubbles + any other recorded activity. Mock-interview
  // events recorded in local mode carry their summary in metadata.
  for (const event of sources.events) {
    if (event.eventType === "mock_interview" || event.eventType === "real_interview") {
      const meta = readEventMeta(event);
      const job = event.jobId ? jobById.get(event.jobId) : undefined;
      items.push({
        id: event.id,
        date: event.createdAt,
        company: job ? pick(job.company, locale) : undefined,
        role: job ? pick(job.title, locale) : undefined,
        eventType: event.eventType,
        title:
          event.eventType === "real_interview"
            ? t("journey.event.realInterview")
            : t("journey.event.mockInterview"),
        content:
          firstLine(meta.weakPoints, locale) ??
          firstLine(meta.nextFocus, locale) ??
          event.content,
        nextAction: firstLine(meta.nextFocus, locale),
        jobId: event.jobId,
      });
      continue;
    }

    const job = event.jobId ? jobById.get(event.jobId) : undefined;
    items.push({
      id: event.id,
      date: event.createdAt,
      company: job ? pick(job.company, locale) : undefined,
      role: job ? pick(job.title, locale) : undefined,
      eventType: event.eventType,
      title:
        event.eventType === "bubble"
          ? t("journey.event.thought")
          : (event.title ?? t("journey.event.review")),
      content: event.content,
      jobId: event.jobId,
    });
  }

  items.sort((a, b) => b.date.localeCompare(a.date));

  return { timeline: items, focus: focusParts };
}

// ------------------------------------------------------------- current focus ---

/**
 * Deterministic aggregation: every weak-point / next-focus line the interview
 * reviews already produced, plus STAR missing parts, counted across sources.
 * No scores, no percentages — just "what keeps coming back".
 */
function aggregateFocus(sources: JourneySources, locale: Locale): string[] {
  const t = createTranslator(locale);
  const counts = new Map<string, { count: number; text: LocalizedText }>();
  const starCounts = new Map<StarPart, number>();

  const addLines = (lines: LocalizedText[]) => {
    for (const line of lines) {
      const key = line["zh-CN"] ?? line.en ?? "";
      if (!key) continue;
      const existing = counts.get(key);
      counts.set(key, {
        count: (existing?.count ?? 0) + 1,
        text: line,
      });
    }
  };

  for (const session of sources.sessions) {
    addLines(session.weakPoints);
    addLines(session.nextFocus);
    for (const part of session.starMissingParts) {
      starCounts.set(part, (starCounts.get(part) ?? 0) + 1);
    }
  }

  for (const debrief of sources.debriefs) {
    addLines(debrief.weakPoints);
    addLines(debrief.nextRoundFocus);
  }

  for (const event of sources.events) {
    const meta = readEventMeta(event);
    addLines(meta.weakPoints);
    addLines(meta.nextFocus);
    for (const part of meta.starMissingParts) {
      starCounts.set(part, (starCounts.get(part) ?? 0) + 1);
    }
  }

  const entries: { key: string; count: number; label: string }[] = [];
  for (const [key, { count, text }] of counts) {
    entries.push({ key, count, label: pick(text, locale) });
  }
  for (const [part, count] of starCounts) {
    entries.push({
      key: `star:${part}`,
      count,
      label:
        count >= 2
          ? t("journey.focus.starRepeated", { part: STAR_LABELS[part] })
          : t("journey.focus.star", { part: STAR_LABELS[part] }),
    });
  }

  // Frequency first, then stable alphabetical order for equal counts.
  entries.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  return entries.slice(0, MAX_FOCUS).map((e) => e.label);
}

// ------------------------------------------------------------------- helpers ---

function readEventMeta(event: CareerEvent): {
  weakPoints: LocalizedText[];
  nextFocus: LocalizedText[];
  starMissingParts: StarPart[];
} {
  const meta = (event.metadata ?? {}) as {
    weakPoints?: unknown;
    nextFocus?: unknown;
    starMissingParts?: unknown;
  };
  const lines = (value: unknown): LocalizedText[] =>
    Array.isArray(value)
      ? value.filter(
          (v): v is LocalizedText =>
            typeof v === "object" && v !== null && "zh-CN" in v,
        )
      : [];
  const parts = Array.isArray(meta.starMissingParts)
    ? meta.starMissingParts.filter(
        (p): p is StarPart =>
          p === "situation" || p === "task" || p === "action" || p === "result",
      )
    : [];
  return {
    weakPoints: lines(meta.weakPoints),
    nextFocus: lines(meta.nextFocus),
    starMissingParts: parts,
  };
}

function firstLine(lines: LocalizedText[], locale: Locale): string | undefined {
  const first = lines[0];
  return first ? pick(first, locale) : undefined;
}

function jobStatusKey(status: Job["status"]) {
  switch (status) {
    case "applied":
      return "jobs.status.applied" as const;
    case "interviewing":
      return "jobs.status.interviewing" as const;
    case "closed":
      return "jobs.status.closed" as const;
    default:
      return "jobs.status.interested" as const;
  }
}

/** "Sep 26" / "9月26日" — short, quiet, locale aware. */
export function formatEventDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}
