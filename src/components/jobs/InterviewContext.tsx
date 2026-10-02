"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import type {
  InterviewPreparation,
  InterviewStage,
} from "@/types";

export interface InterviewContextProps {
  jobCompany: string;
  jobTitle: string;
  preparation: InterviewPreparation;
  onStageChange: (stage: InterviewStage) => void;
  onScheduledAtChange: (iso: string) => void;
}

const stages: InterviewStage[] = [
  "screening",
  "first_round",
  "second_round",
  "final_round",
  "other",
];

const stageLabels: Record<InterviewStage, TranslationKey> = {
  screening: "jobs.interview.context.stage.screening",
  first_round: "jobs.interview.context.stage.first_round",
  second_round: "jobs.interview.context.stage.second_round",
  final_round: "jobs.interview.context.stage.final_round",
  other: "jobs.interview.context.stage.other",
};

/**
 * Interview context — the quiet header that anchors the tab to one
 * specific round. Company + role are read-only; the user can edit the
 * stage and the scheduled time inline.
 */
export function InterviewContext({
  jobCompany,
  jobTitle,
  preparation,
  onStageChange,
  onScheduledAtChange,
}: InterviewContextProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  return (
    <section className="border-b border-line pb-8">
      <header className="flex items-baseline justify-between gap-4">
        <SectionLabel>{t("jobs.interview.context.title")}</SectionLabel>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing((v) => !v)}
          aria-pressed={editing}
        >
          {editing ? t("jobs.interview.context.done") : t("jobs.interview.context.edit")}
        </Button>
      </header>

      <dl className="mt-5 flex flex-col gap-5">
        <Row label={t("jobs.interview.context.company")} value={jobCompany} />
        <Row label={t("jobs.interview.context.role")} value={jobTitle} />
        <Row
          label={t("jobs.interview.context.stage")}
          value={t(stageLabels[preparation.stage])}
        />
        <ScheduledRow
          label={t("jobs.interview.context.scheduledAt")}
          emptyLabel={t("jobs.interview.context.scheduledAt.empty")}
          value={preparation.scheduledAt}
          editing={editing}
          onChange={onScheduledAtChange}
        />
        <Row
          label={t("jobs.interview.context.resumeVersion")}
          value={t("jobs.interview.context.resumeVersion.value")}
        />
      </dl>

      {editing ? (
        <div className="mt-6 flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t("jobs.interview.context.stage")}>
          {stages.map((s) => (
            <StageButton
              key={s}
              active={preparation.stage === s}
              label={t(stageLabels[s])}
              onClick={() => onStageChange(s)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <dt className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </dt>
      <dd className="text-body text-ink">{value}</dd>
    </div>
  );
}

function ScheduledRow({
  label,
  emptyLabel,
  value,
  editing,
  onChange,
}: {
  label: string;
  emptyLabel: string;
  value: string;
  editing: boolean;
  onChange: (iso: string) => void;
}) {
  // Convert ISO -> "YYYY-MM-DDTHH:MM" for the <input type="datetime-local">.
  // Empty input writes "" back.
  const dtLocal = value ? toDateTimeLocal(value) : "";

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <dt className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </dt>
      {editing ? (
        <input
          type="datetime-local"
          value={dtLocal}
          onChange={(e) => onChange(fromDateTimeLocal(e.target.value))}
          className={cn(
            "h-8 rounded-field border border-line bg-canvas-raised px-3 text-meta text-ink",
            "transition-colors duration-200 focus:border-accent focus:outline-none",
          )}
        />
      ) : (
        <dd className="text-body text-ink">
          {value ? formatScheduled(value) : emptyLabel}
        </dd>
      )}
    </div>
  );
}

function StageButton({
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
        "h-8 rounded-field border px-3.5 text-meta transition-colors duration-200",
        active
          ? "border-ink bg-ink text-canvas"
          : "border-line bg-canvas-raised text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

// --- date helpers ----------------------------------------------------------

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function formatScheduled(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}