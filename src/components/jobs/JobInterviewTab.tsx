"use client";

import { useCallback, useState } from "react";
import { PreparationChecklist } from "@/components/jobs/PreparationChecklist";
import { PrepPack } from "@/components/jobs/PrepPack";
import { QuestionPlan } from "@/components/jobs/QuestionPlan";
import { QuestionsForInterviewer } from "@/components/jobs/QuestionsForInterviewer";
import { RecommendedStories } from "@/components/jobs/RecommendedStories";
import { SelfIntroduction } from "@/components/jobs/SelfIntroduction";
import { TodaysFocus } from "@/components/jobs/TodaysFocus";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type {
  InterviewPreparation,
  InterviewQuestionStatus,
  Job,
  JobMatch,
} from "@/types";

export interface JobInterviewTabProps {
  job: Job;
  match: JobMatch;
  preparation: InterviewPreparation;
  locale: Locale;
}

/**
 * Top-level client wrapper for the Interview tab. Holds the editable copy
 * of `InterviewPreparation`; nothing persists across reloads in V1.
 *
 * V2 — the page is converged into 5 default areas so it stays scannable:
 *   1. 本轮准备重点 (max 3 focuses)
 *   2. AI 自我介绍 (draft with AI → editable)
 *   3. 重点问题 (top 3 + full plan behind disclosure)
 *   4. 建议调用的故事 (max 3, full stories live under /resume)
 *   5. 准备完成度 (summary + checklist behind disclosure)
 *
 * The preparation data itself is built per job by the server from the
 * job's own JD / Match / profile context — one flow for every job.
 */
export function JobInterviewTab({
  job,
  match,
  preparation: initial,
  locale,
}: JobInterviewTabProps) {
  const { t } = useTranslation();
  const [prep, setPrep] = useState<InterviewPreparation>(initial);

  // --- question handlers --------------------------------------------
  const handleAnswerDraftChange = useCallback(
    (questionId: string, text: string) => {
      setPrep((p) => ({
        ...p,
        questions: p.questions.map((q) =>
          q.id === questionId
            ? { ...q, answerDraft: text, status: deriveStatus(text, q.status) }
            : q,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  const handleStatusChange = useCallback(
    (questionId: string, status: InterviewQuestionStatus) => {
      setPrep((p) => ({
        ...p,
        questions: p.questions.map((q) =>
          q.id === questionId ? { ...q, status } : q,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  // --- self introduction --------------------------------------------
  const handleSelfIntroChange = useCallback((text: string) => {
    setPrep((p) => ({
      ...p,
      selfIntroduction: { ...p.selfIntroduction, shortDraft: text },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // --- checklist ----------------------------------------------------
  const handleChecklistToggle = useCallback((itemId: string) => {
    setPrep((p) => ({
      ...p,
      checklist: p.checklist.map((c) =>
        c.id === itemId ? { ...c, done: !c.done } : c,
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // --- interviewer questions ----------------------------------------
  const handleAddInterviewerQuestion = useCallback((text: string) => {
    setPrep((p) =>
      p.questionsForInterviewer.includes(text)
        ? p
        : {
            ...p,
            questionsForInterviewer: [...p.questionsForInterviewer, text],
            updatedAt: new Date().toISOString(),
          },
    );
  }, []);

  const handleRemoveInterviewerQuestion = useCallback((index: number) => {
    setPrep((p) => ({
      ...p,
      questionsForInterviewer: p.questionsForInterviewer.filter(
        (_, i) => i !== index,
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // --- render -------------------------------------------------------
  const topQuestions = prep.questions.slice(0, 3);
  const recommendedStories = prep.stories.filter((s) =>
    prep.selfIntroduction.recommendedStoryIds.includes(s.id),
  );
  const doneCount = prep.checklist.filter((c) => c.done).length;

  return (
    <div className="flex flex-col gap-12">
      <header className="max-w-2xl">
        <h2 className="text-title font-semibold text-ink">
          {t("jobs.interview.title")}
        </h2>
        <p className="mt-3 text-body text-ink-muted">
          {t("jobs.interview.note")}
        </p>
      </header>

      {/* ------------------------------------- 1 · 本轮准备重点 */}
      <TodaysFocus focuses={prep.focuses.slice(0, 3)} locale={locale} />

      {/* ------------------------------------- 2 · AI 自我介绍 */}
      <SelfIntroduction
        draft={prep.selfIntroduction.shortDraft}
        onDraftChange={handleSelfIntroChange}
        recommendedStoryIds={prep.selfIntroduction.recommendedStoryIds}
        stories={prep.stories}
        locale={locale}
        jobId={job.id}
      />

      {/* ------------------------------------- 3 · 重点问题 */}
      <section>
        <h3 className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("jobs.interview.questions.title")}
        </h3>
        <ul className="mt-5 flex flex-col" role="list">
          {topQuestions.map((q) => (
            <li
              key={q.id}
              className="flex flex-col gap-2 border-t border-line py-5 first:border-t-0 first:pt-0"
            >
              <p className="text-body text-ink">{pick(q.question, locale)}</p>
              <p className="text-meta text-ink-muted">
                {pick(q.reason, locale)}
              </p>
            </li>
          ))}
        </ul>
        {prep.questions.length > 3 ? (
          <details className="mt-2">
            <summary className="cursor-pointer select-none text-meta text-ink underline-offset-4 hover:underline">
              {t("jobs.interview.questions.expandAll")} ↓
            </summary>
            <div className="mt-8">
              <QuestionPlan
                questions={prep.questions}
                requirements={match.matches}
                evidence={match.evidence}
                locale={locale}
                onAnswerDraftChange={handleAnswerDraftChange}
                onStatusChange={handleStatusChange}
              />
            </div>
          </details>
        ) : null}
      </section>

      {/* ------------------------------------- 4 · 建议调用的故事 */}
      <RecommendedStories
        stories={recommendedStories.length > 0
          ? recommendedStories
          : prep.stories}
        match={match}
        locale={locale}
      />

      {/* ------------------------------------- 4.5 · 角色化 Prep Pack */}
      {prep.prepPack ? <PrepPack pack={prep.prepPack} locale={locale} /> : null}

      {/* ------------------------------------- 5 · 准备完成度 */}
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("jobs.interview.checklist.summary")}
          </h3>
          <span className="text-body tabular-nums text-ink">
            {doneCount} / {prep.checklist.length}
          </span>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer select-none text-meta text-ink underline-offset-4 hover:underline">
            {t("jobs.interview.checklist.expand")} ↓
          </summary>
          <div className="mt-8 flex flex-col gap-12">
            <PreparationChecklist
              items={prep.checklist}
              locale={locale}
              onToggle={handleChecklistToggle}
            />
            <QuestionsForInterviewer
              questions={prep.questionsForInterviewer}
              suggestions={prep.interviewerQuestionSuggestions}
              locale={locale}
              onAdd={handleAddInterviewerQuestion}
              onRemove={handleRemoveInterviewerQuestion}
            />
          </div>
        </details>
      </section>
    </div>
  );
}

/**
 * When the user types into a draft, promote "not_started" → "drafting"
 * automatically. Never auto-promote to "ready" — that is a deliberate
 * user action via the status switch.
 */
function deriveStatus(
  draft: string,
  current: InterviewQuestionStatus,
): InterviewQuestionStatus {
  if (current === "ready") return current;
  if (current === "drafting") return current;
  return draft.trim().length > 0 ? "drafting" : "not_started";
}
