"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Brand cellophane — the CareerOS crumpled-film motif.
 *
 * The artwork is a real transparent image asset, not a generated material. Drop
 * the files into `public/brand/cellophane/` and this component picks them up:
 * no page has to change afterwards.
 *
 * Decoration contract:
 * - `pointer-events-none` + `aria-hidden`, so it can never swallow a click or
 *   reach assistive technology.
 * - Absolutely positioned and width-only, so it is completely out of flow: it
 *   reserves no space, cannot shift layout, and its position is owned entirely
 *   by the call site (anchor it through `className`, e.g. `right-0 top-0`).
 * - Invisible until the file has actually loaded, and removed from the DOM if
 *   the request fails. A missing asset is a silent no-op — never a broken image
 *   icon, never a console error.
 * - No animation.
 */

export type BrandCellophaneVariant = "hero" | "card" | "memory";
export type BrandCellophaneSize = "sm" | "md" | "lg" | "xl";
export type BrandCellophaneCrop = "right" | "none";

/** `public/` paths. Replace the files, keep the names. */
const ASSETS: Record<BrandCellophaneVariant, string> = {
  hero: "/brand/cellophane/hero-cellophane.webp",
  card: "/brand/cellophane/card-cellophane.webp",
  memory: "/brand/cellophane/memory-cellophane.webp",
};

/**
 * Width per variant and size, stepped across breakpoints so the film keeps its
 * proportion on every screen. Sizing deliberately lives here instead of
 * `className`: `cn` only joins class strings, so two competing `w-*` utilities
 * would be decided by stylesheet order rather than by the call site.
 *
 * `xl` is reserved for the hero variant because the headline-sized film is
 * the only context where a square that large still reads as decoration rather
 * than content.
 */
const WIDTHS: Record<
  BrandCellophaneVariant,
  Partial<Record<BrandCellophaneSize, string>>
> = {
  hero: {
    sm: "w-[140px] md:w-[200px] lg:w-[280px]",
    md: "w-[170px] md:w-[240px] lg:w-[320px]",
    lg: "w-[200px] md:w-[280px] lg:w-[360px]",
    xl: "w-[260px] md:w-[360px] lg:w-[480px]",
  },
  card: {
    sm: "w-[120px] md:w-[140px] lg:w-[160px]",
    md: "w-[150px] md:w-[180px] lg:w-[200px]",
    lg: "w-[180px] md:w-[200px] lg:w-[240px]",
  },
  memory: {
    sm: "w-[120px] md:w-[150px] lg:w-[180px]",
    md: "w-[150px] md:w-[190px] lg:w-[230px]",
    lg: "w-[180px] md:w-[230px] lg:w-[280px]",
  },
};

export interface BrandCellophaneProps {
  variant: BrandCellophaneVariant;
  /**
   * Defaults to `md`. The `xl` step is hero-only: a square that big reads as
   * content anywhere except the headline whitespace.
   */
  size?: BrandCellophaneSize;
  /** Opacity of the film once loaded. Kept low on purpose. Defaults to `0.14`. */
  opacity?: number;
  /** Degrees clockwise. `0` leaves the asset untouched. */
  rotation?: number;
  /**
   * Optional asset override. Defaults to the path mapped from `variant`. Pass an
   * explicit `src` to reuse a different film while the proper variant asset is
   * still pending — drop-in replacement just means removing the override.
   */
  src?: string;
  /**
   * Hides a portion of the film without changing its box, so the visible
   * proportion is independent of viewport size. `"right"` clips the right
   * 25%, leaving 75% visible.
   */
  crop?: BrandCellophaneCrop;
  /** Position and any other decoration utilities. Owned by the call site. */
  className?: string;
}

export function BrandCellophane({
  variant,
  size = "md",
  opacity = 0.14,
  rotation = 0,
  src,
  crop = "none",
  className,
}: BrandCellophaneProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);

  // Reconcile the cached state with whatever the <img> already did before
  // React attached its handlers. Without this, an asset that finishes loading
  // between SSR and hydration would leave `loaded` stuck at `false` forever
  // and the film would render at `0` opacity indefinitely.
  useEffect(() => {
    const image = imageRef.current;
    if (!image?.complete) return;
    if (image.naturalWidth === 0) setMissing(true);
    else setLoaded(true);
  }, []);

  if (missing) return null;

  return (
    // A plain <img> on purpose: the asset must keep its own intrinsic ratio and
    // stay swappable by filename alone, whereas next/image would pin the
    // artwork to hard-coded dimensions.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={src ?? ASSETS[variant]}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      onLoad={(event) => {
        if (event.currentTarget.naturalWidth === 0) setMissing(true);
        else setLoaded(true);
      }}
      onError={() => setMissing(true)}
      style={{
        // Held at zero until the file proves it exists, so a failed request is
        // never visible even for a frame.
        opacity: loaded ? opacity : 0,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        clipPath: crop === "right" ? "inset(0 25% 0 0)" : undefined,
      }}
      className={cn(
        "pointer-events-none absolute object-contain select-none",
        WIDTHS[variant][size] ?? "",
        className,
      )}
    />
  );
}