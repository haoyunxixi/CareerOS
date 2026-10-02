import type { Locale } from "@/i18n/config";
import { pick } from "@/lib/localize";
import { AiError } from "@/lib/ai/errors";
import {
  AI_PROVIDER_BASE_URL,
  LLM_MODEL,
  LLM_TIMEOUT_MS,
  aiApiKey,
  resolveAiMode,
} from "@/lib/ai/config";
import { logAiRequest } from "@/lib/ai/log";
import { findMatch } from "@/data/mock-matches";
import { sharedStoryBank } from "@/lib/interview-preparation";
import { getJobEntry, getProfileForViewer } from "@/lib/user-data";
import { buildRoleContext, type RoleContext } from "@/lib/ai/role-context";
import type { InterviewStory, JobMatch } from "@/types";

/**
 * Self-introduction generation V3 — server-side only.
 *
 * One AI call, one editable draft — but the output is now structured as
 * three parts so the candidate sees the reasoning, not just prose:
 *
 *   A. direction — one sentence: why THIS candidate relates to THIS job.
 *   B. evidence  — the 2–3 real experiences/stories most relevant here.
 *   C. draft     — the ~60 second self introduction itself.
 *
 * The context is assembled from the SAME data the rest of the interview
 * flow reads (job, JD analysis, Match, Career Profile, Story Bank) plus the
 * shared role/industry classification, so two jobs with the same title but
 * different industries produce clearly different drafts. Banned: generic
 * AI job-hunting filler ("充满热情", "学习能力较强"…) unless real evidence
 * follows it. Missing results stay missing. Mock mode is deterministic.
 */

// ---------------------------------------------------------------- result ---

export interface SelfIntroEvidence {
  title: string;
  /** Why this piece of evidence matters for THIS job. */
  why: string;
}

export interface SelfIntroductionResult {
  /** A — the core narrative direction, one sentence. */
  direction: string;
  /** B — 2–3 recommended pieces of real evidence. */
  evidence: SelfIntroEvidence[];
  /** C — the ~60 second draft (editable by the user). */
  draft: string;
}

// ---------------------------------------------------------------- context ---

export interface SelfIntroContext {
  company: string;
  title: string;
  roleSummary: string;
  roleContext: RoleContext;
  /** Top requirements (must first) with the profile's current support. */
  requirements: { text: string; importance: string; status: string }[];
  education: string;
  targetRoles: string[];
  experiences: { title: string; description: string }[];
  /** The user's Story Bank — real stories only, with STAR completeness. */
  stories: {
    title: string;
    skills: string[];
    learning: string;
    hasResult: boolean;
  }[];
  /** Strongest evidence for this job, most relevant first. */
  strengths: { title: string; description: string }[];
}

export async function buildSelfIntroContext(
  jobId: string,
  locale: Locale,
): Promise<SelfIntroContext | null> {
  const entry = await getJobEntry(jobId);
  if (!entry || !entry.job.jd.trim()) return null;
  const { job, analysis } = entry;
  const { profile } = await getProfileForViewer(jobId);
  if (!profile) return null;

  const match: JobMatch =
    findMatch(jobId) ?? {
      jobId,
      evidence: [],
      matches: [],
      strengths: [],
      gaps: [],
      nextActions: [],
    };

  const requirements = [...match.matches]
    .sort((a, b) =>
      a.importance === "must" ? -1 : b.importance === "must" ? 1 : 0,
    )
    .slice(0, 6)
    .map((m) => ({
      text: pick(m.requirement, locale),
      importance: m.importance,
      status: m.status,
    }));

  // Experiences behind the strongest evidence first — the factual ground
  // truth the draft may reference.
  const sourceRank = new Map(
    match.strengths.map((e, i) => [e.sourceId, i] as const),
  );
  const experiences = [...profile.experiences]
    .sort(
      (a, b) => (sourceRank.get(a.id) ?? 99) - (sourceRank.get(b.id) ?? 99),
    )
    .slice(0, 6)
    .map((exp) => ({
      title: pick(exp.title, locale),
      description: pick(exp.description, locale),
    }));

  // The shared Story Bank (profile-anchored, one source of truth for every
  // job — same helper the preparation flow reads).
  const bank: InterviewStory[] = sharedStoryBank();
  const strengthSourceIds = new Set(match.strengths.map((e) => e.sourceId));
  const stories = [
    ...bank.filter((s) => strengthSourceIds.has(s.sourceId)),
    ...bank.filter((s) => !strengthSourceIds.has(s.sourceId)),
    ]
    .slice(0, 5)
    .map((s) => ({
      title: pick(s.title, locale),
      skills: s.relatedSkills.map((skill) => pick(skill, locale)),
      learning: pick(s.learning, locale),
      hasResult: Boolean(s.result),
    }));

  return {
    company: pick(job.company, locale),
    title: pick(job.title, locale),
    roleSummary: pick(analysis.roleSummary, locale),
    roleContext: buildRoleContext(job, analysis),
    requirements,
    education: [
      pick(profile.basic.education.degree, locale),
      pick(profile.basic.education.major, locale),
    ].join(" · "),
    targetRoles: profile.basic.target.roles.map((r) => pick(r, locale)),
    experiences,
    stories,
    strengths: match.strengths.slice(0, 3).map((e) => ({
      title: pick(e.title, locale),
      description: e.description ? pick(e.description, locale) : "",
    })),
  };
}

// -------------------------------------------------------------- mock mode ---

const MAX_DRAFT_CHARS = 1500;

/** Role- and industry-aware one-line narrative direction. */
function mockDirection(ctx: SelfIntroContext, locale: Locale): string {
  const zh = locale === "zh-CN";
  const family = pick(ctx.roleContext.familyLabel, locale);
  const industry = pick(ctx.roleContext.industry.label, locale);
  const topRequirement = ctx.requirements[0]?.text;
  if (zh) {
    return `叙事方向：把你的${ctx.experiences[0]?.title ?? "真实经历"}中的${
      topRequirement ?? ctx.roleSummary
    }相关经验，对准「${ctx.company}」在${industry}业务里对${family}岗位的核心要求。`;
  }
  return `Narrative direction: aim the ${
    topRequirement ?? ctx.roleSummary
  }-related experience in ${
    ctx.experiences[0]?.title ?? "your real experience"
  } at what ${ctx.company}'s ${industry} business needs from a ${family} seat.`;
}

/** B — the 2–3 most relevant pieces of evidence, with an honest "why". */
function mockEvidence(
  ctx: SelfIntroContext,
  locale: Locale,
): SelfIntroEvidence[] {
  const zh = locale === "zh-CN";
  const out: SelfIntroEvidence[] = [];

  for (const strength of ctx.strengths.slice(0, 2)) {
    out.push({
      title: strength.title,
      why: zh
        ? `与该岗位的重点要求直接相关${strength.description ? `：${strength.description.slice(0, 80)}` : ""}`
        : `Directly relevant to this role's key requirements${strength.description ? `: ${strength.description.slice(0, 80)}` : ""}`,
    });
  }

  for (const story of ctx.stories.slice(0, 3)) {
    if (out.length >= 3) break;
    if (out.some((e) => e.title === story.title)) continue;
    out.push({
      title: story.title,
      why: zh
        ? `Story Bank 中与该岗位最匹配的故事${story.skills.length > 0 ? `（${story.skills.slice(0, 3).join("、")}）` : ""}${story.hasResult ? "" : "——注意：Result 还没写，讲之前先补上真实结果"}`
        : `The most relevant story in your Story Bank for this job${story.skills.length > 0 ? ` (${story.skills.slice(0, 3).join(", ")})` : ""}${story.hasResult ? "" : " — note: the Result is still unwritten; add the real outcome before you tell it"}`,
    });
  }

  return out.slice(0, 3);
}

/** C — the deterministic ~60s draft, grounded only in real context. */
function mockDraft(ctx: SelfIntroContext, locale: Locale): string {
  const zh = locale === "zh-CN";
  const topRequirement = ctx.requirements[0]?.text;
  const industry = pick(ctx.roleContext.industry.label, locale);
  const highlights = ctx.strengths.slice(0, 2);
  const lines: string[] = [];

  // Who I am.
  lines.push(
    zh
      ? `我是${ctx.education}背景、正在求职${ctx.targetRoles[0] ?? ctx.title}方向的候选人。`
      : `I'm a ${ctx.education} graduate targeting ${ctx.targetRoles[0] ?? ctx.title} roles.`,
  );

  // Why this role makes sense — grounded in the role/industry read.
  lines.push(
    zh
      ? `「${ctx.company} · ${ctx.title}」处在${industry}业务里，看重的是${topRequirement ?? ctx.roleSummary}——这正好是我过去经历里反复在做的事。`
      : `"${ctx.company} · ${ctx.title}" sits in a ${industry} business and cares about ${topRequirement ?? ctx.roleSummary} — which is what I kept doing across my past work.`,
  );

  // 2–3 pieces of evidence, each tied to real material.
  if (highlights.length > 0) {
    lines.push(
      zh
        ? `第一个想讲的经历是「${highlights[0].title}」——它最能对应这个岗位看重的能力${highlights[0].description ? `，我负责的部分包括：${highlights[0].description.slice(0, 120)}` : ""}。`
        : `The first story I'd bring up is "${highlights[0].title}" — it maps directly to what this role cares about${highlights[0].description ? `, and my part included: ${highlights[0].description.slice(0, 120)}` : ""}.`,
    );
  }
  const storyHighlight = ctx.stories.find(
    (s) => !highlights.some((h) => h.title === s.title),
  );
  if (storyHighlight) {
    lines.push(
      zh
        ? `第二个证据是「${storyHighlight.title}」（${storyHighlight.skills.slice(0, 3).join("、") || "核心技能"}）${storyHighlight.hasResult ? "" : "（这段的 Result 还没有写进 Story Bank，讲之前建议先补上真实结果）"}。`
        : `The second piece of evidence is "${storyHighlight.title}" (${storyHighlight.skills.slice(0, 3).join(", ") || "core skills"})${storyHighlight.hasResult ? "" : " (its Result is not in the Story Bank yet — add the real outcome before you tell it)"}.`,
    );
  }

  // Honest gap note instead of invented filler.
  if (ctx.stories.length === 0 && ctx.strengths.length === 0) {
    lines.push(
      zh
        ? "（提示：档案里目前还没有足够的故事证据支撑自我介绍，建议先在 Story Bank 中补充真实经历，再生成初稿。）"
        : "(Note: your profile doesn't have enough story evidence for a draft yet — add real experiences in the Story Bank first.)",
    );
  }

  // Why this opportunity + short closing, grounded in the JD.
  lines.push(
    zh
      ? `我希望在${industry}的真实业务里继续打磨${topRequirement ?? "这些能力"}，这也是我申请这个机会的原因。`
      : `I want to keep building ${topRequirement ?? "these capabilities"} inside a real ${industry} business — that's why I'm applying for this opportunity.`,
  );

  return lines.join("\n\n").slice(0, MAX_DRAFT_CHARS);
}

function mockSelfIntro(
  ctx: SelfIntroContext,
  locale: Locale,
): SelfIntroductionResult {
  return {
    direction: mockDirection(ctx, locale),
    evidence: mockEvidence(ctx, locale),
    draft: mockDraft(ctx, locale),
  };
}

// -------------------------------------------------------------- live mode ---

const BANNED_PHRASES = [
  "我一直对互联网行业充满热情",
  "我具有较强的学习能力",
  "我认为自己非常适合这个岗位",
  "我具有良好的沟通能力",
  "I have always been passionate about the internet industry",
  "I am a fast learner",
  "I believe I am a great fit for this position",
  "I have excellent communication skills",
];

function buildSystemPrompt(locale: Locale): string {
  const languageNames: Record<Locale, string> = {
    "zh-CN": "Simplified Chinese (简体中文)",
    en: "English",
  };
  return [
    "You are the self-introduction drafting assistant inside CareerOS, a career preparation product.",
    "You write ONE ~60-second self-introduction FIRST DRAFT for a specific job, based ONLY on the supplied context.",
    "",
    "Output structure (all three parts):",
    "A. direction — ONE sentence: why this candidate genuinely relates to THIS job (role family + industry + their real evidence).",
    "B. evidence — the 2–3 real experiences/stories most relevant to this job, each with one line of WHY it matters here.",
    "C. draft — the introduction itself, following:",
    "   Who I am → Why this role makes sense for me → the 2–3 relevant pieces of evidence (named, specific) → Why this opportunity → a short closing.",
    "",
    "Hard rules:",
    "1. NEVER invent experiences, skills, metrics, results or abilities that are not in the context. A missing result stays missing.",
    "2. Each piece of evidence must reference a real experience or story from the context by name.",
    "3. BANNED opening/filler phrases (unless immediately followed by real evidence from the context):",
    ...BANNED_PHRASES.map((p) => `   - "${p}"`),
    "4. The draft must be visibly tailored to the stated role family and industry — two jobs that differ only in industry must produce clearly different drafts, not just a swapped company name.",
    "5. If the evidence is too thin for a section, say so explicitly and tell the candidate what to add — do not pad.",
    "",
    `Respond in ${languageNames[locale]}.`,
    'Respond with ONLY a JSON object (no markdown) of this exact shape: { "direction": string, "evidence": [{ "title": string, "why": string }], "draft": string }',
  ].join("\n");
}

function buildUserPrompt(ctx: SelfIntroContext, locale: Locale): string {
  const zh = locale === "zh-CN";
  const roleLines = [
    `Role family: ${pick(ctx.roleContext.familyLabel, "en")}`,
    `Industry / vertical: ${pick(ctx.roleContext.industry.label, "en")}`,
    "Prep themes this role is typically probed on (use to angle the draft, not as content to claim):",
    ...ctx.roleContext.themes.map((t) => `- ${pick(t, "en")}`),
  ];
  return [
    `Job: ${ctx.company} — ${ctx.title}`,
    `Role summary: ${ctx.roleSummary}`,
    "",
    ...roleLines,
    "",
    "Key requirements (importance, current support):",
    ...ctx.requirements.map(
      (r) => `- ${r.text} (${r.importance}, ${r.status})`,
    ),
    "",
    `Candidate background: ${ctx.education}; target roles: ${ctx.targetRoles.join(", ")}.`,
    "",
    "Candidate's strongest evidence for THIS job (the most relevant material):",
    ...ctx.strengths.map(
      (s) => `- ${s.title}${s.description ? `: ${s.description.slice(0, 200)}` : ""}`,
    ),
    "",
    "Real experiences (the only material you may reference):",
    ...ctx.experiences.map(
      (e) => `- ${e.title}: ${e.description}`.slice(0, 400),
    ),
    "",
    "Story Bank (prepared interview stories):",
    ...ctx.stories.map(
      (s) =>
        `- ${s.title} (skills: ${s.skills.join(", ") || "—"}; learning: ${s.learning})${s.hasResult ? "" : " [result missing — do NOT invent one]"}`,
    ),
    "",
    zh ? "现在生成三个部分。" : "Generate the three parts now.",
  ].join("\n");
}

async function generateWithProvider(
  ctx: SelfIntroContext,
  locale: Locale,
): Promise<SelfIntroductionResult> {
  const apiKey = aiApiKey();
  if (!apiKey) throw new AiError("provider", "no api key configured");

  let response: Response;
  try {
    response = await fetch(`${AI_PROVIDER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(locale) },
          { role: "user", content: buildUserPrompt(ctx, locale) },
        ],
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AiError("timeout");
    }
    throw new AiError("network");
  }

  if (!response.ok) throw new AiError("provider");

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AiError("provider");
  }
  const content =
    typeof payload === "object" &&
    payload !== null &&
    "choices" in payload &&
    Array.isArray((payload as { choices?: unknown[] }).choices) &&
    (payload as { choices: Array<{ message?: { content?: unknown } }> })
      .choices[0]?.message?.content;
  if (typeof content !== "string") throw new AiError("invalid_response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AiError("invalid_response");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new AiError("invalid_response");
  }
  const record = parsed as Record<string, unknown>;
  const direction =
    typeof record.direction === "string" ? record.direction.trim() : "";
  const draft =
    typeof record.draft === "string" ? record.draft.trim() : "";
  if (!draft) throw new AiError("invalid_response");

  const evidence: SelfIntroEvidence[] = Array.isArray(record.evidence)
    ? record.evidence
        .map((entry): SelfIntroEvidence | null => {
          if (typeof entry !== "object" || entry === null) return null;
          const e = entry as Record<string, unknown>;
          if (typeof e.title !== "string" || !e.title.trim()) return null;
          return {
            title: e.title.trim().slice(0, 200),
            why:
              typeof e.why === "string"
                ? e.why.trim().slice(0, 400)
                : "",
          };
        })
        .filter((e): e is SelfIntroEvidence => e !== null)
        .slice(0, 3)
    : [];

  return {
    direction: direction.slice(0, 400),
    evidence,
    draft: draft.slice(0, MAX_DRAFT_CHARS),
  };
}

// ----------------------------------------------------------------- facade ---

/**
 * Generate the structured self-introduction (A direction / B evidence /
 * C draft). Mock mode is deterministic (same context → same result); live
 * mode calls the LLM once and degrades to the deterministic result on any
 * failure so the button always returns something usable.
 */
export async function generateSelfIntroduction(
  jobId: string,
  locale: Locale,
): Promise<SelfIntroductionResult> {
  const ctx = await buildSelfIntroContext(jobId, locale);
  if (!ctx) throw new AiError("not_found");

  const mode = resolveAiMode();
  if (mode === "mock") {
    return mockSelfIntro(ctx, locale);
  }

  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  try {
    const result = await generateWithProvider(ctx, locale);
    logAiRequest({
      route: "self-introduction",
      requestId,
      status: "ok",
      startedAt,
      mode: "live",
    });
    return result;
  } catch (err) {
    const aiError =
      err instanceof AiError ? err : new AiError("provider", "unknown");
    logAiRequest({
      route: "self-introduction",
      requestId,
      status: "error",
      startedAt,
      mode: "live",
      errorType: aiError.code,
    });
    return mockSelfIntro(ctx, locale);
  }
}
