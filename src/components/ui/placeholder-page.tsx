"use client";

import { Container } from "@/components/layout/container";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { PlaceholderPageContent } from "@/types";

/**
 * Shared shell for every route that is not built yet. All remaining pages use
 * this primitive, so replacing one later is a local change.
 */
export function PlaceholderPage({
  content,
}: {
  content: PlaceholderPageContent;
}) {
  const { locale, t } = useTranslation();

  return (
    <Container>
      <header className="max-w-2xl">
        <SectionLabel>{pick(content.eyebrow, locale)}</SectionLabel>
        <h1 className="mt-4 font-serif text-page font-medium text-ink">
          {pick(content.title, locale)}
        </h1>
        <p className="mt-5 max-w-xl text-body text-ink-muted">
          {pick(content.description, locale)}
        </p>
      </header>

      <div className="mt-12 border-t border-line pt-8">
        <SectionLabel>{t("placeholder.planned")}</SectionLabel>
        <ul className="mt-6 grid gap-x-12 gap-y-3 md:grid-cols-2">
          {content.planned.map((item) => (
            <li
              key={item.en}
              className="flex gap-3 text-body text-ink-muted"
            >
              <span
                aria-hidden
                className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
              />
              <span>{pick(item, locale)}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 text-micro text-ink-faint">{t("placeholder.note")}</p>
    </Container>
  );
}
