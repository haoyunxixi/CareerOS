"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/icons";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";

export interface JobsHeaderProps {
  onAdd: () => void;
}

/**
 * Jobs page header — eyebrow + hero title + supporting line, plus the primary
 * "Add opportunity" action. The action lives in the header (rather than the
 * row above the list) so it stays attached to the page, not to whatever
 * filter / sort state the list might grow later.
 */
export function JobsHeader({ onAdd }: JobsHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
      <div className="max-w-2xl">
        <SectionLabel>{t("nav.opportunities")}</SectionLabel>
        <h1 className="mt-4 font-serif text-page font-medium text-ink">
          {t("jobs.title")}
        </h1>
        <p className="mt-5 max-w-xl text-body text-ink-muted">
          {t("jobs.description")}
        </p>
      </div>
      <div className="md:pb-2">
        <Button variant="primary" size="lg" onClick={onAdd}>
          <PlusIcon className="size-4" />
          {t("jobs.addCta")}
        </Button>
      </div>
    </header>
  );
}