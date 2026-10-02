"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { JdAnalysis } from "@/types";

export interface JobJdAnalysisTabProps {
  analysis: JdAnalysis;
  locale: Locale;
}

/**
 * Structured breakdown of a JD — the answer to "what is this role really
 * asking for?". Mock-backed in Phase 2: every value is pre-written so the UI
 * can be exercised before the real analysis pipeline lands.
 *
 * The visual hierarchy is deliberately flat (a series of sections separated
 * by hairlines) so the reader scans top-to-bottom without a sales-y "AI
 * insights" chrome.
 */
export function JobJdAnalysisTab({ analysis, locale }: JobJdAnalysisTabProps) {
  const { t } = useTranslation();

  const roleSummary = pick(analysis.roleSummary, locale);
  const responsibilities = analysis.responsibilities.map((r) => pick(r, locale));
  const keywords = analysis.keywords.map((k) => pick(k, locale));
  const mostImportant = analysis.mostImportant.map((m) => pick(m, locale));

  const req = analysis.requirements;
  const skills = req.skills.map((r) => pick(r, locale));
  const experience = req.experience.map((r) => pick(r, locale));
  const domain = req.domain.map((r) => pick(r, locale));
  const soft = req.soft.map((r) => pick(r, locale));

  return (
    <div className="flex flex-col gap-12">
      <header className="max-w-2xl">
        <h2 className="text-title font-semibold text-ink">
          {t("jobs.jdAnalysis.title")}
        </h2>
        <p className="mt-3 text-meta text-ink-faint">{t("jobs.jdAnalysis.note")}</p>
      </header>

      <Section title={t("jobs.jdAnalysis.roleSummary")} prose>
        {roleSummary}
      </Section>

      <Section title={t("jobs.jdAnalysis.responsibilities")}>
        <ul className="flex flex-col gap-2.5">
          {responsibilities.map((line, i) => (
            <li key={i} className="flex gap-3 text-body text-ink">
              <span
                aria-hidden
                className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("jobs.jdAnalysis.requirements")}>
        <div className="grid gap-8 md:grid-cols-2">
          <RequirementGroup
            label={t("jobs.jdAnalysis.requirements.skills")}
            items={skills}
          />
          <RequirementGroup
            label={t("jobs.jdAnalysis.requirements.experience")}
            items={experience}
          />
          <RequirementGroup
            label={t("jobs.jdAnalysis.requirements.domain")}
            items={domain}
          />
          <RequirementGroup
            label={t("jobs.jdAnalysis.requirements.soft")}
            items={soft}
          />
        </div>
      </Section>

      <Section title={t("jobs.jdAnalysis.keywords")}>
        <ul className="flex flex-wrap gap-2">
          {keywords.map((k, i) => (
            <li key={i}>
              <Tag variant="outline">{k}</Tag>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("jobs.jdAnalysis.mostImportant")}>
        <ol className="flex flex-col gap-3">
          {mostImportant.map((line, i) => (
            <li
              key={i}
              className="flex gap-4 border-t border-line pt-3 text-body text-ink first:border-t-0 first:pt-0"
            >
              <span
                aria-hidden
                className="font-mono text-meta tabular-nums text-ink-faint"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function Section({
  title,
  prose,
  children,
}: {
  title: string;
  prose?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionLabel>{title}</SectionLabel>
      <div className={prose ? "mt-5 max-w-2xl text-prose text-ink" : "mt-5"}>
        {children}
      </div>
    </section>
  );
}

function RequirementGroup({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-meta text-ink-muted">{label}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="border-t border-line pt-3 text-body text-ink first:border-t-0 first:pt-0"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}