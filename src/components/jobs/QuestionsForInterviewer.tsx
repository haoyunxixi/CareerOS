"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type { LocalizedText } from "@/types";

export interface QuestionsForInterviewerProps {
  questions: string[];
  suggestions: LocalizedText[];
  locale: Locale;
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
}

/**
 * Questions for the interviewer. The user-typed list is editable; the
 * built-in suggestions are opt-in chips the user can add one by one.
 */
export function QuestionsForInterviewer({
  questions,
  suggestions,
  locale,
  onAdd,
  onRemove,
}: QuestionsForInterviewerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };

  return (
    <section>
      <SectionLabel>{t("jobs.interview.interviewer.title")}</SectionLabel>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        {t("jobs.interview.interviewer.note")}
      </p>

      <ul className="mt-6 flex flex-col gap-3" role="list">
        {questions.length === 0 ? (
          <li className="text-meta text-ink-faint">
            {t("jobs.interview.interviewer.empty")}
          </li>
        ) : (
          questions.map((q, i) => (
            <li
              key={`${i}-${q}`}
              className="flex items-start gap-3 border-t border-line pt-4"
            >
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-ink" />
              <p className="flex-1 text-body text-ink">{q}</p>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-meta text-ink-faint transition-colors hover:text-ink"
                aria-label={t("jobs.interview.interviewer.remove")}
              >
                {t("jobs.interview.interviewer.remove")}
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="mt-5 flex flex-col gap-3">
        <label className="block">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder={t("jobs.interview.interviewer.placeholder")}
            className={cn(
              "block w-full resize-y rounded-field border border-line bg-canvas-raised px-4 py-3",
              "text-body text-ink placeholder:text-ink-faint",
              "transition-colors duration-200 focus:border-accent focus:outline-none",
            )}
          />
        </label>
        <div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={!draft.trim()}
          >
            {t("jobs.interview.interviewer.add")}
          </Button>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="mt-8 flex flex-col gap-3">
          <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("jobs.interview.interviewer.suggestions")}
          </span>
          <ul className="flex flex-col gap-3" role="list">
            {suggestions.map((s, i) => {
              const text = pick(s, locale);
              const used = questions.includes(text);
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 border-t border-line pt-4"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-line-strong" />
                  <p className="flex-1 text-body text-ink-muted">{text}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAdd(text)}
                    disabled={used}
                  >
                    {t("jobs.interview.interviewer.addSuggestion")}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}