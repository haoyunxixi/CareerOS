"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { CareerProfile } from "@/types";

export interface ProfileSkillsSectionProps {
  profile: CareerProfile;
  locale: Locale;
  className?: string;
}

/**
 * Read-only skills row. Each tag is a quiet outline pill — skills are
 * reference data, not the main signal on the page.
 */
export function ProfileSkillsSection({
  profile,
  locale,
  className,
}: ProfileSkillsSectionProps) {
  const { t } = useTranslation();

  return (
    <section className={className}>
      <SectionLabel>{t("profile.skills")}</SectionLabel>

      {profile.skills.length === 0 ? (
        <p className="mt-5 border-t border-line text-body text-ink-muted">
          {t("profile.skills.empty")}
        </p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5" role="list">
          {profile.skills.map((skill) => (
            <li key={skill.id}>
              <Tag variant="outline">{pick(skill.label, locale)}</Tag>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}