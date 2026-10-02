import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Eyebrow that labels a block of content. Tracking is a locale aware token, so
 * it stays wide in Latin script and tight in CJK.
 */
export function SectionLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn(
        "text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint",
        className,
      )}
      {...props}
    />
  );
}
