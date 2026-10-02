"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { JobNextActionSuggestion } from "@/types";

export interface MatchNextActionsProps {
  actions: JobNextActionSuggestion[];
  locale: Locale;
}

/**
 * Bottom-of-page next actions. Each row is a short line of guidance; a row
 * may carry a CTA (currently the only CTA wires to the placeholder Resume
 * tab). The link to the Career Profile sits outside this list — it is
 * rendered by `JobMatchTab` once.
 */
export function MatchNextActions({ actions, locale }: MatchNextActionsProps) {
  const { t } = useTranslation();

  return (
    <section>
      <SectionLabel>{t("jobs.match.nextActions.title")}</SectionLabel>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        {t("jobs.match.nextActions.note")}
      </p>

      <ul className="mt-6 flex flex-col" role="list">
        {actions.map((action) => (
          <li
            key={action.id}
            className="flex flex-col gap-3 border-t border-line py-5 md:flex-row md:items-center md:justify-between"
          >
            <p className="text-body text-ink">{pick(action.title, locale)}</p>
            {action.cta ? (
              action.cta.href.startsWith("http") ? (
                <Link
                  href={action.cta.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-meta text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent"
                >
                  {pick(action.cta.label, locale)}
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              ) : (
                <ButtonLink
                  href={action.cta.href}
                  variant="ghost"
                  size="md"
                  className="group w-full md:w-auto"
                >
                  {pick(action.cta.label, locale)}
                  <ArrowRightIcon className="size-4 transition-transform duration-200 ease-calm group-hover:translate-x-0.5" />
                </ButtonLink>
              )
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}