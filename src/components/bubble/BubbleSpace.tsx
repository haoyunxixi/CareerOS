"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import { formatEventDate } from "@/lib/journey";
import type { CareerEvent } from "@/types";

/**
 * Bubble — the unstructured Career Memory entry point. Thoughts that do not
 * need to become conclusions yet.
 *
 * Every bubble IS a CareerEvent (eventType "bubble"), saved by the caller
 * (local mode: localStorage; demo mode: read-only seed). All visual variants
 * — kind (soap / cloud), size, depth layer, drift rhythm, slot — derive
 * deterministically from the event id (never Math.random at render), so
 * nothing jumps between renders. Pure CSS motion, no physics.
 *
 * Layout: a quiet thought field (min ~78vh on desktop). Real soap / cloud
 * bubbles float at three depths; a handful of decorative ambient bubbles
 * (no text, not clickable, never user data) keep the air from feeling empty.
 * Mobile switches to a calm vertical flow.
 */

export interface BubbleJobOption {
  id: string;
  label: string;
}

// ---------------------------------------------------- deterministic variants ---

/** Real circles only — the roundness lives in CSS (border-radius: 50%). */
type BubbleKind = "soap" | "cloud";

/** Four drift directions, chosen by id hash. */
const DRIFTS = ["a", "b", "c", "d"] as const;
type DriftName = (typeof DRIFTS)[number];

type BubbleSize = "sm" | "md" | "lg";

/** Pixel ranges per tier: sm 120–145, md 165–200, lg 220–260. */
const SIZE_RANGES: Record<BubbleSize, [number, number]> = {
  sm: [120, 145],
  md: [165, 200],
  lg: [220, 260],
};

/** Three visual depths. Background layers are quieter; foreground clearer. */
const LAYERS = [
  { z: 1, opacity: 0.86 },
  { z: 2, opacity: 0.94 },
  { z: 3, opacity: 1 },
];

/**
 * Twelve stable position slots spread across the field — left-top, middle,
 * right, lower — never a grid. Bubbles beyond 12 wrap to a new band below
 * (stable px offset), so the field grows instead of overlapping.
 * The bottom ~28% stays calm for the composer.
 */
const SLOTS = [
  { x: 3, y: 8 },
  { x: 30, y: 3 },
  { x: 55, y: 14 },
  { x: 78, y: 6 },
  { x: 8, y: 36 },
  { x: 36, y: 42 },
  { x: 62, y: 32 },
  { x: 82, y: 40 },
  { x: 4, y: 62 },
  { x: 30, y: 66 },
  { x: 58, y: 58 },
  { x: 80, y: 64 },
];

const SLOT_COUNT = SLOTS.length;

/**
 * Instead of filling the slots row by row, bubbles are assigned across
 * regions (top-left → middle → right → lower), so even 3–4 bubbles spread
 * over the whole field instead of clustering in one corner.
 */
const SLOT_SPREAD = [0, 5, 10, 1, 7, 9, 3, 6, 11, 2, 8, 4];

/** Vertical band for each wrap cycle beyond the first 12 bubbles. */
const CYCLE_BAND_PX = 300;

/** CSSProperties plus the per-bubble custom properties we set inline. */
type BubbleStyle = CSSProperties & Record<string, string | number | undefined>;

function sizeFor(content: string): BubbleSize {
  const len = content.length;
  if (len <= 16) return "sm";
  if (len <= 48) return "md";
  return "lg";
}

function fontSizeFor(size: BubbleSize): string {
  if (size === "sm") return "0.8rem";
  if (size === "md") return "0.9rem";
  return "1rem";
}

function hashString(value: string): number {
  let h = 0;
  for (const ch of value) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Everything visual about one bubble, derived from its id + content. */
function bubbleVariants(event: CareerEvent, index: number) {
  const h = hashString(event.id);
  const slot = SLOTS[SLOT_SPREAD[index % SLOT_COUNT]];
  const cycle = Math.floor(index / SLOT_COUNT);

  // Slot + hash jitter, clamped so nothing bleeds off the field.
  const x = clamp(slot.x + ((h >> 5) % 7) - 3, 1, 82);
  const y = clamp(slot.y + ((h >> 8) % 5) - 2, 1, 68);
  const top =
    cycle === 0 ? `${y}%` : `calc(${y}% + ${cycle * CYCLE_BAND_PX}px)`;

  // ~25% cloud bubbles, stable by id.
  const kind: BubbleKind = (h & 3) === 3 ? "cloud" : "soap";

  // Size: tier from text length, exact px jittered by id hash.
  const tier = sizeFor(event.content);
  const [lo, hi] = SIZE_RANGES[tier];
  const px = lo + (h % (hi - lo + 1));

  // Drift: one of four keyframes, 9–15s (clouds a touch slower), negative
  // delay so the field is never in sync. Amplitude: y 20–36, x 10–24,
  // rotate ±1.5deg.
  const drift: DriftName = DRIFTS[(h >> 12) % DRIFTS.length];
  const dur = kind === "cloud" ? 13 + (h % 3) : 9 + (h % 4);
  const delay = -((h >> 4) % 12);
  const fy = 20 + ((h >> 6) % 17);
  const fx = 10 + ((h >> 9) % 15);
  const rot = ((h >> 3) % 31) / 10 - 1.5;
  const r0 = rot.toFixed(2);
  const r1 = (-rot).toFixed(2);

  return {
    kind,
    tier,
    px,
    drift,
    dur,
    delay,
    fx,
    fy,
    r0,
    r1,
    layer: LAYERS[(h >> 2) % LAYERS.length],
    // Mobile flow: a calm left / centre / right stagger by hash.
    flow: (h >> 13) % 3,
    position: { x, top },
  };
}

// ------------------------------------------------------------------ component ---

export function BubbleSpace({
  events,
  jobs,
  mode,
  locale,
  onAdd,
  onDelete,
}: {
  /** Bubble events only (eventType "bubble"). */
  events: CareerEvent[];
  jobs: BubbleJobOption[];
  mode: "demo" | "local";
  locale: Locale;
  onAdd?: (content: string, jobId?: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [jobId, setJobId] = useState("");
  const [selected, setSelected] = useState<CareerEvent | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function add() {
    const content = text.trim();
    if (!content || !onAdd) return;
    onAdd(content, jobId || undefined);
    setText("");
    setJobId("");
  }

  const jobLabel = (id?: string) =>
    id ? (jobs.find((j) => j.id === id)?.label ?? null) : null;

  const maxCycle =
    events.length > 0 ? Math.floor((events.length - 1) / SLOT_COUNT) : 0;

  return (
    <Container padding="none" className="pb-24 pt-8 md:pt-10">
      <div className="flex w-full flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("bubble.eyebrow")}
          </p>
          <h1 className="text-title font-medium text-ink">
            {t("bubble.title")}
          </h1>
          <p className="max-w-xl text-body text-ink-muted">
            {t("bubble.note")}
          </p>
          {events.length > 0 ? (
            <p className="text-meta text-ink-faint">
              {t("bubble.count", { count: events.length })}
            </p>
          ) : null}
        </header>

        {/* ------------------------------------------------ the thought field --- */}
        <div
          className="bubble-field relative flex flex-col gap-8 overflow-x-clip px-5 py-8 md:px-8 lg:block lg:min-h-[78vh] lg:px-0 lg:py-0"
          style={
            maxCycle > 0
              ? { minHeight: `calc(78vh + ${maxCycle * CYCLE_BAND_PX}px)` }
              : undefined
          }
        >
          {events.length === 0 ? <EmptyField /> : null}

          <AmbientBubbles />

          {events.map((event, index) => (
            <BubbleChip
              key={event.id}
              event={event}
              index={index}
              onOpen={() => {
                setConfirmingDelete(false);
                setSelected(event);
              }}
            />
          ))}

          {/* Composer / demo note — bottom of the field on desktop, last
              row of the vertical flow on mobile. */}
          {mode === "local" ? (
            <div className="relative z-40 mt-2 lg:absolute lg:inset-x-0 lg:bottom-8 lg:mt-0 lg:flex lg:justify-center lg:px-8">
              <div className="flex w-full max-w-[680px] flex-col gap-3 rounded-field border border-line/70 bg-canvas-raised/70 px-5 py-4 shadow-[0_6px_18px_rgb(29_29_31/0.04)] backdrop-blur-md">
                <textarea
                  rows={2}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("bubble.placeholder")}
                  className="w-full resize-none bg-transparent text-body leading-[1.6] text-ink placeholder:text-ink-faint focus:outline-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-meta text-ink-muted">
                    <span>{t("bubble.linkJob")}</span>
                    <select
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                      className="max-w-[14rem] rounded-field border border-line bg-canvas-raised px-2 py-1.5 text-meta text-ink focus:border-accent focus:outline-none"
                    >
                      <option value="">{t("bubble.noJob")}</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={add}
                    disabled={!text.trim()}
                  >
                    {t("bubble.add")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-40 mt-2 text-center lg:absolute lg:inset-x-0 lg:bottom-8 lg:mt-0">
              <p className="text-meta text-ink-faint">
                {t("bubble.demoNote")}{" "}
                <Link
                  href="/onboarding"
                  className="text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {t("auth.startCta")}
                </Link>
              </p>
            </div>
          )}
        </div>

        {selected ? (
          <BubbleDetail
            event={selected}
            locale={locale}
            linkedLabel={jobLabel(selected.jobId)}
            canDelete={mode === "local" && !!onDelete}
            confirming={confirmingDelete}
            onConfirmingChange={setConfirmingDelete}
            onClose={() => {
              setSelected(null);
              setConfirmingDelete(false);
            }}
            onDelete={() => {
              onDelete?.(selected.id);
              setSelected(null);
              setConfirmingDelete(false);
            }}
          />
        ) : null}
      </div>
    </Container>
  );
}

// ------------------------------------------------------------------- bubble ---

function BubbleChip({
  event,
  index,
  onOpen,
}: {
  event: CareerEvent;
  index: number;
  onOpen: () => void;
}) {
  const v = bubbleVariants(event, index);

  // Drift wrapper (animated transform) — the button inside owns the hover
  // transform, so the two motions never fight. Anchored left or right by
  // slot side (desktop) so nothing can overflow the field horizontally;
  // top/left/right are simply ignored in the mobile static flow.
  const anchor =
    v.position.x > 58
      ? { right: `${100 - v.position.x}%` }
      : { left: `${v.position.x}%` };

  const driftStyle = {
    ...anchor,
    top: v.position.top,
    "--dur": `${v.dur}s`,
    "--delay": `${v.delay}s`,
    "--fx": `${v.fx}px`,
    "--fy": `${v.fy}px`,
    "--r0": `${v.r0}deg`,
    "--r1": `${v.r1}deg`,
    opacity: v.layer.opacity,
    zIndex: v.layer.z,
  } as BubbleStyle;

  return (
    <div
      style={driftStyle}
      className={cn(
        `bubble-drift-${v.drift} relative w-fit`,
        v.flow === 0 ? "self-start" : v.flow === 1 ? "self-center" : "self-end",
        "lg:absolute lg:self-auto",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        style={{ width: v.px, height: v.px, fontSize: fontSizeFor(v.tier) }}
        className={cn(
          "bubble-skin flex cursor-pointer items-center justify-center overflow-hidden p-[19%] text-center",
          v.kind === "cloud" ? "bubble-cloud" : "bubble-soap",
        )}
      >
        <span
          className={cn(
            "bubble-text line-clamp-3 leading-[1.5]",
            v.tier === "lg" && "line-clamp-4",
          )}
        >
          {event.content}
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------- ambient bubbles ---

/**
 * Five decorative bubbles — no text, not clickable, never user data.
 * They fill quiet corners and build foreground / midground / background
 * depth so the field never feels empty, even with one or two thoughts.
 * Desktop only; mobile keeps its calm vertical flow.
 */
const AMBIENT: {
  slot: number;
  size: number;
  kind: BubbleKind;
  blur?: number;
  opacity: number;
}[] = [
  { slot: 4, size: 108, kind: "cloud", blur: 3, opacity: 0.45 },
  { slot: 2, size: 62, kind: "soap", opacity: 0.5 },
  { slot: 7, size: 46, kind: "soap", blur: 2, opacity: 0.4 },
  { slot: 9, size: 78, kind: "cloud", opacity: 0.55 },
  { slot: 11, size: 38, kind: "soap", opacity: 0.5 },
];

function AmbientBubbles() {
  return (
    <>
      {AMBIENT.map((a, i) => {
        const h = hashString(`ambient-${i}`);
        const slot = SLOTS[a.slot];
        const anchor =
          slot.x > 55 ? { right: `${100 - slot.x}%` } : { left: `${slot.x}%` };
        const drift = DRIFTS[(h >> 1) % DRIFTS.length];
        const fy = 20 + ((h >> 3) % 17);
        const fx = 10 + ((h >> 5) % 15);
        const rot = ((h >> 7) % 31) / 10 - 1.5;
        return (
          <div
            key={i}
            aria-hidden
            style={
              {
                ...anchor,
                top: `${slot.y}%`,
                width: a.size,
                height: a.size,
                "--dur": `${10 + (h % 6)}s`,
                "--delay": `${-((h >> 9) % 14)}s`,
                "--fx": `${fx}px`,
                "--fy": `${fy}px`,
                "--r0": `${rot.toFixed(2)}deg`,
                "--r1": `${(-rot).toFixed(2)}deg`,
                opacity: a.opacity,
                filter: a.blur ? `blur(${a.blur}px)` : undefined,
              } as BubbleStyle
            }
            className={cn(
              `bubble-drift-${drift}`,
              "bubble-skin",
              a.kind === "cloud" ? "bubble-cloud" : "bubble-soap",
              "pointer-events-none absolute z-0 hidden lg:block",
            )}
          />
        );
      })}
    </>
  );
}

// -------------------------------------------------------------- empty field ---

/** No bubbles yet: just the quiet line — ambient bubbles keep the air alive. */
function EmptyField() {
  const { t } = useTranslation();

  return (
    <div className="pointer-events-none relative z-10 flex flex-1 items-center justify-center py-16 lg:absolute lg:inset-0 lg:py-0">
      <p className="max-w-md px-6 text-center text-body text-ink-faint">
        {t("bubble.note")}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------- detail ---

function BubbleDetail({
  event,
  locale,
  linkedLabel,
  canDelete,
  confirming,
  onConfirmingChange,
  onClose,
  onDelete,
}: {
  event: CareerEvent;
  locale: Locale;
  linkedLabel: string | null;
  canDelete: boolean;
  confirming: boolean;
  onConfirmingChange: (v: boolean) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/25 backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("bubble.detail.title")}
        className="relative flex w-full max-w-md flex-col gap-5 rounded-card border border-line bg-canvas-raised/95 px-6 py-6 shadow-soft backdrop-blur-md"
      >
        <p className="text-meta text-ink-faint">
          {formatEventDate(event.createdAt, locale)}
        </p>
        <p className="text-lead leading-[1.6] text-ink">{event.content}</p>

        {linkedLabel && event.jobId ? (
          <p className="text-meta text-ink-muted">
            {t("bubble.linkedJob")}{" "}
            <Link
              href={`/jobs/${event.jobId}`}
              className="text-ink underline-offset-4 transition-colors hover:underline"
            >
              {linkedLabel}
            </Link>
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          {canDelete ? (
            confirming ? (
              <>
                <Button variant="ghost" size="md" onClick={() => onConfirmingChange(false)}>
                  {t("common.cancel")}
                </Button>
                <Button variant="primary" size="md" onClick={onDelete}>
                  {t("bubble.deleteConfirm")}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="md"
                onClick={() => onConfirmingChange(true)}
              >
                {t("bubble.delete")}
              </Button>
            )
          ) : null}
          <Button variant="secondary" size="md" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
