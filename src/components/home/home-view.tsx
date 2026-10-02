"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { InterviewStage, JobStatus, LocalizedText } from "@/types";

export interface HomeInterview {
  jobId: string;
  company: LocalizedText;
  role: LocalizedText;
  status: JobStatus;
  stage: InterviewStage;
  /** ISO date + optional time from the job's next action, if any. */
  date?: string;
  time?: string;
  /** One-line current focus, from the job's own preparation. */
  focus?: LocalizedText;
}

export interface HomeLearning {
  jobId: string;
  company: LocalizedText;
  role: LocalizedText;
  kind: "mock" | "real";
  date: string;
  text: LocalizedText;
}

export interface HomeViewProps {
  interviews: HomeInterview[];
  /** Latest valuable line from a review / debrief. Omit when empty. */
  learning?: HomeLearning;
  locale: Locale;
}

const stageKeys: Record<InterviewStage, TranslationKey> = {
  screening: "jobs.interview.context.stage.screening",
  first_round: "jobs.interview.context.stage.first_round",
  second_round: "jobs.interview.context.stage.second_round",
  final_round: "jobs.interview.context.stage.final_round",
  other: "jobs.interview.context.stage.other",
};

/**
 * Home — a short status page built around exactly three things:
 *
 *   1. Next Action   — the upcoming / active interview, highest weight.
 *   2. Interviews    — 2-3 rows linking into /interview/[jobId].
 *   3. Recent learning — one honest line from the latest review.
 *
 * Nothing else: no stats strips, no thought bubbles, no journey timeline,
 * no job-management entries. Reading is via links only — Home owns no
 * interview state.
 */
export function HomeView({ interviews, learning, locale }: HomeViewProps) {
  const { t } = useTranslation();

  // Next action: interviewing jobs first, soonest event wins.
  const interviewing = interviews.filter((i) => i.status === "interviewing");
  const pool = interviewing.length > 0 ? interviewing : interviews;
  const next = [...pool].sort((a, b) =>
    (a.date ?? "9999").localeCompare(b.date ?? "9999"),
  )[0];

  return (
    <div className="flex flex-col gap-14 md:gap-20">
      {/* --------------------------------------------- 1 · next action */}
      <section className="flex flex-col gap-4">
        <SectionLabel>{t("home.next.title")}</SectionLabel>
        {next ? (
          <div className="flex flex-col gap-4 rounded-field border border-line-strong bg-canvas-raised px-6 py-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-item font-semibold text-ink">
                {pick(next.company, locale)} · {pick(next.role, locale)}
              </p>
              <span className="text-meta text-ink-faint">
                {t(stageKeys[next.stage])}
                {next.date ? ` · ${next.date}${next.time ? ` ${next.time}` : ""}` : ""}
              </span>
            </div>
            {next.focus ? (
              <p className="text-meta text-ink-muted">
                {t("home.next.focus")} · {pick(next.focus, locale)}
              </p>
            ) : null}
            <div>
              <ButtonLink href={`/interview/${next.jobId}?tab=prepare`} variant="primary">
                <span className="group inline-flex items-center gap-2">
                  {t("home.next.cta")}
                  <ArrowRightIcon className="size-4 transition-transform duration-200 ease-calm group-hover:translate-x-0.5" />
                </span>
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-field border border-line bg-canvas-raised px-6 py-6">
            <p className="text-body text-ink">{t("home.next.empty")}</p>
            <div>
              <ButtonLink href="/interview">{t("home.next.emptyCta")}</ButtonLink>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------ 2 · interviews */}
      {interviews.length > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionLabel>{t("home.upcoming.title")}</SectionLabel>
          <ul className="flex flex-col" role="list">
            {interviews.slice(0, 3).map((item) => (
              <li key={item.jobId} className="border-t border-line py-4 first:border-t-0">
                <Link
                  href={`/interview/${item.jobId}`}
                  className="flex flex-wrap items-baseline justify-between gap-2"
                >
                  <span className="text-item font-semibold text-ink">
                    {pick(item.company, locale)} · {pick(item.role, locale)}
                  </span>
                  <span className="text-meta text-ink-faint">
                    {t(stageKeys[item.stage])}
                    {item.date ? ` · ${item.date}${item.time ? ` ${item.time}` : ""}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ------------------------------------- 3 · recent learning */}
      {learning ? (
        <section className="flex flex-col gap-4">
          <SectionLabel>{t("home.learning.title")}</SectionLabel>
          <div className="flex flex-col gap-3 border-t border-line pt-5">
            <p className="text-meta text-ink-faint">
              {t("home.learning.from")}{" "}
              {pick(learning.company, locale)} · {pick(learning.role, locale)}{" "}
              （
              {t(
                learning.kind === "mock"
                  ? "jobs.review.type.mock"
                  : "jobs.review.type.real",
              )}
              {learning.date ? ` · ${learning.date}` : ""}
              ）
            </p>
            <p className="max-w-[45rem] text-lead text-ink">{pick(learning.text, locale)}</p>
            <Link
              href={`/interview/${learning.jobId}?tab=review`}
              className="text-meta text-ink underline-offset-4 transition-colors hover:underline"
            >
              {t("home.learning.cta")}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
