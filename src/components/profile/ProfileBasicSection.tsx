"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { CareerProfile, LocalizedText } from "@/types";

export interface ProfileBasicSectionProps {
  profile: CareerProfile;
  locale: Locale;
}

/**
 * Read-only display of the basic block. Single-line facts sit in a quiet
 * two-column grid so a longer target list still reads cleanly.
 */
export function ProfileBasicSection({
  profile,
  locale,
}: ProfileBasicSectionProps) {
  const { t } = useTranslation();

  const edu = profile.basic.education;
  const target = profile.basic.target;

  return (
    <section>
      <SectionLabel>{t("profile.basic")}</SectionLabel>

      <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
        <Row label={t("profile.basic.name")} value={profile.basic.name} />
        <Row label={t("profile.basic.school")} value={pick(edu.school, locale)} />
        <Row label={t("profile.basic.major")} value={pick(edu.major, locale)} />
        <Row label={t("profile.basic.degree")} value={pick(edu.degree, locale)} />
        <Row
          label={t("profile.basic.graduationYear")}
          value={String(edu.graduationYear)}
        />
        <Row
          label={t("profile.basic.targetRoles")}
          value={renderList(target.roles, locale)}
        />
        <Row
          label={t("profile.basic.targetIndustries")}
          value={renderList(target.industries, locale)}
          className="md:col-span-2"
        />
      </dl>
    </section>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`border-t border-line pt-3 ${className ?? ""}`}>
      <dt className="text-meta text-ink-muted">{label}</dt>
      <dd className="mt-1.5 text-body text-ink">{value}</dd>
    </div>
  );
}

function renderList(items: LocalizedText[], locale: Locale): string {
  return items.map((item) => pick(item, locale)).join(" · ");
}