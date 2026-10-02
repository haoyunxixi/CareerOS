"use client";

import { ArrowRightIcon } from "@/components/icons";
import { BrandCellophane } from "@/components/ui/BrandCellophane";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/i18n/use-translation";
import { formatDayAndTime } from "@/lib/date";
import { pick } from "@/lib/localize";
import type { TodayFocus } from "@/types";

/**
 * The highest-weight element on Home and the only elevated surface on the page.
 *
 * Reading order inside the card is strict:
 * company -> role -> stage and time -> action, with the feedback on the right.
 * Stage is no longer a filled pill: it stays a metadata colour so the call to
 * action is the only solid shape in the card.
 */
export function TodayFocusCard({ focus }: { focus: TodayFocus }) {
  const { locale, t } = useTranslation();

  return (
    <section aria-labelledby="today-focus-title">
      <Card padding="md" className="relative overflow-hidden">
        {/* Corner reflection: a soft cellophane film sitting in the card's
            top-right corner. Clipped by the card and painted under every piece
            of text and the action. While `card-cellophane.webp` is still
            pending we reuse the hero asset — drop the right file in and remove
            the `src` prop to switch over. */}
        <BrandCellophane
          variant="card"
          size="lg"
          opacity={0.22}
          src="/brand/cellophane/hero-cellophane.webp"
          className="right-[-6%] top-[-22%] z-0"
        />

        <div className="relative flex items-center gap-2.5">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          <SectionLabel>{t("today.label")}</SectionLabel>
        </div>

        <div className="relative mt-5 grid gap-6 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-10">
          <div>
            <p className="text-meta text-ink-muted">{pick(focus.company, locale)}</p>
            <h2
              id="today-focus-title"
              className="mt-2.5 text-title font-semibold text-ink"
            >
              {pick(focus.role, locale)}
            </h2>
            <p className="mt-3 text-meta text-ink-muted">
              <span className="font-medium text-accent">
                {pick(focus.stage, locale)}
              </span>
              <span aria-hidden className="px-1.5 text-ink-faint">
                ·
              </span>
              {formatDayAndTime(focus.date, focus.time, t)}
            </p>

            <div className="mt-6">
              <ButtonLink
                href="/interview"
                variant="primary"
                size="md"
                className="group w-full sm:w-auto"
              >
                {t("today.cta")}
                <ArrowRightIcon className="size-4 transition-transform duration-200 ease-calm group-hover:translate-x-0.5" />
              </ButtonLink>
            </div>
          </div>

          <div className="md:border-l md:border-line md:pl-10">
            <SectionLabel>{t("today.contextLabel")}</SectionLabel>
            <p className="mt-3.5 text-prose text-ink-muted">
              {pick(focus.context, locale)}
            </p>

            <SectionLabel className="mt-6">
              {t("today.prepareLabel")}
            </SectionLabel>
            <ul className="mt-3 flex flex-wrap gap-2">
              {focus.suggestions.map((suggestion) => (
                <li key={suggestion.en}>
                  <Tag variant="soft">{pick(suggestion, locale)}</Tag>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </section>
  );
}
