"use client";

import { Button } from "@/components/ui/button";
import { PencilIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { CareerProfile } from "@/types";

export interface ProfileHeaderProps {
  profile: CareerProfile;
  locale: Locale;
  onEdit: () => void;
}

/**
 * Profile page hero. Eyebrow + title + supporting line, plus the only CTA on
 * the page ("Edit profile"). No chrome — this is a personal document.
 */
export function ProfileHeader({ profile, locale, onEdit }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const school = pick(profile.basic.education.school, locale);
  const major = pick(profile.basic.education.major, locale);
  const degree = pick(profile.basic.education.degree, locale);

  return (
    <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
      <div className="max-w-2xl">
        <h1 className="font-serif text-page font-medium text-ink">
          {t("profile.title")}
        </h1>
        <p className="mt-5 max-w-xl text-body text-ink-muted">
          {t("profile.description")}
        </p>
        <p className="mt-4 text-meta text-ink-faint">
          {profile.basic.name} · {school} · {major} · {degree}
        </p>
      </div>
      <div className="md:pb-2">
        <Button variant="primary" size="lg" onClick={onEdit}>
          <PencilIcon className="size-4" />
          {t("profile.editCta")}
        </Button>
      </div>
    </header>
  );
}