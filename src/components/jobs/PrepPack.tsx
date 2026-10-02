"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { InterviewPrepPack } from "@/types";

export interface PrepPackProps {
  pack: InterviewPrepPack;
  locale: Locale;
}

/**
 * V3 — role- and industry-aware preparation pack.
 *
 * Renders what the shared role classification derived from THIS job's own
 * JD: the themes this kind of role is probed on, 1–2 business scenarios,
 * an honest industry brief (JD-derived only — CareerOS has no live web
 * access and never fakes "recent" news), and competitor / trend angles
 * (trend angles appear for content-operation roles only, and every item
 * is verify-before-use).
 */
export function PrepPack({ pack, locale }: PrepPackProps) {
  return (
    <section className="flex flex-col gap-8">
      <div>
        <SectionLabel>
          {pick(pack.roleFamily, locale)} · {pick(pack.industry, locale)}
        </SectionLabel>
        <p className="mt-3 max-w-2xl text-meta text-ink-muted">
          {locale === "zh-CN"
            ? "以下内容基于这个岗位的 JD 与角色类型动态生成——不同行业、不同岗位类型的准备重点不同。"
            : "Derived from this job's own JD and role classification — different industries and role types get different preparation priorities."}
        </p>
      </div>

      {/* 1 · themes this role is probed on */}
      <div className="flex flex-col gap-3">
        <h3 className="text-item font-semibold text-ink">
          {locale === "zh-CN" ? "这类岗位的重点考察方向" : "What this role is probed on"}
        </h3>
        <ul className="flex flex-wrap gap-2" role="list">
          {pack.themes.map((theme, i) => (
            <li
              key={i}
              className="rounded-full border border-line px-3 py-1 text-meta text-ink-muted"
            >
              {pick(theme, locale)}
            </li>
          ))}
        </ul>
      </div>

      {/* 2 · business scenarios */}
      {pack.scenarios.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h3 className="text-item font-semibold text-ink">
            {locale === "zh-CN" ? "业务场景演练" : "Business scenario drills"}
          </h3>
          {pack.scenarios.map((scenario, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 border-t border-line pt-4 first:border-t-0 first:pt-0"
            >
              <p className="text-body font-medium text-ink">
                {pick(scenario.title, locale)}
              </p>
              <p className="text-prose text-ink-muted">
                {pick(scenario.prompt, locale)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* 3 · industry & company brief (JD-derived, honestly labelled) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-item font-semibold text-ink">
          {locale === "zh-CN" ? "行业与业务视角" : "Industry & company lens"}
        </h3>
        <ul className="flex flex-col gap-3" role="list">
          {pack.industryBrief.map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-3 border-t border-line pt-3 first:border-t-0 first:pt-0"
            >
              <span
                aria-hidden
                className="mt-[0.6rem] size-1 shrink-0 self-start rounded-full bg-line-strong"
              />
              <span className="text-prose text-ink-muted">
                {pick(line, locale)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4 · competitor angles */}
      {pack.competitorAngles.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-item font-semibold text-ink">
            {locale === "zh-CN"
              ? "竞品分析：值得形成自己的观点"
              : "Competitor angles worth an opinion"}
          </h3>
          <ul className="flex flex-col gap-2" role="list">
            {pack.competitorAngles.map((angle, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-body text-ink"
              >
                <span
                  aria-hidden
                  className="mt-[0.6rem] size-1 shrink-0 self-start rounded-full bg-line-strong"
                />
                <span>{pick(angle, locale)}</span>
              </li>
            ))}
          </ul>
          <p className="text-meta text-ink-faint">
            {locale === "zh-CN"
              ? "面试前请自行补充竞品资料（官网、产品体验、公开文章）——面试官问「你怎么看我们和竞品的差异」时，从上面几个维度展开你的判断。"
              : "Bring your own competitor material (official sites, hands-on product time, public write-ups). When asked how the company differs from competitors, expand your judgement along these dimensions."}
          </p>
        </div>
      ) : null}

      {/* 5 · trend intelligence — content operation only, verify-first */}
      {pack.trendAngles.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-item font-semibold text-ink">
            {locale === "zh-CN"
              ? "内容趋势视角（需自行验证）"
              : "Content trend lens (verify yourself)"}
          </h3>
          <ul className="flex flex-col gap-2" role="list">
            {pack.trendAngles.map((angle, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-body text-ink"
              >
                <span
                  aria-hidden
                  className="mt-[0.6rem] size-1 shrink-0 self-start rounded-full bg-line-strong"
                />
                <span>{pick(angle, locale)}</span>
              </li>
            ))}
          </ul>
          <p className="text-meta text-ink-faint">
            {locale === "zh-CN"
              ? "CareerOS 无法获取实时热点。以上是值得你自己去核实的内容方向——只引用你真正了解、能讲清来龙去脉的趋势和案例，不要为了「显得懂」硬塞热梗。"
              : "CareerOS has no live web access. These are directions to verify yourself — only cite trends and cases you genuinely understand and can explain, never pad answers with hot references for the sake of it."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
