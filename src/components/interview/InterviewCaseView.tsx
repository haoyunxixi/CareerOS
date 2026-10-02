"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { Tabs } from "@/components/ui/Tabs";
import { JobJdAnalysisTab } from "@/components/jobs/JobJdAnalysisTab";
import { JobMatchTab } from "@/components/jobs/JobMatchTab";
import { JobInterviewTab } from "@/components/jobs/JobInterviewTab";
import { JobReviewTab } from "@/components/jobs/JobReviewTab";
import { MockInterviewEntry } from "@/components/interview/MockInterviewEntry";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type {
  InterviewDebrief,
  InterviewPreparation,
  InterviewSession,
  InterviewStage,
  JdAnalysis,
  Job,
  JobMatch,
  LocalizedText,
} from "@/types";

export type CaseTabId = "analysis" | "prepare" | "review";

export interface InterviewCaseViewProps {
  job: Job;
  analysis: JdAnalysis;
  stage: InterviewStage;
  scheduledAt: string;
  focusTitles: LocalizedText[];
  match?: JobMatch;
  interview?: InterviewPreparation;
  review?: {
    sessions: InterviewSession[];
    debriefs: InterviewDebrief[];
  };
  /** `?tab=` selection from the URL. */
  initialTab?: CaseTabId;
  /** False when the job has no JD text — the prepare tab then asks for
   *  the JD instead of showing generic filler. */
  hasJd?: boolean;
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
 * /interview/[jobId] — one interview case inside the interview area.
 *
 * A thin UI wrapper: the same jobId, the same existing data (JD analysis,
 * match, preparation, review) and components as the job workspace — just
 * re-framed for the new IA: back link to /interview, one primary CTA into
 * the shared mock engine at /interview/[jobId]/mock, and exactly three
 * tabs: 岗位分析 / 面试准备 / 面试复盘. No second engine, no copied data.
 */
export function InterviewCaseView({
  job,
  analysis,
  stage,
  scheduledAt,
  focusTitles,
  match,
  interview,
  review,
  initialTab,
  hasJd = true,
  locale,
}: InterviewCaseViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CaseTabId>(initialTab ?? "analysis");

  // Reset when the route navigates to a different case.
  useEffect(() => {
    setActiveTab(initialTab ?? "analysis");
  }, [job.id, initialTab]);

  const when =
    job.nextAction?.date ??
    (scheduledAt ? scheduledAt.slice(0, 10) : undefined);

  const items: { id: CaseTabId; label: string; content: React.ReactNode }[] = [
    {
      id: "analysis",
      label: t("interview.case.tab.analysis"),
      content: (
        <CaseAnalysisTab
          analysis={analysis}
          match={match}
          locale={locale}
        />
      ),
    },
    {
      id: "prepare",
      label: t("interview.case.tab.prepare"),
      content: interview ? (
        <div className="flex flex-col gap-12">
          <JobInterviewTab
            job={job}
            match={
              match ?? {
                jobId: job.id,
                evidence: [],
                matches: [],
                strengths: [],
                gaps: [],
                nextActions: [],
              }
            }
            preparation={interview}
            locale={locale}
          />
          <MockInterviewEntry jobId={job.id} />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <header className="max-w-2xl">
            <h2 className="text-title font-semibold text-ink">
              {t("jobs.interview.title")}
            </h2>
            <p className="mt-3 text-body text-ink-muted">
              {hasJd
                ? t("jobs.interview.minimalNote")
                : t("interview.prepare.needsJd")}
            </p>
          </header>
          {hasJd ? <MockInterviewEntry jobId={job.id} /> : null}
        </div>
      ),
    },
    {
      id: "review",
      label: t("interview.case.tab.review"),
      content: (
        <JobReviewTab
          jobId={job.id}
          stage={stage}
          sessions={review?.sessions ?? []}
          debriefs={review?.debriefs ?? []}
          locale={locale}
        />
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-12 md:gap-14">
      {/* ------------------------------------------------------ back + case */}
      <div className="flex flex-col gap-6">
        <Link
          href="/interview"
          className="text-meta text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          ← {t("interview.case.back")}
        </Link>

        <header className="flex flex-col gap-3">
          <h1 className="font-serif text-page font-medium text-ink">
            {pick(job.company, locale)} · {pick(job.title, locale)}
          </h1>
          <p className="text-meta text-ink-faint">
            {t(stageKeys[stage])}
            {when
              ? ` · ${when}${job.nextAction?.time ? ` ${job.nextAction.time}` : ""}`
              : ""}
          </p>
          {focusTitles.length > 0 ? (
            <p className="text-meta text-ink-muted">
              {t("interview.center.review.currentFocus")} ·{" "}
              {focusTitles.slice(0, 3).map((f) => pick(f, locale)).join(" · ")}
            </p>
          ) : null}
        </header>

        <div>
          <ButtonLink href={`/interview/${job.id}/mock`} variant="primary">
            {t("jobs.interview.startMock.cta")}
          </ButtonLink>
        </div>
      </div>

      <Tabs
        items={items}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as CaseTabId)}
        ariaLabel={t("interview.case.tabsAria")}
      />
    </div>
  );
}

// ------------------------------------------------------------------ analysis ---

/**
 * Summary-first: what this job weighs most (JD), where the user is already
 * strong, and the biggest evidence gaps. Full JD analysis and the match
 * table stay behind native expand/collapse.
 */
function CaseAnalysisTab({
  analysis,
  match,
  locale,
}: {
  analysis: JdAnalysis;
  match?: JobMatch;
  locale: Locale;
}) {
  const { t } = useTranslation();

  const takeaways = analysis.mostImportant
    .map((m) => pick(m, locale))
    .slice(0, 5);
  const strengths = (match?.matches ?? [])
    .filter((m) => m.status === "supported")
    .slice(0, 3)
    .map((m) => pick(m.requirement, locale));
  const risks = (match?.matches ?? [])
    .filter((m) => m.status === "gap")
    .slice(0, 3)
    .map((m) => pick(m.requirement, locale));
  const strong = match?.matches.filter((m) => m.status === "supported").length;
  const partial = match?.matches.filter((m) => m.status === "partial").length;
  const gaps = match?.matches.filter((m) => m.status === "gap").length;

  return (
    <div className="flex flex-col gap-12">
      <section>
        <SectionLabel>{t("jobs.detail.analysis.takeaways")}</SectionLabel>
        <ol className="mt-5 flex flex-col gap-3">
          {takeaways.map((line, i) => (
            <li
              key={i}
              className="flex gap-4 border-t border-line pt-3 text-body text-ink first:border-t-0 first:pt-0"
            >
              <span
                aria-hidden
                className="font-mono text-meta tabular-nums text-ink-faint"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </section>

      {match ? (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <SectionLabel>{t("interview.case.analysis.strengths")}</SectionLabel>
            {strengths.length > 0 ? (
              <ul className="flex flex-col gap-2" role="list">
                {strengths.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-body text-ink"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-meta text-ink-faint">—</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>{t("interview.case.analysis.risks")}</SectionLabel>
            {risks.length > 0 ? (
              <ul className="flex flex-col gap-2" role="list">
                {risks.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-body text-ink"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-meta text-ink-faint">—</p>
            )}
          </div>

          <p className="text-body text-ink-muted">
            {t("jobs.detail.analysis.matchSummary", {
              strong: String(strong ?? 0),
              partial: String(partial ?? 0),
              gaps: String(gaps ?? 0),
            })}
          </p>
        </div>
      ) : null}

      <details className="border-t border-line pt-8">
        <summary className="cursor-pointer select-none text-body font-medium text-ink">
          {t("jobs.detail.analysis.jdExpand")}
        </summary>
        <div className="mt-8">
          <JobJdAnalysisTab analysis={analysis} locale={locale} />
        </div>
      </details>

      {match ? (
        <details className="border-t border-line pt-8">
          <summary className="cursor-pointer select-none text-body font-medium text-ink">
            {t("jobs.detail.analysis.matchExpand")}
          </summary>
          <div className="mt-8">
            <JobMatchTab match={match} locale={locale} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
