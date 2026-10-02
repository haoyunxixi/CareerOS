import type { Config } from "tailwindcss";

/**
 * Tailwind mapping layer for the CareerOS V2 design system.
 *
 * Every value here points back to a CSS custom property in
 * `src/app/globals.css`, so the design tokens have a single source of truth.
 *
 * Typography scale (V2.1, calibrated for density & CJK comfort):
 *   hero 42→64 (serif, Home hero only) · page 34→44 (serif, page titles) ·
 *   title 22→26 (section title) · item 17→18 (item title) ·
 *   lead 18 · prose 16 · body 16 · btn 15 · meta 14 · micro 12.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "rgb(var(--color-canvas) / <alpha-value>)",
          raised: "rgb(var(--color-canvas-raised) / <alpha-value>)",
          sunken: "rgb(var(--color-canvas-sunken) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
          faint: "rgb(var(--color-ink-faint) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--color-line) / <alpha-value>)",
          strong: "rgb(var(--color-line-strong) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        /** Editorial voice — hero, page titles, rare quotes only. */
        serif: ["var(--font-serif)"],
      },
      fontSize: {
        /** Home hero only. 42px mobile → 64px desktop, serif, weight 500. */
        hero: [
          "clamp(2.625rem, 4.6vw, 4rem)",
          { lineHeight: "var(--leading-hero)", letterSpacing: "var(--tracking-hero)" },
        ],
        /** First-level page titles. 34px mobile → 44px desktop, serif, weight 500. */
        page: [
          "clamp(2.125rem, 3.3vw, 2.75rem)",
          { lineHeight: "1.15", letterSpacing: "var(--tracking-title)" },
        ],
        /** Section titles. 22px mobile → 26px desktop, sans, weight 600. */
        title: [
          "clamp(1.375rem, 1.8vw, 1.625rem)",
          { lineHeight: "1.3", letterSpacing: "var(--tracking-title)" },
        ],
        /** Item titles: case / story / experience / question rows. 17→18px, weight 600. */
        item: ["clamp(1.0625rem, 1.15vw, 1.125rem)", { lineHeight: "1.45" }],
        lead: ["1.125rem", { lineHeight: "1.6" }],
        /** Primary reading size: long-form AI output and story detail. */
        prose: ["1rem", { lineHeight: "1.75" }],
        /** Default body text. */
        body: ["1rem", { lineHeight: "1.7" }],
        /** Buttons. */
        btn: ["0.9375rem", { lineHeight: "20px" }],
        /** Time, status, metadata. */
        meta: ["0.875rem", { lineHeight: "1.5" }],
        /** Small labels only — never main information. */
        micro: ["0.75rem", { lineHeight: "1.45", letterSpacing: "0.01em" }],
        stat: [
          "clamp(1.75rem, 2.1vw, 2rem)",
          { lineHeight: "1", letterSpacing: "var(--tracking-number)" },
        ],
      },
      /** Deliberately restrained radii: cards are not pills. */
      borderRadius: {
        field: "0.625rem",
        btn: "0.625rem",
        card: "0.75rem",
        panel: "0.75rem",
        pill: "9999px",
      },
      /** One faint elevation level for the entire product. */
      boxShadow: {
        soft: "0 1px 1px rgb(var(--color-ink) / 0.02), 0 24px 48px -38px rgb(var(--color-ink) / 0.22)",
      },
      transitionTimingFunction: {
        calm: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
