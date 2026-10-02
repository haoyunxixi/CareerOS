import type { CareerEvent } from "@/types";
import type { Locale } from "@/i18n/config";

/**
 * Phase 10 demo seed — a handful of career events for Alex's demo mode, so
 * Journey and Bubble show the product experience out of the box. Local users
 * never see these (their events live in localStorage), and local events never
 * appear here.
 */

interface DemoEventDef {
  id: string;
  eventType: CareerEvent["eventType"];
  sourceType: CareerEvent["sourceType"];
  jobId?: string;
  content: { "zh-CN": string; en: string };
  createdAt: string;
}

const DEFS: DemoEventDef[] = [
  {
    id: "demo-event-1",
    eventType: "bubble",
    sourceType: "bubble",
    content: {
      "zh-CN": "终于拿到第一次面试了。",
      en: "Finally got my first interview.",
    },
    createdAt: "2026-09-20T09:12:00.000Z",
  },
  {
    id: "demo-event-2",
    eventType: "bubble",
    sourceType: "bubble",
    jobId: "bytedance-ai-product-operation",
    content: {
      "zh-CN": "二面一定要准备商业化问题。",
      en: "Round two — I must prepare for business-model questions.",
    },
    createdAt: "2026-09-24T13:40:00.000Z",
  },
  {
    id: "demo-event-3",
    eventType: "bubble",
    sourceType: "bubble",
    content: {
      "zh-CN": "今天第一次感觉自己能完整讲清这个项目了。",
      en: "For the first time I could walk through the whole project clearly.",
    },
    createdAt: "2026-09-26T21:05:00.000Z",
  },
];

/** The seed in the requested locale (content is authored bilingually). */
export function demoCareerEvents(locale: Locale): CareerEvent[] {
  return DEFS.map((def) => ({
    id: def.id,
    eventType: def.eventType,
    sourceType: def.sourceType,
    ...(def.jobId ? { jobId: def.jobId } : {}),
    content: def.content[locale],
    createdAt: def.createdAt,
  }));
}
