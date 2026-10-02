"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type {
  Evidence,
  JobRequirementMatch,
  ResumeRecommendation,
} from "@/types";

export interface ResumeRecommendationCardProps {
  rec: ResumeRecommendation;
  /** Resolved evidence pool from the job's Match data. */
  evidence: Evidence[];
  /** Resolved requirement rows linked by rec.requirementIds. */
  requirements: JobRequirementMatch[];
  locale: Locale;
  /** True when the draft source is "manual" — disables Apply for rewrite. */
  manualLocked?: boolean;
  /** Whether Apply is allowed for rewrite recs at this moment. */
  canApply?: boolean;
  onApply?: (recId: string) => void;
  onKeep?: (recId: string) => void;
  onUndo?: (recId: string) => void;
  onConfirm?: (recId: string) => void;
}

/**
 * One Resume recommendation. Insight → Reason → Body → Related → Source.
 *
 * Four variants:
 *   - highlight          : Reason + capability bullets.
 *   - rewrite            : Reason + Current + Suggested, plus Apply /
 *                           Keep / Undo actions.
 *   - needs_confirmation : Reason + missing-info questions + Confirm.
 *   - gap                : Reason + what to add. No actions.
 *
 * No card invents facts. Suggestions either rephrase what is already in
 * the profile (rewrite), surface missing facts (needs_confirmation), or
 * name what is missing (gap).
 */
export function ResumeRecommendationCard({
  rec,
  evidence,
  requirements,
  locale,
  manualLocked = false,
  canApply = true,
  onApply,
  onKeep,
  onUndo,
  onConfirm,
}: ResumeRecommendationCardProps) {
  const { t } = useTranslation();
  const title = pick(rec.title, locale);
  const reason = pick(rec.reason, locale);
  const sourceText = rec.sourceText ? pick(rec.sourceText, locale) : null;
  const suggestedText = rec.suggestedText
    ? pick(rec.suggestedText, locale)
    : null;
  const capabilities = rec.capabilities?.map((c) => pick(c, locale)) ?? [];
  const missing = rec.missingInformation?.map((c) => pick(c, locale)) ?? [];

  const sourceEvidence = evidence.filter((e) =>
    rec.evidenceIds.includes(e.id),
  );
  const reqRows = requirements.filter((r) => rec.requirementIds.includes(r.id));

  return (
    <article className="border-t border-line py-7">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <p className="text-item font-semibold text-ink">{title}</p>
        <TypeBadge
          type={rec.type}
          status={rec.status}
          locale={locale}
        />
      </header>

      <Field
        label={t("jobs.resume.card.whyItMatters")}
        body={reason}
        className="mt-5"
      />

      {rec.type === "highlight" ? (
        <HighlightBody
          label={t("jobs.resume.card.focusOn")}
          capabilities={capabilities}
        />
      ) : null}

      {rec.type === "rewrite" && sourceText && suggestedText ? (
        <RewriteBody
          labelCurrent={t("jobs.resume.card.current")}
          labelSuggested={t("jobs.resume.card.suggested")}
          current={sourceText}
          suggested={suggestedText}
          status={rec.status}
          manualLocked={manualLocked}
          canApply={canApply}
          onApply={() => onApply?.(rec.id)}
          onKeep={() => onKeep?.(rec.id)}
          onUndo={() => onUndo?.(rec.id)}
          applyLabel={t("jobs.resume.card.cta.apply")}
          keepLabel={t("jobs.resume.card.cta.keep")}
          undoLabel={t("jobs.resume.card.cta.undo")}
          appliedLabel={t("jobs.resume.card.status.applied")}
          keptLabel={t("jobs.resume.card.status.kept")}
          pendingLabel={t("jobs.resume.card.status.pending")}
          lockedReason={t("jobs.resume.draft.lockedReason")}
        />
      ) : null}

      {rec.type === "needs_confirmation" && missing.length > 0 ? (
        <NeedsConfirmationBody
          labelIntro={t("jobs.resume.card.beforeWeCanRewrite")}
          labelSuggested={t("jobs.resume.card.suggested")}
          missing={missing}
          suggested={suggestedText}
          status={rec.status}
          onConfirm={() => onConfirm?.(rec.id)}
          onUndo={() => onUndo?.(rec.id)}
          confirmLabel={t("jobs.resume.card.cta.confirm")}
          undoLabel={t("jobs.resume.card.cta.undo")}
          confirmedLabel={t("jobs.resume.card.status.confirmed")}
          pendingLabel={t("jobs.resume.card.status.pending")}
        />
      ) : null}

      {rec.type === "gap" && suggestedText ? (
        <GapBody
          labelAction={t("jobs.resume.card.suggested")}
          body={suggestedText}
        />
      ) : null}

      <RelatedRequirementLine
        label={t("jobs.resume.card.relatedRequirement")}
        requirements={reqRows}
        locale={locale}
        emptyLabel={t("jobs.resume.card.evidence.empty")}
      />

      <SourceLine
        label={t("jobs.resume.card.evidenceSource")}
        evidence={sourceEvidence}
        locale={locale}
        emptyLabel={t("jobs.resume.card.evidence.empty")}
      />
    </article>
  );
}

// --- Variants -------------------------------------------------------------

function HighlightBody({
  label,
  capabilities,
}: {
  label: string;
  capabilities: string[];
}) {
  if (capabilities.length === 0) return null;
  return (
    <div className="mt-5 flex flex-col gap-3">
      <FieldLabel>{label}</FieldLabel>
      <ul className="flex flex-col gap-2" role="list">
        {capabilities.map((cap, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-body text-ink"
          >
            <span
              aria-hidden
              className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
            />
            <span>{cap}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RewriteBody({
  labelCurrent,
  labelSuggested,
  current,
  suggested,
  status,
  manualLocked,
  canApply,
  onApply,
  onKeep,
  onUndo,
  applyLabel,
  keepLabel,
  undoLabel,
  appliedLabel,
  keptLabel,
  pendingLabel,
  lockedReason,
}: {
  labelCurrent: string;
  labelSuggested: string;
  current: string;
  suggested: string;
  status: ResumeRecommendation["status"];
  manualLocked: boolean;
  canApply: boolean;
  onApply: () => void;
  onKeep: () => void;
  onUndo: () => void;
  applyLabel: string;
  keepLabel: string;
  undoLabel: string;
  appliedLabel: string;
  keptLabel: string;
  pendingLabel: string;
  lockedReason: string;
}) {
  const isApplied = status === "accepted";
  const isKept_ = status === "rejected";
  void isKept_;

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <FieldLabel>{labelCurrent}</FieldLabel>
        <blockquote className="rounded-field border border-line bg-canvas-sunken px-4 py-3 text-body text-ink-muted">
          {current}
        </blockquote>
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>{labelSuggested}</FieldLabel>
        <p className="text-body font-medium text-ink">{suggested}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {status === "pending" ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={onApply}
              disabled={!canApply || manualLocked}
              aria-disabled={!canApply || manualLocked}
              title={manualLocked ? lockedReason : undefined}
            >
              {applyLabel}
            </Button>
            <Button variant="quiet" size="sm" onClick={onKeep}>
              {keepLabel}
            </Button>
            <span className="text-meta text-ink-faint">{pendingLabel}</span>
          </>
        ) : isApplied ? (
          <>
            <span className="text-meta text-ink-faint">{appliedLabel}</span>
            <Button variant="ghost" size="sm" onClick={onUndo}>
              {undoLabel}
            </Button>
          </>
        ) : (
          <>
            <span className="text-meta text-ink-faint">{keptLabel}</span>
            <Button variant="ghost" size="sm" onClick={onUndo}>
              {undoLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function NeedsConfirmationBody({
  labelIntro,
  labelSuggested,
  missing,
  suggested,
  status,
  onConfirm,
  onUndo,
  confirmLabel,
  undoLabel,
  confirmedLabel,
  pendingLabel,
}: {
  labelIntro: string;
  labelSuggested: string;
  missing: string[];
  suggested: string | null;
  status: ResumeRecommendation["status"];
  onConfirm: () => void;
  onUndo: () => void;
  confirmLabel: string;
  undoLabel: string;
  confirmedLabel: string;
  pendingLabel: string;
}) {
  const isConfirmed = status === "accepted";
  return (
    <div className="mt-5 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <FieldLabel>{labelIntro}</FieldLabel>
        <ul className="flex flex-col gap-2" role="list">
          {missing.map((q, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-body text-ink"
            >
              <span
                aria-hidden
                className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
              />
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>
      {suggested ? (
        <div className="flex flex-col gap-2">
          <FieldLabel>{labelSuggested}</FieldLabel>
          <p className="text-body text-ink-muted">{suggested}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {isConfirmed ? (
          <>
            <span className="text-meta text-ink-faint">{confirmedLabel}</span>
            <Button variant="ghost" size="sm" onClick={onUndo}>
              {undoLabel}
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
            <span className="text-meta text-ink-faint">{pendingLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

function GapBody({
  labelAction,
  body,
}: {
  labelAction: string;
  body: string;
}) {
  return (
    <div className="mt-5 flex flex-col gap-2">
      <FieldLabel>{labelAction}</FieldLabel>
      <p className="text-body text-ink">{body}</p>
    </div>
  );
}

// --- shared bits ----------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
      {children}
    </span>
  );
}

function Field({
  label,
  body,
  className,
}: {
  label: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <FieldLabel>{label}</FieldLabel>
      <p className="text-body text-ink-muted">{body}</p>
    </div>
  );
}

function TypeBadge({
  type,
  status,
}: {
  type: ResumeRecommendation["type"];
  status: "pending" | "accepted" | "rejected";
  locale: Locale;
}) {
  // We render the badge label via useTranslation hook below.
  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-meta">
      <TypeLabel type={type} />
      <StatusMark status={status} />
    </span>
  );
}

function TypeLabel({
  type,
}: {
  type: ResumeRecommendation["type"];
}) {
  const { t } = useTranslation();
  const key =
    type === "highlight"
      ? "jobs.resume.card.type.highlight"
      : type === "rewrite"
        ? "jobs.resume.card.type.rewrite"
        : type === "needs_confirmation"
          ? "jobs.resume.card.type.needs_confirmation"
          : "jobs.resume.card.type.gap";
  return (
    <span className="rounded-full border border-line bg-canvas-raised px-2.5 py-0.5 text-ink-muted">
      {t(key)}
    </span>
  );
}

function StatusMark({ status }: { status: ResumeRecommendation["status"] }) {
  const { t } = useTranslation();
  if (status === "pending") return null;
  const label =
    status === "accepted"
      ? t("jobs.resume.card.status.applied")
      : t("jobs.resume.card.status.kept");
  // Use a tiny dot to keep things quiet — no big coloured chip.
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-faint">
      <span aria-hidden className="size-1 rounded-full bg-ink" />
      {label}
    </span>
  );
}

function RelatedRequirementLine({
  label,
  requirements,
  locale,
  emptyLabel,
}: {
  label: string;
  requirements: JobRequirementMatch[];
  locale: Locale;
  emptyLabel: string;
}) {
  const titles = requirements.map((r) => pick(r.requirement, locale));
  return (
    <p className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-meta text-ink-faint">
      <FieldLabel>{label}</FieldLabel>
      {titles.length > 0 ? (
        <span className="text-ink-muted">{titles.join(" · ")}</span>
      ) : (
        <span className="text-ink-faint">{emptyLabel}</span>
      )}
    </p>
  );
}

function SourceLine({
  label,
  evidence,
  locale,
  emptyLabel,
}: {
  label: string;
  evidence: Evidence[];
  locale: Locale;
  emptyLabel: string;
}) {
  const titles = evidence.map((e) => pick(e.title, locale));
  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-meta text-ink-faint">
      <FieldLabel>{label}</FieldLabel>
      {titles.length > 0 ? (
        <span className="text-ink-muted">{titles.join(" · ")}</span>
      ) : (
        <span className="text-ink-faint">{emptyLabel}</span>
      )}
    </p>
  );
}