"use client";

import { useEffect, useState } from "react";
import { JobDetailHeader } from "@/components/jobs/JobDetailHeader";
import { JobJdAnalysisTab } from "@/components/jobs/JobJdAnalysisTab";
import { JobMatchTab } from "@/components/jobs/JobMatchTab";
import { JobResumeTab } from "@/components/jobs/JobResumeTab";
import { JobInterviewTab } from "@/components/jobs/JobInterviewTab";
import { JobReviewTab } from "@/components/jobs/JobReviewTab";
import { MockInterviewEntry } from "@/components/interview/MockInterviewEntry";
import { SectionLabel } from "@/components/ui/section-label";
import { Tabs } from "@/components/ui/Tabs";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type {
  CareerProfile,
  InterviewDebrief,
  InterviewPreparation,
  InterviewSession,
  JdAnalysis,
  Job,
  JobMatch,
  JobStatus,
  ResumeRecommendation,
} from "@/types";

export interface JobDetailViewProps {
  job: Job;
  analysis: JdAnalysis;
  match?: JobMatch;
  resume?: ResumeRecommendation[];
  profile?: CareerProfile;
  interview?: InterviewPreparation;
  /** Review history for the review tab. */
  review?: {
    sessions: InterviewSession[];
    debriefs: InterviewDebrief[];
  };
  /** Server-side tab selection (`?tab=`), e.g. from the mock interview
   *  summary back into review. Legacy ids map onto the four tabs. */
  initialTab?: TabId;
  locale: Locale;
}

/**
 * One interview, four top-level tabs: 分析 Analysis (JD + Match),
 * 准备 Preparation, 模拟 Mock, 复盘 Review. The job still uses the existing
 * Job / jobId structure as its underlying context — only the tab surface
 * converged.
 */
export type TabId = "analysis" | "prepare" | "mock" | "review";

export function JobDetailView({
  job,
  analysis,
  match,
  resume,
  profile,
  interview,
  review,
  initialTab,
  locale,
}: JobDetailViewProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? "analysis");

  // Reset local state when the route navigates to a different job.
  useEffect(() => {
    setStatus(job.status);
    setActiveTab(initialTab ?? "analysis");
  }, [job.id, job.status, initialTab]);

  const display = {
    company: pick(job.company, locale),
    title: pick(job.title, locale),
    location: job.location ? pick(job.location, locale) : undefined,
  };

  const items: { id: TabId; label: string; content: React.ReactNode }[] = [
    {
      id: "analysis",
      label: t("jobs.detail.tab.analysis"),
      content: (
        <AnalysisTab
          analysis={analysis}
          match={match}
          locale={locale}
        />
      ),
    },
    {
      id: "prepare",
      label: t("jobs.detail.tab.prepare"),
      content:
        interview && match ? (
          <div className="flex flex-col gap-12">
            <JobInterviewTab
              job={job}
              match={match}
              preparation={interview}
              locale={locale}
            />
            {resume && resume.length > 0 && profile ? (
              <JobResumeTab
                job={job}
                match={match}
                profile={profile}
                recommendations={resume}
                locale={locale}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <header className="max-w-2xl">
              <h2 className="text-title font-semibold text-ink">
                {t("jobs.interview.title")}
              </h2>
              <p className="mt-3 text-body text-ink-muted">
                {t("jobs.interview.minimalNote")}
              </p>
            </header>
          </div>
        ),
    },
    {
      id: "mock",
      label: t("jobs.detail.tab.mock"),
      content: (
        <div className="flex flex-col gap-8">
          <header className="max-w-2xl">
            <h2 className="text-title font-semibold text-ink">
              {t("jobs.interview.title")}
            </h2>
            <p className="mt-3 text-body text-ink-muted">
              {t("jobs.interview.minimalNote")}
            </p>
          </header>
          <MockInterviewEntry jobId={job.id} />
        </div>
      ),
    },
    {
      id: "review",
      label: t("jobs.detail.tab.review"),
      content: (
        <JobReviewTab
          jobId={job.id}
          stage={interview?.stage ?? "first_round"}
          sessions={review?.sessions ?? []}
          debriefs={review?.debriefs ?? []}
          locale={locale}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-12 md:gap-14">
      <JobDetailHeader
        job={job}
        display={display}
        status={status}
        onStatusChange={setStatus}
      />

      <Tabs
        items={items}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        ariaLabel={t("jobs.detail.tabsAria")}
      />
    </div>
  );
}

// ---------------------------------------------------------------- analysis ---

/**
 * Analysis tab — summary first: the three heaviest JD signals plus the
 * evidence status counts. The full JD analysis and match tables stay behind
 * native expand/collapse, so nothing floods the first screen.
 */
function AnalysisTab({
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
    .slice(0, 3);
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
        {match ? (
          <p className="mt-6 text-body text-ink-muted">
            {t("jobs.detail.analysis.matchSummary", {
              strong: String(strong ?? 0),
              partial: String(partial ?? 0),
              gaps: String(gaps ?? 0),
            })}
          </p>
        ) : null}
      </section>

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
