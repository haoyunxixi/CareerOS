"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type {
  AnswerFramework,
  Evidence,
  InterviewQuestion,
  InterviewQuestionCategory,
  InterviewQuestionStatus,
  JobRequirementMatch,
} from "@/types";

const categoryKeys: Record<InterviewQuestionCategory, TranslationKey> = {
  motivation: "jobs.interview.questions.category.motivation",
  experience: "jobs.interview.questions.category.experience",
  role: "jobs.interview.questions.category.role",
  business: "jobs.interview.questions.category.business",
  gap: "jobs.interview.questions.category.gap",
};

const statusKeys: Record<InterviewQuestionStatus, TranslationKey> = {
  not_started: "jobs.interview.questions.status.not_started",
  drafting: "jobs.interview.questions.status.drafting",
  ready: "jobs.interview.questions.status.ready",
};

const statusOrder: InterviewQuestionStatus[] = [
  "not_started",
  "drafting",
  "ready",
];

const frameworkKeys: Record<AnswerFramework, TranslationKey> = {
  STAR: "jobs.interview.questions.framework.STAR",
  structured: "jobs.interview.questions.framework.structured",
};

export interface InterviewQuestionCardProps {
  question: InterviewQuestion;
  /** Resolved requirement rows from the job's Match pool. */
  requirements: JobRequirementMatch[];
  /** Resolved evidence rows from the job's Match pool. */
  evidence: Evidence[];
  locale: Locale;
  onAnswerDraftChange: (questionId: string, draft: string) => void;
  onStatusChange: (questionId: string, status: InterviewQuestionStatus) => void;
}

/**
 * One interview question. Expand to draft your answer; the framework
 * hint is shown next to the textarea as a *structure suggestion*, not
 * an answer.
 */
export function InterviewQuestionCard({
  question,
  requirements,
  evidence,
  locale,
  onAnswerDraftChange,
  onStatusChange,
}: InterviewQuestionCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const linkedRequirements = requirements.filter((r) =>
    question.requirementIds.includes(r.id),
  );
  const linkedEvidence = evidence.filter((e) =>
    question.evidenceIds.includes(e.id),
  );

  return (
    <article className="border-t border-line py-7">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="w-fit rounded-full border border-line bg-canvas-raised px-2.5 py-0.5 text-meta text-ink-muted">
            {t(categoryKeys[question.category])}
          </span>
          <p className="text-item font-semibold text-ink">
            {pick(question.question, locale)}
          </p>
        </div>
        <StatusSwitch
          current={question.status}
          onChange={(s) => onStatusChange(question.id, s)}
        />
      </header>

      <Field
        label={t("jobs.interview.questions.why")}
        body={pick(question.reason, locale)}
        className="mt-5"
      />

      <ChipsLine
        label={t("jobs.interview.questions.relatedRequirement")}
        items={linkedRequirements.map((r) => pick(r.requirement, locale))}
        empty={t("jobs.resume.card.evidence.empty")}
        className="mt-5"
      />

      <ChipsLine
        label={t("jobs.interview.questions.evidenceToUse")}
        items={linkedEvidence.map((e) => pick(e.title, locale))}
        empty={t("jobs.resume.card.evidence.empty")}
        className="mt-3"
      />

      <div className="mt-6">
        <Button
          variant={expanded ? "quiet" : "secondary"}
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded
            ? t("jobs.interview.questions.collapse")
            : t("jobs.interview.questions.expand")}
        </Button>
      </div>

      {expanded ? (
        <DraftPanel
          draft={question.answerDraft}
          framework={question.answerFramework}
          onChange={(text) => onAnswerDraftChange(question.id, text)}
        />
      ) : null}
    </article>
  );
}

// --- subcomponents ---------------------------------------------------------

function Field({
  label,
  body,
  className,
}: {
  label: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </span>
      <p className="text-body text-ink-muted">{body}</p>
    </div>
  );
}

function ChipsLine({
  label,
  items,
  empty,
  className,
}: {
  label: string;
  items: string[];
  empty: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </span>
      {items.length > 0 ? (
        <p className="text-meta text-ink-muted">{items.join(" · ")}</p>
      ) : (
        <p className="text-meta text-ink-faint">{empty}</p>
      )}
    </div>
  );
}

function StatusSwitch({
  current,
  onChange,
}: {
  current: InterviewQuestionStatus;
  onChange: (s: InterviewQuestionStatus) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="radiogroup"
      aria-label={t("jobs.interview.questions.status.not_started")}
      className="inline-flex shrink-0 overflow-hidden rounded-field border border-line"
    >
      {statusOrder.map((s) => (
        <StatusButton
          key={s}
          active={current === s}
          label={t(statusKeys[s])}
          onClick={() => onChange(s)}
        />
      ))}
    </div>
  );
}

function StatusButton({
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
        "h-8 px-3 text-meta transition-colors duration-200",
        active
          ? "bg-ink text-canvas"
          : "bg-canvas-raised text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

function DraftPanel({
  draft,
  framework,
  onChange,
}: {
  draft: string;
  framework?: AnswerFramework;
  onChange: (text: string) => void;
}) {
  const { t } = useTranslation();
  const placeholder = t("jobs.interview.questions.answerPlaceholder");
  const frameworkLabel = framework ? t(frameworkKeys[framework]) : null;
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("jobs.interview.questions.answerDraft")}
        </span>
        {frameworkLabel ? (
          <span className="text-meta text-ink-muted">
            {t("jobs.interview.questions.framework")} · {frameworkLabel}
          </span>
        ) : null}
      </div>
      <textarea
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className={cn(
          "block w-full resize-y rounded-field border border-line bg-canvas-raised px-4 py-3",
          "text-body text-ink placeholder:text-ink-faint",
          "transition-colors duration-200 focus:border-accent focus:outline-none",
        )}
      />
      {framework === "STAR" ? (
        <p className="text-meta text-ink-faint">
          {t("jobs.interview.questions.framework.needResult")}
        </p>
      ) : null}
    </div>
  );
}