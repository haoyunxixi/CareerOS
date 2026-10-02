import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-semibold transition-[background-color,border-color,color,transform,opacity] duration-150 ease-calm hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-40";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-ink text-canvas-raised hover:bg-ink/90",
  secondary:
    "border border-line bg-canvas-raised text-ink hover:border-line-strong",
  quiet: "bg-canvas-sunken text-ink hover:bg-line",
  ghost: "font-medium text-ink-muted hover:text-ink",
};

/**
 * Buttons are controls, not banners: a restrained radius, a compact height,
 * no pill shapes. Three real variants (primary / secondary / ghost-quiet).
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 rounded-field px-3.5 text-btn",
  md: "h-10 rounded-btn px-5 text-btn",
  lg: "h-11 rounded-btn px-6 text-btn",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}

export type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props} />
  );
}
