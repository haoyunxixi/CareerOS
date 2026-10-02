"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Used as `aria-label` and shown as the drawer header. */
  title: string;
  children: ReactNode;
  /** Optional footer slot — typically the cancel / save row. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Right-side drawer, sized to read as a sheet rather than a modal.
 *
 * Locked at `max-w-md` so the form inside always has a calm width regardless
 * of viewport — wider than that starts feeling like a page and less like a
 * focused input surface.
 *
 * - Body scroll locked while open.
 * - Escape closes, click on backdrop closes.
 * - Focus moves to the first focusable element on open and returns to the
 *   trigger on close.
 * - `aria-modal="true"` + `role="dialog"` so screen readers treat the drawer
 *   as the active surface.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Keep the latest callback without making it an effect dependency: the
  // parent re-renders on every keystroke inside the form, and a new
  // `onClose` identity here would re-run the open-effect mid-typing —
  // stealing focus from the input and breaking IME composition.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      // 229 / isComposing: Escape is first used to cancel an in-flight
      // IME composition (Chinese/Japanese input) — only a real Escape,
      // outside of composition, should close the drawer.
      if (event.key === "Escape" && !event.isComposing && event.keyCode !== 229) {
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKey);

    // Move focus into the panel once it has mounted.
    requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    });

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-canvas-raised shadow-soft",
          className,
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5 md:px-8">
          <h2 className="text-title font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 size-9 rounded-field text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink"
          >
            <span aria-hidden className="block text-body leading-none">×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          {children}
        </div>

        {footer ? (
          <footer className="border-t border-line bg-canvas-raised px-6 py-4 md:px-8">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}