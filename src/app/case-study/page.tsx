import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ButtonLink } from "@/components/ui/button";
import { resolveLocale } from "@/i18n/server";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { LocalizedText } from "@/types";

export const metadata: Metadata = {
  title: "Case Study",
  description:
    "CareerOS — AI interview preparation & reflection. How the product converged from a broad career OS into one interview loop.",
};

const L = (zh: string, en: string): LocalizedText => ({ "zh-CN": zh, en });

/**
 * Minimal static portfolio entry. No CMS, no animation, no dependencies —
 * just the existing design system and the one story worth telling.
 */
export default async function CaseStudyPage() {
  const locale: Locale = await resolveLocale();
  const zh = locale === "zh-CN";

  const sections: { label: string; body: LocalizedText[] }[] = [
    {
      label: zh ? "问题" : "Problem",
      body: [
        L(
          "第一次系统性求职时，Resume、JD、Preparation、Mock 和真实面试的学习是相互割裂的：改简历不记得面试被问过什么，练完 mock 也不会回流到下一轮准备。",
          "In a first serious job search, the resume, the JD, preparation, mock practice and real-interview learning all live apart — resume edits forget what was asked, and mock practice never flows back into the next round.",
        ),
      ],
    },
    {
      label: zh ? "核心流程" : "Core Flow",
      body: [
        L(
          "Resume / Story Bank → Interview Case → JD Analysis → Role-aware Preparation → Mock Interview → Real Interview Review → Next Round。一个闭环，而不是五个工具。",
          "Resume / Story Bank → Interview Case → JD Analysis → Role-aware Preparation → Mock Interview → Real Interview Review → Next Round. One loop, not five tools.",
        ),
      ],
    },
    {
      label: zh ? "AI 设计" : "AI Design",
      body: [
        L(
          "Resume + JD + Story + Role Pattern + Interview Memory → Unified Context → Preparation / Questions / Follow-up / Feedback。所有 AI 输出共用同一个真实上下文，绝不编造经历或结果。",
          "Resume + JD + Story + Role Pattern + Interview Memory → Unified Context → Preparation / Questions / Follow-up / Feedback. Every AI surface shares one real context — no invented experience, no fabricated results.",
        ),
      ],
    },
    {
      label: zh ? "关键迭代" : "Key Iteration",
      body: [
        L(
          "从大而全的 Career OS，收敛到面试准备与复盘这一件事。",
          "Converged from a broad career OS into one thing: interview preparation and reflection.",
        ),
      ],
    },
    {
      label: zh ? "我的角色" : "My Role",
      body: [
        L(
          "Product Strategy · AI Workflow · Prompt / Context Design · Vibe Coding · Testing & Iteration",
          "Product Strategy · AI Workflow · Prompt / Context Design · Vibe Coding · Testing & Iteration",
        ),
      ],
    },
  ];

  return (
    <Container>
      <article className="mx-auto flex w-full max-w-2xl flex-col gap-12 py-16 md:py-24">
        <header className="flex flex-col gap-4">
          <SectionLabel>
            {zh ? "作品" : "Case Study"}
          </SectionLabel>
          <h1 className="font-serif text-page font-medium text-ink">
            CareerOS
          </h1>
          <p className="text-lead text-ink-muted">
            {zh
              ? "AI 面试准备与复盘"
              : "AI Interview Preparation & Reflection"}
          </p>
        </header>

        {sections.map((section) => (
          <section key={section.label} className="flex flex-col gap-4">
            <h2 className="text-title font-semibold text-ink">
              {section.label}
            </h2>
            {section.body.map((line, i) => (
              <p key={i} className="text-prose text-ink-muted">
                {pick(line, locale)}
              </p>
            ))}
          </section>
        ))}

        <div className="border-t border-line pt-8">
          <ButtonLink href="/" variant="primary">
            {zh ? "试用 CareerOS" : "Try CareerOS"}
          </ButtonLink>
        </div>
      </article>
    </Container>
  );
}
