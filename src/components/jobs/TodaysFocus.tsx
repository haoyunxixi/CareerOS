"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { InterviewFocus } from "@/types";

export interface TodaysFocusProps {
  focuses: InterviewFocus[];
  locale: Locale;
}

/**
 * Today's Focus — the most prominent block on the Interview tab. Each
 * focus carries a back-reference (kind + id) so we can render where it
 * came from. CareerOS never invents a focus without a source.
 */
export function TodaysFocus({ focuses, locale }: TodaysFocusProps) {
  const { t } = useTranslation();
  if (focuses.length === 0) return null;

  return (
    <section className="border-t border-b border-line-strong py-10">
      <SectionLabel>{t("jobs.interview.focus.title")}</SectionLabel>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        {t("jobs.interview.focus.note")}
      </p>

      <ol className="mt-7 flex flex-col gap-8 md:grid md:grid-cols-3 md:gap-10" role="list">
        {focuses.map((focus, i) => (
          <li key={focus.id} className="flex gap-5 md:flex-col md:gap-3">
            <span
              aria-hidden
              className="text-title font-medium text-ink-faint tabular-nums"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1">
              <p className="text-item font-semibold text-ink">
                {pick(focus.title, locale)}
              </p>
              <p className="mt-2 text-meta text-ink-muted">
                {pick(focus.reason, locale)}
              </p>
              <p className="mt-3 text-meta text-ink-faint">
                {sourceLabel(focus, t)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function sourceLabel(
  focus: InterviewFocus,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  const kind =
    focus.source.kind === "requirement"
      ? t("jobs.interview.focus.from.requirement")
      : focus.source.kind === "evidence"
        ? t("jobs.interview.focus.from.evidence")
        : focus.source.kind === "interview_review"
          ? t("jobs.interview.focus.from.interview_review")
          : t("jobs.interview.focus.from.resume_recommendation");
  return `${kind} · ${focus.source.id}`;
}