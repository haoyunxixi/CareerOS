"use client";

import { useState } from "react";
import { DebriefWorkspace } from "@/components/jobs/DebriefWorkspace";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type {
  InterviewDebrief,
  InterviewSession,
  InterviewStage,
} from "@/types";

export interface JobReviewTabProps {
  jobId: string;
  /** Stage pre-selected for a new real-interview debrief. */
  stage: InterviewStage;
  sessions: InterviewSession[];
  /** Confirmed debriefs (mock + saved real-interview ones). */
  debriefs: InterviewDebrief[];
  locale: Locale;
}

const stageKeys: Record<InterviewStage, TranslationKey> = {
  screening: "jobs.interview.context.stage.screening",
  first_round: "jobs.interview.context.stage.first_round",
  second_round: "jobs.interview.context.stage.second_round",
  final_round: "jobs.interview.context.stage.final_round",
  other: "jobs.interview.context.stage.other",
};

/** Rows shown per section before collapsing the rest. */
const MAX_ROWS = 2;

/**
 * Review — this job's interview journal, split into two light sections:
 * mock sessions and real-interview debriefs. Both share the same row /
 * details components so the two flows never grow two visual systems. The
 * real-interview section hosts the Debrief workspace (paste / upload →
 * analyse → edit → save).
 */
export function JobReviewTab({
  jobId,
  stage,
  sessions,
  debriefs,
  locale,
}: JobReviewTabProps) {
  const { t } = useTranslation();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [autoFilePicker, setAutoFilePicker] = useState(false);
  const [savedDebriefs, setSavedDebriefs] = useState<InterviewDebrief[]>([]);

  const allDebriefs = [
    ...savedDebriefs,
    ...debriefs.filter((d) => !savedDebriefs.some((s) => s.id === d.id)),
  ];

  const latest = [...sessions, ...allDebriefs].sort((a, b) =>
    recordDate(b).localeCompare(recordDate(a)),
  )[0];

  const openWorkspace = (withFilePicker: boolean) => {
    setAutoFilePicker(withFilePicker);
    setWorkspaceOpen(true);
  };

  return (
    <div className="flex flex-col gap-12">
      <header className="max-w-[45rem]">
        <h2 className="text-title font-semibold text-ink">
          {t("jobs.review.title")}
        </h2>
        <p className="mt-3 text-body text-ink-muted">
          {t("jobs.review.note")}
        </p>
      </header>

      {/* ---------------------------------------- latest review summary */}
      {latest ? (
        <section className="flex flex-col gap-3 rounded-field border border-line bg-canvas-raised px-6 py-6">
          <SectionLabel>{t("jobs.review.latest.title")}</SectionLabel>
          <p className="text-item font-semibold text-ink">
            {t(stageKeys[latest.stage])} ·{" "}
            {t(
              "rawNotes" in latest
                ? "jobs.review.type.real"
                : "jobs.review.type.mock",
            )}
          </p>
          {latestSummaryLine(latest, locale) ? (
            <p className="text-meta text-ink-muted">
              {latestSummaryLine(latest, locale)}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* -------------------------------------------- mock interviews */}
      <section>
        <SectionLabel>{t("jobs.review.section.mock")}</SectionLabel>
        {sessions.length === 0 ? (
          <p className="mt-6 border-t border-line pt-5 text-meta text-ink-faint">
            {t("jobs.review.section.mock.empty")}
          </p>
        ) : (
          <SessionRows sessions={sessions} locale={locale} />
        )}
      </section>

      {/* ------------------------------------------- real interviews */}
      <section className="flex flex-col gap-8">
        <div>
          <SectionLabel>{t("jobs.review.section.real")}</SectionLabel>

          {allDebriefs.length > 0 ? (
            <DebriefRows debriefs={allDebriefs} locale={locale} />
          ) : workspaceOpen ? null : (
            <div className="mt-6 flex flex-col gap-5 border-t border-line pt-6">
              <div>
                <p className="text-item font-semibold text-ink">
                  {t("jobs.review.real.title")}
                </p>
                <p className="mt-2 max-w-xl text-meta text-ink-muted">
                  {t("jobs.review.real.note")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openWorkspace(false)}
                  className="h-9 rounded-btn bg-ink px-4 text-btn font-semibold text-canvas transition-opacity hover:opacity-80"
                >
                  {t("jobs.review.real.paste")}
                </button>
                <button
                  type="button"
                  onClick={() => openWorkspace(true)}
                  className="h-9 rounded-btn border border-line bg-canvas-raised px-4 text-btn font-semibold text-ink transition-colors hover:border-line-strong"
                >
                  {t("jobs.review.real.upload")}
                </button>
              </div>
            </div>
          )}
        </div>

        {workspaceOpen ? (
          <DebriefWorkspace
            jobId={jobId}
            locale={locale}
            defaultStage={stage}
            openFilePickerOnMount={autoFilePicker}
            onConfirm={(debrief) => {
              setSavedDebriefs((d) => [debrief, ...d]);
              setWorkspaceOpen(false);
            }}
          />
        ) : allDebriefs.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => openWorkspace(false)}
              className="h-9 rounded-btn border border-line bg-canvas-raised px-4 text-body font-medium text-ink transition-colors hover:border-line-strong"
            >
              {t("jobs.review.debrief.cta")}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

// --- rows -------------------------------------------------------------------

function SessionRows({
  sessions,
  locale,
}: {
  sessions: InterviewSession[];
  locale: Locale;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sessions : sessions.slice(0, MAX_ROWS);
  const rest = sessions.length - visible.length;

  return (
    <div>
      <ul className="flex flex-col" role="list">
        {visible.map((s) => (
          <li key={s.id} className="border-t border-line">
            <HistoryRow
              kind="mock"
              stage={s.stage}
              dateLabel={formatDate(s.startedAt)}
              statusKey="jobs.review.status.completed"
            >
              <SessionDetails session={s} locale={locale} />
            </HistoryRow>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-meta text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          {t("jobs.review.row.viewDetails")} · {rest}
        </button>
      ) : null}
    </div>
  );
}

function DebriefRows({
  debriefs,
  locale,
}: {
  debriefs: InterviewDebrief[];
  locale: Locale;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? debriefs : debriefs.slice(0, MAX_ROWS);
  const rest = debriefs.length - visible.length;

  return (
    <div>
      <ul className="flex flex-col" role="list">
        {visible.map((d) => (
          <li key={d.id} className="border-t border-line">
            <HistoryRow
              kind="real"
              stage={d.stage}
              dateLabel={d.occurredAt ? formatDate(d.occurredAt) : ""}
              statusKey={d.userConfirmed
                ? "jobs.review.status.debriefed"
                : "jobs.review.status.completed"}
            >
              <DebriefDetails debrief={d} locale={locale} />
            </HistoryRow>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-meta text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          {t("jobs.review.row.viewDetails")} · {rest}
        </button>
      ) : null}
    </div>
  );
}

function HistoryRow({
  kind,
  stage,
  dateLabel,
  statusKey,
  children,
}: {
  kind: "mock" | "real";
  stage: InterviewStage;
  dateLabel: string;
  statusKey: TranslationKey;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="py-7">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-item font-semibold text-ink">
          {t(stageKeys[stage])} ·{" "}
          {t(kind === "mock" ? "jobs.review.type.mock" : "jobs.review.type.real")}
        </span>
        <span className="text-meta text-ink-faint">{dateLabel}</span>
        <span className="text-meta text-ink-muted">{t(statusKey)}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-meta text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          {open
            ? t("jobs.review.row.hideDetails")
            : t("jobs.review.row.viewDetails")}
        </button>
      </div>
      {open ? children : null}
    </div>
  );
}

function SessionDetails({
  session,
  locale,
}: {
  session: InterviewSession;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const answered = session.answers.filter(
    (a) => a.status === "reviewed" || a.status === "recorded",
  );
  const skipped = session.answers.filter((a) => a.status === "skipped");

  // STAR reflection across this session's answers (no totals, no scores).
  const starParts = (["situation", "task", "action", "result"] as const).map(
    (part) => ({
      part,
      letter: part[0].toUpperCase(),
      counts: session.answers.reduce(
        (acc, a) => {
          const snapshot = a.starSnapshot;
          if (snapshot) acc[snapshot[part]] += 1;
          return acc;
        },
        { clear: 0, partial: 0, missing: 0 },
      ),
    }),
  );
  const hasStar = session.answers.some((a) => a.starSnapshot);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <p className="text-meta text-ink-muted">
        {t("jobs.review.row.answeredSkipped", {
          answered: answered.length,
          skipped: skipped.length,
        })}
      </p>
      <DetailList
        label={t("jobs.review.row.questions")}
        items={session.answers.map((a) => a.questionText
          ? pick(a.questionText, locale)
          : a.questionId)}
      />
      {hasStar ? (
        <div className="flex flex-col gap-2">
          <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("jobs.review.row.star")}
          </span>
          <ul className="flex flex-col gap-1.5" role="list">
            {starParts.map(({ part, letter, counts }) => (
              <li
                key={part}
                className="flex items-baseline gap-3 text-body text-ink"
              >
                <span className="w-4 shrink-0 font-medium">{letter}</span>
                <span className="text-ink-muted">{partLabel(part, locale)}</span>
                <span className="text-meta text-ink-faint">
                  {t("jobs.mock.summary.star.line", counts)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <DetailList
        label={t("jobs.review.row.strengths")}
        items={session.strengths.map((s) => pick(s, locale))}
      />
      <DetailList
        label={t("jobs.review.row.weak")}
        items={session.weakPoints.map((s) => pick(s, locale))}
      />
      <DetailList
        label={t("jobs.review.row.next")}
        items={session.nextFocus.map((s) => pick(s, locale))}
        ordered
      />
    </div>
  );
}

function partLabel(
  part: "situation" | "task" | "action" | "result",
  locale: Locale,
): string {
  const labels: Record<typeof part, Record<Locale, string>> = {
    situation: { "zh-CN": "背景", en: "Situation" },
    task: { "zh-CN": "任务", en: "Task" },
    action: { "zh-CN": "行动", en: "Action" },
    result: { "zh-CN": "结果", en: "Result" },
  };
  return labels[part][locale];
}

function DebriefDetails({
  debrief,
  locale,
}: {
  debrief: InterviewDebrief;
  locale: Locale;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-6 flex flex-col gap-6">
      <DetailList
        label={t("jobs.review.row.questions")}
        items={debrief.questions.map((q) => {
          const notes = q.notes ? ` — ${pick(q.notes, locale)}` : "";
          return `${pick(q.question, locale)}${notes}`;
        })}
        ordered
      />
      <DetailList
        label={t("jobs.review.row.weak")}
        items={debrief.weakPoints.map((s) => pick(s, locale))}
      />
      <DetailList
        label={t("jobs.review.result.signals")}
        items={debrief.interviewerSignals.map((s) => pick(s, locale))}
      />
      <DetailList
        label={t("jobs.review.row.next")}
        items={debrief.nextRoundFocus.map((s) => pick(s, locale))}
        ordered
      />
      {debrief.storyHints && debrief.storyHints.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("jobs.review.real.story.title")}
          </span>
          <ul className="flex flex-col gap-2" role="list">
            {debrief.storyHints.map((hint) => (
              <li
                key={hint.storyId}
                className="flex flex-wrap items-baseline justify-between gap-3"
              >
                <span className="text-body text-ink-muted">
                  {pick(hint.reason, locale)}
                </span>
                <a
                  href={`/resume?story=${hint.storyId}`}
                  className="text-meta text-ink underline-offset-4 transition-colors hover:underline"
                >
                  {t("jobs.review.real.story.cta")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DetailList({
  label,
  items,
  ordered,
}: {
  label: string;
  items: string[];
  ordered?: boolean;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <div className="flex flex-col gap-2">
      <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </span>
      {items.length === 0 ? (
        <p className="text-meta text-ink-faint">—</p>
      ) : (
        <Tag className="flex flex-col gap-1.5" role="list">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-body text-ink-muted"
            >
              {ordered ? (
                <span className="text-meta tabular-nums text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
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
    </div>
  );
}

// --- helpers ---------------------------------------------------------------

/** Sortable date for either record kind. */
function recordDate(record: InterviewSession | InterviewDebrief): string {
  return "startedAt" in record
    ? record.startedAt
    : (record.occurredAt ?? "");
}

/** One honest summary line: the first weak point or next focus. */
function latestSummaryLine(
  record: InterviewSession | InterviewDebrief,
  locale: Locale,
): string {
  if ("rawNotes" in record) {
    if (record.nextRoundFocus.length > 0) {
      return pick(record.nextRoundFocus[0], locale);
    }
    if (record.weakPoints.length > 0) {
      return pick(record.weakPoints[0], locale);
    }
    return "";
  }
  if (record.nextFocus.length > 0) return pick(record.nextFocus[0], locale);
  if (record.weakPoints.length > 0) return pick(record.weakPoints[0], locale);
  return "";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
