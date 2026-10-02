import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Two surfaces only.
 *
 * `raised` is the one elevated surface a page is allowed to have. `quiet` sits
 * behind content without a border. Most sections should use no surface at all
 * and let hairlines and whitespace do the work.
 */
export type CardVariant = "raised" | "quiet";

export type CardPadding = "none" | "sm" | "md" | "lg";

const variantStyles: Record<CardVariant, string> = {
  raised: "rounded-card border border-line bg-canvas-raised",
  quiet: "rounded-card bg-canvas-sunken",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-5",
  md: "p-6 md:p-8",
  lg: "p-6 md:p-10",
};

export type CardProps = ComponentPropsWithoutRef<"div"> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export function Card({
  variant = "raised",
  padding = "md",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(variantStyles[variant], paddingStyles[padding], className)}
      {...props}
    />
  );
}
