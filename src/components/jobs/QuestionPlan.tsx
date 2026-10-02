"use client";

import { useMemo, useState } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { InterviewQuestionCard } from "@/components/jobs/InterviewQuestionCard";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type {
  Evidence,
  InterviewQuestion,
  InterviewQuestionCategory,
  InterviewQuestionStatus,
  JobRequirementMatch,
} from "@/types";

type CategoryFilter = InterviewQuestionCategory | "all";

const categoryKeys: Record<InterviewQuestionCategory, TranslationKey> = {
  motivation: "jobs.interview.questions.category.motivation",
  experience: "jobs.interview.questions.category.experience",
  role: "jobs.interview.questions.category.role",
  business: "jobs.interview.questions.category.business",
  gap: "jobs.interview.questions.category.gap",
};

export interface QuestionPlanProps {
  questions: InterviewQuestion[];
  requirements: JobRequirementMatch[];
  evidence: Evidence[];
  locale: Locale;
  onAnswerDraftChange: (questionId: string, draft: string) => void;
  onStatusChange: (questionId: string, status: InterviewQuestionStatus) => void;
}

/**
 * Question Plan — the biggest block on the Interview tab. A single
 * editorial list with a small category filter at the top. No tabs-as-tabs
 * (avoids the feeling of an exam UI).
 */
export function QuestionPlan({
  questions,
  requirements,
  evidence,
  locale,
  onAnswerDraftChange,
  onStatusChange,
}: QuestionPlanProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? questions
        : questions.filter((q) => q.category === filter),
    [filter, questions],
  );

  const counts = useMemo(() => {
    const c: Record<InterviewQuestionCategory, number> = {
      motivation: 0,
      experience: 0,
      role: 0,
      business: 0,
      gap: 0,
    };
    for (const q of questions) c[q.category] += 1;
    return c;
  }, [questions]);

  const order: InterviewQuestionCategory[] = [
    "motivation",
    "experience",
    "role",
    "business",
    "gap",
  ];

  return (
    <section>
      <SectionLabel>{t("jobs.interview.questions.title")}</SectionLabel>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        {t("jobs.interview.questions.note")}
      </p>

      <div
        role="radiogroup"
        aria-label={t("jobs.interview.questions.title")}
        className="mt-7 flex flex-wrap gap-2"
      >
        <FilterButton
          active={filter === "all"}
          label={t("jobs.interview.questions.filterAll")}
          onClick={() => setFilter("all")}
        />
        {order.map((c) => (
          <FilterButton
            key={c}
            active={filter === c}
            label={`${t(categoryKeys[c])} · ${counts[c]}`}
            onClick={() => setFilter(c)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 border-t border-line pt-5 text-meta text-ink-faint">
          {t("jobs.interview.questions.empty")}
        </p>
      ) : (
        <ul className="mt-7 flex flex-col" role="list">
          {filtered.map((q) => (
            <li key={q.id}>
              <InterviewQuestionCard
                question={q}
                requirements={requirements.filter((r) =>
                  q.requirementIds.includes(r.id),
                )}
                evidence={evidence.filter((e) =>
                  q.evidenceIds.includes(e.id),
                )}
                locale={locale}
                onAnswerDraftChange={onAnswerDraftChange}
                onStatusChange={onStatusChange}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "h-8 rounded-field border px-3.5 text-meta transition-colors duration-200",
        active
          ? "border-ink bg-ink text-canvas"
          : "border-line bg-canvas-raised text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}