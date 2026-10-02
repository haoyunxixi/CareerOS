"use client";

import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <Container className="flex min-h-[50vh] flex-col justify-center">
      <SectionLabel>{t("notFound.label")}</SectionLabel>
      <h1 className="mt-4 max-w-lg font-serif text-page font-medium text-ink">
        {t("notFound.title")}
      </h1>
      <p className="mt-5 max-w-md text-body text-ink-muted">
        {t("notFound.description")}
      </p>
      <div className="mt-8">
        <ButtonLink href="/" variant="secondary" size="md">
          {t("notFound.action")}
        </ButtonLink>
      </div>
    </Container>
  );
}
