import type { JobStatus } from "@/types";
import { Tag } from "@/components/ui/tag";

/**
 * One accent tone, spent on `interviewing` only — the active state of a job.
 * `interested` and `closed` read as outline; `applied` as a quiet fill.
 */
function statusVariant(status: JobStatus): "soft" | "outline" | "accent" {
  if (status === "interviewing") return "accent";
  if (status === "applied") return "soft";
  return "outline";
}

export interface JobStatusTagProps {
  status: JobStatus;
  label: string;
  className?: string;
}

/**
 * Visual status badge. The label is computed by the parent so the component
 * stays a pure presentational primitive.
 */
export function JobStatusTag({ status, label, className }: JobStatusTagProps) {
  return (
    <Tag variant={statusVariant(status)} className={className}>
      {label}
    </Tag>
  );
}