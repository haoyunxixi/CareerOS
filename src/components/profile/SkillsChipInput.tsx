"use client";

import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface SkillsChipInputProps {
  /** Visible chips. */
  chips: string[];
  onAdd: (chip: string) => void;
  onRemove: (chip: string) => void;
  placeholder: string;
  className?: string;
}

/**
 * Minimal chip input — type + Enter to add, click × to remove. No external
 * state library: the parent owns `chips` and re-renders us with the new
 * array. Empty / whitespace-only submissions are silently dropped so the
 * user can mash Enter without polluting the list.
 */
export function SkillsChipInput({
  chips,
  onAdd,
  onRemove,
  placeholder,
  className,
}: SkillsChipInputProps) {
  const [value, setValue] = useState("");

  function commit() {
    const next = value.trim();
    if (!next) return;
    onAdd(next);
    setValue("");
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && value === "" && chips.length > 0) {
      // Quick erase: empty input + backspace removes the last chip.
      onRemove(chips[chips.length - 1]);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <ul className="flex flex-wrap gap-2" role="list">
        {chips.map((chip) => (
          <li key={chip}>
            <span className="inline-flex items-center gap-1 rounded-pill border border-line bg-canvas-raised px-3 py-1 text-meta text-ink">
              {chip}
              <button
                type="button"
                onClick={() => onRemove(chip)}
                aria-label={chip}
                className="-mr-1 ml-1 size-4 text-ink-faint transition-colors hover:text-ink"
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className="h-9 w-full rounded-field border border-line bg-canvas-raised px-3 text-body text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
    </div>
  );
}