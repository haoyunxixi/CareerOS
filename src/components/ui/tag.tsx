import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type TagVariant = "soft" | "outline" | "accent";

const variantStyles: Record<TagVariant, string> = {
  /** Quiet metadata, e.g. a preparation item. */
  soft: "bg-canvas-sunken text-ink-muted",
  /** Slightly more definition without adding weight. */
  outline: "border border-line text-ink-muted",
  /** Reserved for the one thing on the page that needs emphasis. */
  accent: "bg-accent-soft text-accent",
};

export type TagProps = ComponentPropsWithoutRef<"span"> & {
  variant?: TagVariant;
};

export function Tag({ variant = "soft", className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-field px-3 text-meta",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
