import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * The one page grid. 1180px of content on large screens, 20px page padding
 * on mobile stepping up to 48px on desktop. Shared with `AppHeader` so the
 * navigation and the content always sit on the same grid.
 */
export const contentFrame = "mx-auto w-full max-w-[73.75rem] px-5 md:px-8 lg:px-10";

/**
 * Reading width for long-form content: story detail, AI self introduction,
 * real-interview review, interview room. 720px — comfortable prose, never a
 * full-bleed wall of text.
 */
export const readingFrame = "mx-auto w-full max-w-[45rem]";

export type ContainerPadding = "default" | "none";

const paddingStyles: Record<ContainerPadding, string> = {
  /** Page top 64px on desktop — editorial breathing room under the nav. */
  default: "py-10 md:py-16",
  /**
   * Lets a page own its vertical rhythm. Home uses this because its spacing is
   * deliberately asymmetric: tight at the top so the first screen holds three
   * layers, looser further down.
   */
  none: "",
};

export type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  padding?: ContainerPadding;
};

export function Container({
  padding = "default",
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(contentFrame, paddingStyles[padding], className)}
      {...props}
    />
  );
}
