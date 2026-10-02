"use client";

import { Tag } from "@/components/ui/tag";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { formatDateRange } from "@/lib/date-range";
import { pick } from "@/lib/localize";
import {
  profileExperienceTypeLabel,
} from "@/data/mock-profile";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type { CareerProfile, ProfileExperience } from "@/types";

export interface ProfileExperienceSectionProps {
  profile: CareerProfile;
  locale: Locale;
  className?: string;
}

/**
 * Read-only list of experience rows. Each row is a hairline-separated card,
 * with the type chip on the left and the date range on the right. The title
 * line carries the weight — the rest of the line is metadata.
 */
export function ProfileExperienceSection({
  profile,
  locale,
  className,
}: ProfileExperienceSectionProps) {
  const { t } = useTranslation();

  if (profile.experiences.length === 0) {
    return (
      <section className={className}>
        <SectionLabel>{t("profile.experience")}</SectionLabel>
        <p className="mt-5 border-t border-line text-body text-ink-muted">
          {t("profile.experience.empty")}
        </p>
      </section>
    );
  }

  return (
    <section className={className}>
      <SectionLabel>{t("profile.experience")}</SectionLabel>
      <ul className="mt-5 flex flex-col" role="list">
        {profile.experiences.map((exp) => (
          <li key={exp.id}>
            <ExperienceCard experience={exp} locale={locale} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExperienceCard({
  experience,
  locale,
}: {
  experience: ProfileExperience;
  locale: Locale;
}) {
  const { t } = useTranslation();

  const typeLabel = profileExperienceTypeLabel(experience.type, t);
  const organization = pick(experience.organization, locale);
  const role = experience.role ? pick(experience.role, locale) : null;
  const title = pick(experience.title, locale);
  const description = pick(experience.description, locale);
  const tags = experience.tags.map((tag) => pick(tag, locale));
  const dateLabel = formatDateRange(experience.startDate, experience.endDate, t);

  return (
    <article className={cn("flex flex-col gap-3 border-t border-line py-6")}>
      <div className="flex items-start justify-between gap-4">
        <Tag variant="soft">{typeLabel}</Tag>
        <span className="text-meta text-ink-muted">
          {pick(dateLabel, locale)}
        </span>
      </div>

      <div>
        <p className="text-item font-semibold text-ink">{title}</p>
        <p className="mt-1.5 text-body text-ink-muted">
          {organization}
          {role ? (
            <>
              <span className="mx-1.5 text-ink-faint">·</span>
              <span>{role}</span>
            </>
          ) : null}
        </p>
      </div>

      <p className="text-body leading-[1.7] text-ink-muted">{description}</p>

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" role="list">
          {tags.map((tag, i) => (
            <li key={i}>
              <Tag variant="outline">{tag}</Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}