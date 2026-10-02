"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type { ResumeDraft, ResumeDraftItem, ResumeDraftSection } from "@/types";

export interface ResumeDraftEditorProps {
  draft: ResumeDraft;
  locale: Locale;
  onItemTextChange: (itemId: string, text: string) => void;
}

/**
 * Target Resume Draft — the editable workspace at the bottom of the
 * Resume tab. Three sections (Education / Experience / Skills), seeded
 * from the user's Career Profile. Each item is a small textarea. Items
 * that were modified by an accepted recommendation carry a quiet badge.
 *
 * This is *not* a resume builder: there is no template picker, no A4
 * preview, no PDF export. The user can edit text inline; suggestions
 * land here when they are applied.
 */
export function ResumeDraftEditor({
  draft,
  locale,
  onItemTextChange,
}: ResumeDraftEditorProps) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-12">
      <header className="max-w-2xl">
        <h3 className="text-title font-semibold text-ink">
          {t("jobs.resume.draft.title")}
        </h3>
        <p className="mt-3 text-body text-ink-muted">
          {t("jobs.resume.draft.note")}
        </p>
        <p className="mt-3 text-meta text-ink-faint">
          {t(
            draft.source === "career_profile"
              ? "jobs.resume.draft.sourceNote.profile"
              : "jobs.resume.draft.sourceNote.manual",
          )}
        </p>
      </header>

      <div className="flex flex-col gap-12">
        {draft.sections.map((section) => (
          <DraftSectionView
            key={section.id}
            section={section}
            locale={locale}
            onItemTextChange={onItemTextChange}
            itemFromSuggestionLabel={t("jobs.resume.draft.itemFromSuggestion")}
            itemHintLabel={t("jobs.resume.draft.itemHint")}
            emptyLabel={t("jobs.resume.draft.empty")}
          />
        ))}
      </div>
    </section>
  );
}

function DraftSectionView({
  section,
  locale,
  onItemTextChange,
  itemFromSuggestionLabel,
  itemHintLabel,
  emptyLabel,
}: {
  section: ResumeDraftSection;
  locale: Locale;
  onItemTextChange: (itemId: string, text: string) => void;
  itemFromSuggestionLabel: string;
  itemHintLabel: string;
  emptyLabel: string;
}) {
  const title = pick(section.title, locale);

  // Hide the manual-paste section once it has no text — keeps the page
  // tidy if the user clears the textarea before resetting.
  if (section.type === "manual" && section.items.length === 0) return null;

  return (
    <div>
      <SectionLabel>{title}</SectionLabel>

      {section.items.length === 0 ? (
        <p className="mt-5 text-meta text-ink-faint">{emptyLabel}</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-6" role="list">
          {section.items.map((item) => (
            <DraftItemView
              key={item.id}
              item={item}
              onTextChange={(text) => onItemTextChange(item.id, text)}
              badgeLabel={itemFromSuggestionLabel}
              hintLabel={itemHintLabel}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DraftItemView({
  item,
  onTextChange,
  badgeLabel,
  hintLabel,
}: {
  item: ResumeDraftItem;
  onTextChange: (text: string) => void;
  badgeLabel: string;
  hintLabel: string;
}) {
  const hasBadge = Boolean(item.fromRecommendationId);

  return (
    <li className="flex flex-col gap-2">
      {hasBadge ? (
        <span className="inline-flex w-fit items-center gap-1.5 text-meta text-ink-faint">
          <span aria-hidden className="size-1 rounded-full bg-ink" />
          {badgeLabel}
        </span>
      ) : null}
      <textarea
        value={item.text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={Math.min(8, Math.max(2, item.text.split("\n").length + 1))}
        className={cn(
          "block w-full resize-y rounded-field border bg-canvas-raised px-4 py-3",
          "text-body text-ink",
          "transition-colors duration-200",
          hasBadge
            ? "border-line-strong focus:border-ink focus:outline-none"
            : "border-line focus:border-accent focus:outline-none",
        )}
      />
      <span className="text-meta text-ink-faint">{hintLabel}</span>
    </li>
  );
}