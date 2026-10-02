"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Localised label for the `role="tablist"`. */
  ariaLabel: string;
  className?: string;
}

/**
 * Editorial-style underline tabs. The selected item gets a single accent rule
 * instead of a filled pill — the design system only has one accent tone and it
 * spends it on *active state*.
 */
export function Tabs({ items, activeId, onChange, ariaLabel, className }: TabsProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-6 overflow-x-auto border-b border-line"
      >
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`tab-panel-${item.id}`}
              id={`tab-${item.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.id)}
              className={cn(
                "relative -mb-px whitespace-nowrap pb-3 pt-1 text-meta transition-colors duration-200",
                active
                  ? "text-ink"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 -bottom-px h-[1.5px] bg-accent transition-opacity duration-200",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`tab-panel-${item.id}`}
          aria-labelledby={`tab-${item.id}`}
          hidden={item.id !== activeId}
          className="pt-8 md:pt-10"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}