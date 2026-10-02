"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { LocalizedText } from "@/types";

/**
 * A preview only — Bubble Space itself is not built in this phase.
 */
export function BubblePreview({ thought }: { thought: LocalizedText }) {
  const { locale, t } = useTranslation();

  return (
    <section className="rounded-card bg-canvas-sunken px-6 py-6 md:px-8 md:py-7">
      <SectionLabel>{t("section.bubble")}</SectionLabel>
      <p className="mt-3.5 text-lead text-ink">“{pick(thought, locale)}”</p>
      <Link
        href="/bubble"
        className="group mt-5 inline-flex items-center gap-1.5 text-meta text-ink-muted transition-colors duration-200 hover:text-ink"
      >
        {t("section.bubbleAction")}
        <ArrowRightIcon className="size-3.5 transition-transform duration-200 ease-calm group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
