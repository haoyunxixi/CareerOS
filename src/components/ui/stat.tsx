import { cn } from "@/lib/cn";

export interface StatProps {
  value: number | string;
  label: string;
  className?: string;
}

/**
 * One supporting number. Deliberately small: statistics are context, never the
 * subject of a page.
 */
export function Stat({ value, label, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-stat font-medium tabular-nums text-ink">
        {value}
      </span>
      <span className="text-meta text-ink-muted">{label}</span>
    </div>
  );
}
