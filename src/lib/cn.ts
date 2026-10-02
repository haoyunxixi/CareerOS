export type ClassValue = string | number | false | null | undefined;

/**
 * Tiny class name joiner. Kept dependency-free on purpose: no `clsx` and no
 * `tailwind-merge` in Phase 1, because component APIs stay explicit instead of
 * relying on class overrides.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
