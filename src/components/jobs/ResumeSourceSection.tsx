"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/cn";
import type { ResumeDraftSource } from "@/types";

export interface ResumeSourceSectionProps {
  source: ResumeDraftSource;
  manualText: string;
  onSourceChange: (source: ResumeDraftSource) => void;
  onManualTextChange: (text: string) => void;
}

/**
 * Resume Source toggle + Manual paste textarea.
 *
 * The two source modes map directly to the Draft state:
 *   - `career_profile` : the draft is built from the user's profile.
 *     Rewrite recommendations can target specific profile entries.
 *   - `manual`         : the user pasted their own resume text. The draft
 *     becomes that text; Rewrite suggestions cannot target structured
 *     profile items and so Apply is gated until they switch back.
 *
 * This block intentionally uses plain text — no rich editor, no PDF /
 * Word upload (per Phase 4 scope).
 */
export function ResumeSourceSection({
  source,
  manualText,
  onSourceChange,
  onManualTextChange,
}: ResumeSourceSectionProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string>(manualText);

  const handleSave = () => {
    if (!draft.trim()) return;
    onManualTextChange(draft);
    onSourceChange("manual");
  };

  const handleReset = () => {
    setDraft("");
    onManualTextChange("");
    onSourceChange("career_profile");
  };

  return (
    <section className="border-b border-line pb-8">
      <header className="flex items-baseline justify-between gap-4">
        <p className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("jobs.resume.source.title")}
        </p>
        <div
          role="radiogroup"
          aria-label={t("jobs.resume.source.title")}
          className="inline-flex overflow-hidden rounded-field border border-line"
        >
          <SourceButton
            active={source === "career_profile"}
            label={t("jobs.resume.source.profile")}
            onClick={() => onSourceChange("career_profile")}
          />
          <SourceButton
            active={source === "manual"}
            label={t("jobs.resume.source.manual")}
            onClick={() => onSourceChange("manual")}
          />
        </div>
      </header>

      {source === "career_profile" ? (
        <p className="mt-4 max-w-2xl text-meta text-ink-muted">
          {t("jobs.resume.source.profile.help")}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          <label className="block">
            <span className="text-meta text-ink-faint">
              {t("jobs.resume.source.manual.label")}
            </span>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              placeholder={t("jobs.resume.source.manual.placeholder")}
              className={cn(
                "mt-2 block w-full resize-y rounded-field border border-line bg-canvas-raised px-4 py-3",
                "text-body text-ink placeholder:text-ink-faint",
                "transition-colors duration-200 focus:border-accent focus:outline-none",
              )}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!draft.trim()}
            >
              {t("jobs.resume.source.manual.save")}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              {t("jobs.resume.source.manual.reset")}
            </Button>
            {manualText && source === "manual" ? (
              <span className="text-meta text-ink-faint">
                {t("jobs.resume.source.manual.saved")}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function SourceButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "h-8 px-3.5 text-meta transition-colors duration-200",
        active
          ? "bg-ink text-canvas"
          : "bg-canvas-raised text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}