"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  InterviewRoom,
  type RoomAnswerState,
} from "@/components/interview/InterviewRoom";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import {
  isLocalJobId,
  newEventId,
  saveLocalEvent,
} from "@/lib/local-data";
import { saveInterviewSession } from "@/services/interview-sessions";
import type {
  Evidence,
  InterviewStage,
  InterviewStory,
  Job,
  LocalizedText,
  SessionQuestion,
  StarPart,
  StarSnapshot,
} from "@/types";

export interface MockInterviewViewProps {
  job: Job;
  stage: InterviewStage;
  /** The per-job generated session questions (from the interview engine). */
  questions: SessionQuestion[];
  /** Match evidence pool, used to resolve evidenceIds. */
  evidence: Evidence[];
  /** Focus titles for the start screen (from prep / context), if any. */
  focusTitles: LocalizedText[];
  /** Phase 8: this job's Story Bank — shown as callable stories per question. */
  stories?: InterviewStory[];
  locale: Locale;
}

type Phase = "start" | "session" | "summary";

const stageKeys: Record<InterviewStage, TranslationKey> = {
  screening: "jobs.interview.context.stage.screening",
  first_round: "jobs.interview.context.stage.first_round",
  second_round: "jobs.interview.context.stage.second_round",
  final_round: "jobs.interview.context.stage.final_round",
  other: "jobs.interview.context.stage.other",
};

const starPartSummaryKeys: Record<StarPart, TranslationKey> = {
  situation: "jobs.mock.feedback.star.situation",
  task: "jobs.mock.feedback.star.task",
  action: "jobs.mock.feedback.star.action",
  result: "jobs.mock.feedback.star.result",
};

/**
 * The mock interview. Three phases — start, the Interview Room (one
 * question at a time, voice-first), summary — kept deliberately quiet.
 * Audio lives in frontend state only: object URLs are revoked when they
 * are replaced and when the page unmounts.
 *
 * Phase 7.1: the questions are generated per job by the interview engine,
 * and the summary is computed from THIS session's real feedback — including
 * the STAR reflection and the next-round focus that feed Interview Memory.
 */
export function MockInterviewView({
  job,
  stage,
  questions,
  evidence,
  focusTitles,
  stories,
  locale,
}: MockInterviewViewProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("start");
  const [index, setIndex] = useState(0);
  /** questionId -> the current answer (voice or text). */
  const [answers, setAnswers] = useState<Record<string, RoomAnswerState>>({});
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());

  const total = questions.length;
  const current = questions[index];
  const company = pick(job.company, locale);
  const jobTitle = pick(job.title, locale);

  const answeredQuestions = questions.filter(
    (q) => answers[q.id] && answers[q.id].status !== "skipped",
  );
  const answeredCount = answeredQuestions.length;
  const skippedCount = questions.filter(
    (q) => answers[q.id]?.status === "skipped",
  ).length;

  /** Evidence actually touched across answered questions. */
  const evidenceUsed = useMemo(() => {
    const ids = new Set<string>();
    for (const q of questions) {
      const answer = answers[q.id];
      if (!answer || answer.status === "skipped") continue;
      for (const id of q.evidenceIds) ids.add(id);
    }
    return evidence.filter((e) => ids.has(e.id));
  }, [answers, evidence, questions]);

  /** STAR reflection + next focus, computed from this session's feedback. */
  const starReflection = useMemo(
    () => buildStarReflection(answeredQuestions, answers, t),
    [answeredQuestions, answers, t],
  );
  const nextFocus = useMemo(() => {
    const seen = new Set<string>();
    const items: string[] = [];
    for (const q of answeredQuestions) {
      for (const item of answers[q.id]?.feedback?.nextFocus ?? []) {
        if (seen.has(item)) continue;
        seen.add(item);
        items.push(item);
      }
    }
    return items.slice(0, 3);
  }, [answeredQuestions, answers]);

  /** Never leak object URLs when leaving the mock interview. */
  const answersRef = useRef(answers);
  answersRef.current = answers;
  useEffect(() => {
    return () => {
      for (const answer of Object.values(answersRef.current)) {
        if (answer.audioUrl) URL.revokeObjectURL(answer.audioUrl);
      }
    };
  }, []);

  const setAnswer = (questionId: string, next: RoomAnswerState) => {
    setAnswers((prev) => {
      const old = prev[questionId];
      // Replacing a recording: release the previous object URL.
      if (old?.audioUrl && old.audioUrl !== next.audioUrl) {
        URL.revokeObjectURL(old.audioUrl);
      }
      return { ...prev, [questionId]: next };
    });
  };

  const resetAnswer = (questionId: string) => {
    setAnswers((prev) => {
      const old = prev[questionId];
      if (old?.audioUrl) URL.revokeObjectURL(old.audioUrl);
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const goNext = () => {
    // The room already marks answers "reviewed" once feedback is generated;
    // advancing never mutates the answer.
    if (index + 1 >= total) {
      setPhase("summary");
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleSkip = () => {
    if (!current) return;
    setAnswer(current.id, {
      inputMode: answers[current.id]?.inputMode ?? "voice",
      status: "skipped",
    });
    goNext();
  };

  const handleSaveSession = async () => {
    setSaveFailed(false);
    const starWeakPoints = collectStarWeakPoints(
      answeredQuestions,
      answers,
      locale,
    );
    const savedId = await saveInterviewSession({
      jobId: job.id,
      stage,
      startedAt,
      answers: answeredQuestions.map((q) => ({
        questionId: q.id,
        questionText: q.question,
        inputMode: answers[q.id].inputMode,
        durationSec: undefined,
        ...(answers[q.id].rawTranscript
          ? { rawTranscript: answers[q.id].rawTranscript }
          : {}),
        ...(answers[q.id].editedTranscript
          ? { editedTranscript: answers[q.id].editedTranscript }
          : {}),
        ...(answers[q.id].followUpQuestion
          ? { followUpQuestion: answers[q.id].followUpQuestion }
          : {}),
        ...(answers[q.id].followUpTranscript
          ? { followUpTranscript: answers[q.id].followUpTranscript }
          : {}),
        ...(starSnapshotFromAnswer(q.id, answers[q.id])
          ? { starSnapshot: starSnapshotFromAnswer(q.id, answers[q.id])! }
          : {}),
        feedback: {
          strengths: (answers[q.id].feedback?.strengths ?? []).map((s) =>
            pickLocale(s),
          ),
          missing: (answers[q.id].feedback?.missing ?? []).map((s) =>
            pickLocale(s),
          ),
          suggestions: (answers[q.id].feedback?.suggestions ?? []).map((s) =>
            pickLocale(s),
          ),
          evidenceIds: (answers[q.id].feedback?.evidenceToUse ?? []).map(
            (e) => e.evidenceId,
          ),
        },
        status: answers[q.id].status,
      })),
      weakPoints: starWeakPoints,
      nextFocus: nextFocus.map((s) => pickLocale(s)),
    });
    if (savedId) {
      setSaved(true);
      // Local-first mode: mirror the completed session as a CareerEvent so
      // Journey / Current Focus can read it back from localStorage (the
      // session itself lives in the server's in-memory Interview Memory).
      if (isLocalJobId(job.id)) {
        const starMissingParts = answeredQuestions.flatMap(
          (q) =>
            starSnapshotFromAnswer(q.id, answers[q.id] ?? ({} as RoomAnswerState))
              ?.missingParts ?? [],
        );
        saveLocalEvent({
          id: newEventId("event"),
          eventType: "mock_interview",
          sourceType: "mock_interview",
          jobId: job.id,
          content: nextFocus[0] ?? starWeakPoints.map((w) => pick(w, locale))[0] ?? "",
          createdAt: new Date().toISOString(),
          metadata: {
            stage,
            answeredCount: answeredCount,
            weakPoints: starWeakPoints,
            nextFocus: nextFocus.map(pickLocale),
            starMissingParts,
          },
        });
      }
    } else {
      setSaveFailed(true);
    }
  };

  // ------------------------------------------------------------- start
  if (phase === "start") {
    return (
      <div className="mx-auto flex w-full max-w-[45rem] flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("jobs.mock.title")}
          </p>
          <h1 className="font-serif text-page font-medium text-ink">
            {company} · {jobTitle}
          </h1>
        </header>

        <dl className="flex flex-col gap-5 border-t border-line pt-8">
          <Row
            label={t("jobs.interview.context.stage")}
            value={t(stageKeys[stage])}
          />
          <Row
            label={t("jobs.mock.start.count")}
            value={t("jobs.mock.start.count.value", { count: total })}
          />
          <Row
            label={t("jobs.mock.start.duration")}
            value={t("jobs.mock.start.duration.value")}
          />
          {focusTitles.length > 0 ? (
            <div className="flex flex-col gap-2">
              <dt className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
                {t("jobs.mock.start.focus")}
              </dt>
              <dd className="text-body text-ink">
                {focusTitles
                  .slice(0, 4)
                  .map((f) => pick(f, locale))
                  .join(" · ")}
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="text-meta text-ink-muted">
          {t("jobs.mock.start.note")}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={() => setPhase("session")}>
            {t("jobs.mock.start.cta")}
          </Button>
          <Link
            href={`/interview/${job.id}?tab=prepare`}
            className="text-meta text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            {t("jobs.mock.backToPrep")}
          </Link>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------- summary
  if (phase === "summary") {
    return (
      <div className="mx-auto flex w-full max-w-[45rem] flex-col gap-10">
        <header>
          <h1 className="font-serif text-page font-medium text-ink">
            {t("jobs.mock.summary.title")}
          </h1>
        </header>

        <div className="flex gap-10 border-t border-line pt-8">
          <SummaryStat
            label={t("jobs.mock.summary.answered")}
            value={answeredCount}
          />
          <SummaryStat
            label={t("jobs.mock.summary.skipped")}
            value={skippedCount}
          />
        </div>

        {starReflection ? (
          <section className="flex flex-col gap-3 border-t border-line pt-8">
            <h2 className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
              {t("jobs.mock.summary.star")}
            </h2>
            <ul className="flex flex-col gap-2" role="list">
              {starReflection.rows.map((row) => (
                <li
                  key={row.part}
                  className="flex items-baseline gap-3 text-body text-ink"
                >
                  <span className="w-4 shrink-0 font-medium">
                    {row.letter}
                  </span>
                  <span className="text-ink-muted">{row.label}</span>
                  <span className="text-meta text-ink-faint">{row.note}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <SummaryList
          label={t("jobs.mock.summary.evidence")}
          items={evidenceUsed.map((e) => pick(e.title, locale))}
          empty={t("jobs.mock.session.evidenceEmpty")}
        />
        <SummaryList
          label={t("jobs.mock.summary.next")}
          items={nextFocus}
          ordered
          empty={t("jobs.mock.summary.nextEmpty")}
        />

        <div className="flex flex-col gap-4 border-t border-line pt-8">
          {saved ? (
            <p className="text-meta text-ink-muted">
              {t("jobs.mock.summary.saved")}
            </p>
          ) : null}
          {saveFailed ? (
            <p className="text-meta text-ink-muted">
              {t("jobs.mock.summary.saveFailed")}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4">
            {!saved ? (
              <Button size="lg" onClick={handleSaveSession}>
                {t("jobs.mock.summary.save")}
              </Button>
            ) : null}
            <ButtonLink
              href={`/interview/${job.id}?tab=review`}
              variant={saved ? "primary" : "secondary"}
              size="lg"
            >
              {t("jobs.mock.summary.goReview")}
            </ButtonLink>
            <Link
              href={`/interview/${job.id}?tab=prepare`}
              className="text-meta text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              {t("jobs.mock.summary.goPrep")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------- session (the room)
  if (!current) return null;

  return (
    <div className="mx-auto flex w-full max-w-[45rem] flex-col gap-10">
      {/* progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-meta tabular-nums text-ink-muted">
            {index + 1} / {total}
          </span>
          <Link
            href={`/interview/${job.id}?tab=prepare`}
            className="text-meta text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            {t("jobs.mock.backToPrep")}
          </Link>
        </div>
        <div className="h-px w-full bg-line" role="presentation">
          <div
            className="h-px bg-ink transition-[width] duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <InterviewRoom
        key={current.id}
        jobId={job.id}
        question={current}
        evidence={evidence}
        stories={stories}
        savedAnswer={answers[current.id]}
        locale={locale}
        isFirst={index === 0}
        isLast={index + 1 >= total}
        onAnswerChange={(answer) => setAnswer(current.id, answer)}
        onAnswerReset={() => resetAnswer(current.id)}
        onConfirm={goNext}
        onPrev={() => setIndex((i) => Math.max(0, i - 1))}
        onSkip={handleSkip}
      />
    </div>
  );
}

// --- session → memory helpers ----------------------------------------------

function pickLocale(text: string): LocalizedText {
  // Session strings were generated in the active locale; keep them verbatim
  // in both slots so the in-memory store round-trips losslessly.
  return { "zh-CN": text, en: text };
}

function starSnapshotFromAnswer(
  questionId: string,
  answer: RoomAnswerState,
): StarSnapshot | undefined {
  const review = answer.feedback?.frameworkReview;
  if (!review || review.framework !== "STAR") return undefined;
  const status = (key: StarPart) =>
    review.aspects.find((a) => a.key === key)?.status ?? "missing";
  const missingParts = (["situation", "task", "action", "result"] as StarPart[]).filter(
    (part) => status(part) === "missing",
  );
  return {
    questionId,
    situation: status("situation"),
    task: status("task"),
    action: status("action"),
    result: status("result"),
    missingParts,
    userConfirmed: true,
  };
}

/** Weak-point lines for Interview Memory, e.g. "项目回答缺少 Result". */
function collectStarWeakPoints(
  questions: SessionQuestion[],
  answers: Record<string, RoomAnswerState>,
  locale: Locale,
): LocalizedText[] {
  const zh = locale === "zh-CN";
  const counts = new Map<StarPart, number>();
  for (const q of questions) {
    const snapshot = starSnapshotFromAnswer(q.id, answers[q.id] ?? ({} as RoomAnswerState));
    for (const part of snapshot?.missingParts ?? []) {
      counts.set(part, (counts.get(part) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([part, count]) => {
      const label =
        part === "situation"
          ? "Situation"
          : part === "task"
            ? "Task"
            : part === "action"
              ? "Action"
              : "Result";
      return zh
        ? { "zh-CN": `${label} 缺失（${count} 个回答）`, en: `${label} missing (${count} answers)` }
        : { "zh-CN": `${label} 缺失（${count} 个回答）`, en: `${label} missing in ${count} answer(s)` };
    });
}

function buildStarReflection(
  questions: SessionQuestion[],
  answers: Record<string, RoomAnswerState>,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): {
  rows: { part: StarPart; letter: string; label: string; note: string }[];
} | null {
  const parts: StarPart[] = ["situation", "task", "action", "result"];
  const counts = new Map<StarPart, { clear: number; partial: number; missing: number }>();
  for (const q of questions) {
    const snapshot = starSnapshotFromAnswer(q.id, answers[q.id] ?? ({} as RoomAnswerState));
    if (!snapshot) continue;
    for (const part of parts) {
      const bucket = counts.get(part) ?? { clear: 0, partial: 0, missing: 0 };
      bucket[snapshot[part]] += 1;
      counts.set(part, bucket);
    }
  }
  if (counts.size === 0) return null;

  const letters: Record<StarPart, string> = {
    situation: "S",
    task: "T",
    action: "A",
    result: "R",
  };
  const rows = parts.map((part) => {
    const bucket = counts.get(part) ?? { clear: 0, partial: 0, missing: 0 };
    return {
      part,
      letter: letters[part],
      label: t(starPartSummaryKeys[part]),
      note: t("jobs.mock.summary.star.line", {
        clear: bucket.clear,
        partial: bucket.partial,
        missing: bucket.missing,
      }),
    };
  });
  return { rows };
}

// --- subcomponents ---------------------------------------------------------

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <dt className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </dt>
      <dd className="text-body text-ink">{value}</dd>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </span>
      <span className="text-title font-medium tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}

function SummaryList({
  label,
  items,
  empty,
  ordered,
}: {
  label: string;
  items: string[];
  empty?: string;
  ordered?: boolean;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-8">
      <h2 className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </h2>
      {items.length === 0 && empty ? (
        <p className="text-meta text-ink-faint">{empty}</p>
      ) : (
        <Tag className="flex flex-col gap-2" role="list">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-body text-ink"
            >
              {ordered ? (
                <span className="text-meta tabular-nums text-ink-faint">
                  {i + 1}.
                </span>
              ) : (
                <span
                  aria-hidden
                  className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
                />
              )}
              <span>{item}</span>
            </li>
          ))}
        </Tag>
      )}
    </section>
  );
}
