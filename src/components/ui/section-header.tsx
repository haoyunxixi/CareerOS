import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface SectionHeaderProps {
  title: string;
  action?: { label: string; href: string };
  className?: string;
}

/**
 * Section title plus the single quiet action that section may carry.
 */
export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2",
        className,
      )}
    >
      <h2 className="text-title font-semibold text-ink">{title}</h2>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-1.5 text-meta text-ink-muted transition-colors duration-200 hover:text-ink"
        >
          {action.label}
          <ArrowRightIcon className="size-3.5 transition-transform duration-200 ease-calm group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
