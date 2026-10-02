"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type { InterviewChecklistItem } from "@/types";

export interface PreparationChecklistProps {
  items: InterviewChecklistItem[];
  locale: Locale;
  onToggle: (itemId: string) => void;
}

export function PreparationChecklist({
  items,
  locale,
  onToggle,
}: PreparationChecklistProps) {
  const { t } = useTranslation();
  const doneCount = items.filter((i) => i.done).length;

  return (
    <section>
      <header className="flex items-baseline justify-between gap-4">
        <SectionLabel>{t("jobs.interview.checklist.title")}</SectionLabel>
        <span className="text-meta tabular-nums text-ink-faint">
          {doneCount} / {items.length}
        </span>
      </header>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        {t("jobs.interview.checklist.note")}
      </p>

      <ul className="mt-6 flex flex-col gap-3" role="list">
        {items.map((item) => (
          <li key={item.id}>
            <ChecklistRow item={item} locale={locale} onToggle={onToggle} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChecklistRow({
  item,
  locale,
  onToggle,
}: {
  item: InterviewChecklistItem;
  locale: Locale;
  onToggle: (itemId: string) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-field border border-line bg-canvas-raised px-4 py-3",
        "transition-colors duration-200 hover:border-line-strong",
      )}
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={() => onToggle(item.id)}
        className="mt-1 size-4 shrink-0 cursor-pointer accent-ink"
      />
      <span
        className={cn(
          "text-body",
          item.done ? "text-ink-faint line-through" : "text-ink",
        )}
      >
        {pick(item.label, locale)}
      </span>
    </label>
  );
}