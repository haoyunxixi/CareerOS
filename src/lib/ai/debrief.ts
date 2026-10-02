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
import { findInterviewPreparation } from "@/data/mock-interview";
import {
  findInterviewDebriefs,
  findInterviewSessions,
} from "@/data/mock-interview-sessions";
import { listMemoryDebriefs } from "@/lib/interview-debrief-memory";
import { listMemorySessions } from "@/lib/interview-memory";
import { buildRoleContext } from "@/lib/ai/role-context";
import { sharedStoryBank } from "@/lib/interview-preparation";
import { getJobEntry, getProfileForViewer } from "@/lib/user-data";
import type {
  InterviewDebrief,
  InterviewDebriefQuestion,
  InterviewStage,
  InterviewStory,
  JobMatch,
} from "@/types";

/**
 * Real-interview debrief analysis — server-side only.
 *
 * The user pastes (or uploads) the transcript of a REAL interview plus an
 * optional note. One AI call turns it into an editable debrief draft with
 * exactly four areas — what was asked / what the interviewer focused on /
 * which answers need work / next-round preparation — plus optional story
 * suggestions. Everything stays grounded: no invented questions, no
 * scores, no outcome predictions. The draft reuses the existing
 * `InterviewDebrief` schema; confirming it saves through the existing
 * persistence layer so `nextRoundFocus` feeds the next preparation.
 *
 * Mock mode is deterministic so the product works without a key.
 */

const MAX_TRANSCRIPT_CHARS = 20_000;
const MAX_NOTE_CHARS = 500;
const MAX_QUESTIONS = 8;
const MAX_SIGNALS = 5;
const MAX_IMPROVEMENTS = 5;
const MAX_NEXT_FOCUS = 5;

// ---------------------------------------------------------------- context ---

interface DebriefContext {
  company: string;
  title: string;
  jd: string;
  roleSummary: string;
  topRequirements: string[];
  stage: InterviewStage;
  /** V3: role/industry classification for role-aware debriefing. */
  roleContext: {
    family: string;
    industry: string;
    themes: string[];
  };
  /** Story Bank entries with their ids, so story hints can map back. */
  stories: {
    id: string;
    title: string;
    skills: string[];
    missingParts: string[];
  }[];
  previousWeakPoints: string[];
}

async function buildDebriefContext(
  jobId: string,
  locale: Locale,
): Promise<DebriefContext | null> {
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

  // V3: the shared Story Bank helper — one source of truth, same as the
  // preparation and self-introduction flows read.
  const bank: InterviewStory[] = sharedStoryBank();
  const role = buildRoleContext(job, analysis);

  const previousWeakPoints = [
    ...listMemorySessions(jobId).flatMap((s) => s.weakPoints),
    ...(findInterviewSessions(jobId) ?? []).flatMap((s) => s.weakPoints),
    ...listMemoryDebriefs(jobId).flatMap((d) => [
      ...d.weakPoints,
      ...d.nextRoundFocus,
    ]),
    ...(findInterviewDebriefs(jobId) ?? []).flatMap((d) => [
      ...d.weakPoints,
      ...d.nextRoundFocus,
    ]),
  ]
    .map((item) => pick(item, locale))
    .filter((item, i, all) => all.indexOf(item) === i)
    .slice(0, 6);

  return {
    company: pick(job.company, locale),
    title: pick(job.title, locale),
    jd: job.jd.slice(0, 4000),
    roleSummary: pick(analysis.roleSummary, locale),
    topRequirements: match.matches
      .filter((m) => m.importance === "must")
      .slice(0, 5)
      .map((m) => pick(m.requirement, locale)),
    stage: findInterviewPreparation(jobId)?.stage ?? "first_round",
    roleContext: {
      family: pick(role.familyLabel, locale),
      industry: pick(role.industry.label, locale),
      themes: role.themes.map((t) => pick(t, locale)),
    },
    stories: bank.slice(0, 8).map((s) => ({
      id: s.id,
      title: pick(s.title, locale),
      skills: s.relatedSkills.slice(0, 3).map((k) => pick(k, locale)),
      // `missingParts` is derived on the fly: the bank stores absence
      // (no result written) rather than an explicit list.
      missingParts: s.missingParts ?? (s.result ? [] : ["result"]),
    })),
    previousWeakPoints,
  };
}

// -------------------------------------------------------------- mock mode ---

/**
 * Deterministic transformation for mock mode. Honest by design: questions
 * are lifted verbatim from transcript lines that read like questions;
 * signals come from keyword frequency; improvements are grounded review
 * prompts, not invented facts.
 */
function mockAnalysis(
  ctx: DebriefContext,
  transcript: string,
  note: string,
  locale: Locale,
): RealDebriefAnalysis {
  const zh = locale === "zh-CN";
  const lines = transcript
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Lines that read like questions (verbatim — never rewritten).
  const questionLines = lines.filter(
    (l) =>
      /[?？]\s*$/.test(l) ||
      /^(面试官| interviewer|Q\d)/i.test(l) ||
      /^(能不能|可不可以|请|怎么|为什么|如何|tell me|why|how|what)/i.test(l),
  );
  const questions = (questionLines.length > 0 ? questionLines : lines)
    .slice(0, MAX_QUESTIONS)
    .map((q) => ({ question: q.slice(0, 300), thread: "" }));

  // Signals: keyword scan over the transcript.
  const signalDefs: Array<[string[], string]> = [
    [
      ["数据", "指标", "DAU", "转化", "data", "metric"],
      zh ? "数据分析" : "Data analysis",
    ],
    [
      ["为什么", "动机", "why", "motivation"],
      zh ? "岗位动机" : "Motivation",
    ],
    [
      ["结果", "影响", "成果", "result", "impact"],
      zh ? "项目结果" : "Project results",
    ],
    [
      ["用户", "需求", "调研", "user", "research"],
      zh ? "用户洞察" : "User insight",
    ],
    [
      ["产品", "方案", "prioriti", "roadmap"],
      zh ? "产品判断" : "Product judgement",
    ],
  ];
  const interviewerSignals = signalDefs
    .map(([keywords, label]) => {
      const hits = keywords.filter((k) =>
        transcript.toLowerCase().includes(k.toLowerCase()),
      ).length;
      if (hits === 0) return null;
      const evidence = zh
        ? `转写中「${label}」相关表述出现了 ${hits} 次`
        : `"${label}"-related phrasing appears ${hits} time(s) in the transcript`;
      return {
        focus: zh ? `本轮较多关注${label}` : `This round leaned on ${label}`,
        evidence,
      };
    })
    .filter((s): s is { focus: string; evidence: string } => s !== null)
    .slice(0, MAX_SIGNALS);

  // Improvements: grounded prompts — the user checks these against memory.
  const improvements: RealDebriefAnalysis["improvements"] = [];
  const starStory = ctx.stories.find((s) => s.missingParts.length > 0);
  improvements.push({
    scenario: zh
      ? "对照转写中被追问最多的回答"
      : "the answer that was probed most in the transcript",
    issue: zh
      ? "（预览模式无法逐句评估——请自己核对当时的表达是否完整）"
      : "(Preview mode cannot judge your wording — check it against the transcript yourself)",
    nextTime: zh
      ? "重讲一遍：先给结论，再给一个真实例子，最后落到对岗位的意义"
      : "Re-tell it: conclusion first, one real example, then why it matters for this role",
    missingStarPart: starStory?.missingParts.includes("result") ? "R" : null,
  });

  // Next-round focus: concrete, grounded in real gaps.
  const nextRoundFocus: string[] = [];
  const incompleteStory = ctx.stories.find((s) =>
    s.missingParts.includes("result"),
  );
  if (incompleteStory) {
    nextRoundFocus.push(
      zh
        ? `补完整「${incompleteStory.title}」的 Result`
        : `Complete the Result of "${incompleteStory.title}"`,
    );
  }
  if (ctx.topRequirements[0]) {
    nextRoundFocus.push(
      zh
        ? `准备一个对应「${ctx.topRequirements[0]}」的真实案例`
        : `Prepare a real case for "${ctx.topRequirements[0]}"`,
    );
  }
  nextRoundFocus.push(
    zh
      ? "针对这次被追问的问题，再做一次模拟面试"
      : "Run another mock round targeting the questions probed here",
  );
  if (note.trim()) {
    nextRoundFocus.push(
      zh
        ? `回看自己记下的这点：「${note.trim().slice(0, 80)}」`
        : `Revisit what you noted: "${note.trim().slice(0, 80)}"`,
    );
  }

  // Story hints: stories with unwritten parts.
  const storyHints = ctx.stories
    .filter((s) => s.missingParts.length > 0)
    .slice(0, 2)
    .map((s) => ({
      storyId: s.id,
      reason: zh
        ? `「${s.title}」还有未补全的部分（${s.missingParts.join("、")}）`
        : `"${s.title}" still has unwritten parts (${s.missingParts.join(", ")})`,
    }));

  return {
    questions: questions.length > 0 ? questions : [],
    interviewerSignals,
    improvements: improvements.slice(0, MAX_IMPROVEMENTS),
    nextRoundFocus: nextRoundFocus.slice(0, MAX_NEXT_FOCUS),
    storyHints,
  };
}

// -------------------------------------------------------------- live mode ---

interface RealDebriefAnalysis {
  questions: { question: string; thread?: string }[];
  interviewerSignals: { focus: string; evidence: string }[];
  improvements: {
    scenario: string;
    issue: string;
    nextTime: string;
    missingStarPart?: "S" | "T" | "A" | "R" | null;
  }[];
  nextRoundFocus: string[];
  storyHints: { storyId: string; reason: string }[];
}

function buildSystemPrompt(locale: Locale): string {
  const languageNames: Record<Locale, string> = {
    "zh-CN": "Simplified Chinese (简体中文)",
    en: "English",
  };
  return [
    "You are the real-interview debrief assistant inside CareerOS, a career preparation product.",
    "You analyse ONE real interview transcript and produce an editable debrief draft.",
    "",
    "Core principles:",
    "1. You are NOT an outcome predictor. Never guess whether the candidate passed, the interviewer's private opinion, or any probability of an offer.",
    '2. NEVER invent questions that do not appear in the transcript. "questions" must be lifted or lightly condensed from the transcript itself. Merge consecutive follow-ups on the same topic into one thread (put the follow-up chain in "thread").',
    '3. "interviewerSignals": 3-5 items max. Phrase them as observed evidence ("the questions kept returning to…", "…was probed repeatedly"), never as mind-reading. Use the fixed phrasing pattern: state what was observed in the questions, then the focus area.',
    '4. "improvements": 3-5 items max. Each: the question/scenario, what was weak in the answer AS SEEN IN THE TRANSCRIPT, and how to express it next time. If a STAR part (Situation/Task/Action/Result) was clearly missing, set "missingStarPart" to "S"/"T"/"A"/"R", else null. No numeric scores, no grades, no pass/fail.',
    '5. "nextRoundFocus": 3-5 very concrete actions the candidate can do before the next round (e.g. complete a missing Result, prepare one data-analysis case, rewrite the motivation answer, run another mock on the probed questions). When the transcript shows a JD requirement was probed repeatedly, or a Story Bank story was discussed but answered poorly, that MUST surface in nextRoundFocus — these feed the next preparation round automatically.',
    '6. "storyHints": only include a story when the transcript clearly shows that story was discussed AND it has unwritten parts (or was clearly answered weakly). "storyId" must come from the provided stories list. If no reliable mapping, return an empty array — never force one.',
    "7. The user's optional note is extra context from their memory — treat it as truthful, but never let it override the transcript.",
    "8. Stay role-aware: judge the answers against what this role family and industry actually probe (see the role context section), not against a generic rubric.",
    "",
    `Respond in ${languageNames[locale]}.`,
    "Respond with ONLY a JSON object (no markdown) of this exact shape:",
    `{
  "questions": [{ "question": string, "thread": string }],
  "interviewerSignals": [{ "focus": string, "evidence": string }],
  "improvements": [{ "scenario": string, "issue": string, "nextTime": string, "missingStarPart": "S"|"T"|"A"|"R"|null }],
  "nextRoundFocus": string[],
  "storyHints": [{ "storyId": string, "reason": string }]
}`,
  ].join("\n");
}

function buildUserPrompt(
  ctx: DebriefContext,
  transcript: string,
  note: string,
): string {
  return [
    `Job: ${ctx.company} — ${ctx.title}`,
    `Role summary: ${ctx.roleSummary}`,
    "",
    `Role family: ${ctx.roleContext.family}; industry: ${ctx.roleContext.industry}.`,
    `Themes this role is typically probed on: ${ctx.roleContext.themes.slice(0, 6).join("; ")}.`,
    "",
    "Key requirements:",
    ...ctx.topRequirements.map((r) => `- ${r}`),
    "",
    "Candidate's Story Bank (id — title, unwritten parts):",
    ...ctx.stories.map(
      (s) =>
        `- [${s.id}] ${s.title}${s.missingParts.length ? ` (missing: ${s.missingParts.join(", ")})` : " (complete)"}`,
    ),
    ...(ctx.previousWeakPoints.length > 0
      ? [
          "",
          "Weak points from previous rounds (recurring gaps to watch for):",
          ...ctx.previousWeakPoints.map((w) => `- ${w}`),
        ]
      : []),
    "",
    "JD (for reference):",
    ctx.jd,
    "",
    "=== REAL INTERVIEW TRANSCRIPT ===",
    transcript,
    "=== END TRANSCRIPT ===",
    ...(note.trim()
      ? ["", `Candidate's own note: ${note.trim()}`]
      : []),
    "",
    "Analyse the transcript now.",
  ].join("\n");
}

async function analyseWithProvider(
  ctx: DebriefContext,
  transcript: string,
  note: string,
  locale: Locale,
): Promise<RealDebriefAnalysis> {
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
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(locale) },
          { role: "user", content: buildUserPrompt(ctx, transcript, note) },
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
  const analysis = normaliseAnalysis(parsed);
  if (!analysis) throw new AiError("invalid_response");
  return analysis;
}

/** Tolerant normalisation — the model is trusted for content, not shape. */
function normaliseAnalysis(raw: unknown): RealDebriefAnalysis | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const str = (v: unknown, max = 500): string =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const strArray = (v: unknown, max: number, itemMax = 500): string[] =>
    Array.isArray(v)
      ? v
          .map((x) => str(x, itemMax))
          .filter(Boolean)
          .slice(0, max)
      : [];

  const questions = Array.isArray(r.questions)
    ? r.questions
        .map((q): { question: string; thread?: string } | null => {
          if (typeof q !== "object" || q === null) return null;
          const rec = q as Record<string, unknown>;
          const question = str(rec.question, 400);
          if (!question) return null;
          return { question, thread: str(rec.thread, 400) || undefined };
        })
        .filter((q): q is { question: string; thread?: string } => q !== null)
        .slice(0, MAX_QUESTIONS)
    : [];

  const interviewerSignals = Array.isArray(r.interviewerSignals)
    ? r.interviewerSignals
        .map((s) => {
          if (typeof s !== "object" || s === null) return null;
          const rec = s as Record<string, unknown>;
          const focus = str(rec.focus, 200);
          if (!focus) return null;
          return { focus, evidence: str(rec.evidence, 400) };
        })
        .filter(
          (s): s is { focus: string; evidence: string } => s !== null,
        )
        .slice(0, MAX_SIGNALS)
    : [];

  const improvements = Array.isArray(r.improvements)
    ? r.improvements
        .map((i) => {
          if (typeof i !== "object" || i === null) return null;
          const rec = i as Record<string, unknown>;
          const scenario = str(rec.scenario, 300);
          const nextTime = str(rec.nextTime, 400);
          if (!scenario || !nextTime) return null;
          const part = rec.missingStarPart;
          return {
            scenario,
            issue: str(rec.issue, 400),
            nextTime,
            missingStarPart:
              part === "S" || part === "T" || part === "A" || part === "R"
                ? part
                : null,
          };
        })
        .filter(
          (
            i,
          ): i is {
            scenario: string;
            issue: string;
            nextTime: string;
            missingStarPart: "S" | "T" | "A" | "R" | null;
          } => i !== null,
        )
        .slice(0, MAX_IMPROVEMENTS)
    : [];

  const storyHints = Array.isArray(r.storyHints)
    ? r.storyHints
        .map((h) => {
          if (typeof h !== "object" || h === null) return null;
          const rec = h as Record<string, unknown>;
          const storyId = str(rec.storyId, 100);
          const reason = str(rec.reason, 300);
          if (!storyId || !reason) return null;
          return { storyId, reason };
        })
        .filter((h): h is { storyId: string; reason: string } => h !== null)
        .slice(0, 2)
    : [];

  const nextRoundFocus = strArray(r.nextRoundFocus, MAX_NEXT_FOCUS, 300);
  if (
    questions.length === 0 &&
    interviewerSignals.length === 0 &&
    improvements.length === 0 &&
    nextRoundFocus.length === 0
  ) {
    return null;
  }

  return {
    questions,
    interviewerSignals,
    improvements,
    nextRoundFocus,
    storyHints,
  };
}

// ---------------------------------------------------------------- mapping ---

const L = (zh: string, en: string) => ({ "zh-CN": zh, en });

/** Map the analysis into the existing InterviewDebrief shape. */
function toDebriefDraft(
  jobId: string,
  ctx: DebriefContext,
  analysis: RealDebriefAnalysis,
  transcript: string,
  note: string,
): InterviewDebrief {
  const questions: InterviewDebriefQuestion[] = analysis.questions.map(
    (q, i) => ({
      id: `dq-${Date.now()}-${i}`,
      question: L(q.question, q.question),
      ...(q.thread ? { notes: L(q.thread, q.thread) } : {}),
    }),
  );

  const interviewerSignals = analysis.interviewerSignals.map((s) => {
    const text = s.evidence ? `${s.focus}——${s.evidence}` : s.focus;
    return L(text, text);
  });

  // Improvements collapse into one honest line each (schema reuse — the
  // debrief stays a list of LocalizedText, not a second report schema).
  const weakPoints = analysis.improvements.map((i) => {
    const starLabel: Record<"S" | "T" | "A" | "R", string> = {
      S: "Situation",
      T: "Task",
      A: "Action",
      R: "Result",
    };
    const parts = [`「${i.scenario}」`];
    if (i.issue) parts.push(`当前：${i.issue}`);
    parts.push(`下次：${i.nextTime}`);
    if (i.missingStarPart) {
      parts.push(`（STAR 中 ${i.missingStarPart} · ${starLabel[i.missingStarPart]} 偏弱）`);
    }
    const zh = parts.join(" —— ");
    const en = [
      `"${i.scenario}"`,
      i.issue ? `current: ${i.issue}` : "",
      `next time: ${i.nextTime}`,
      i.missingStarPart ? `(${i.missingStarPart} · ${starLabel[i.missingStarPart]} was thin)` : "",
    ]
      .filter(Boolean)
      .join(" — ");
    return L(zh, en);
  });

  const storyHints = analysis.storyHints
    .filter((h) => ctx.stories.some((s) => s.id === h.storyId))
    .map((h) => ({ storyId: h.storyId, reason: L(h.reason, h.reason) }));

  const rawNotes = note.trim()
    ? `${transcript.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[Note] ${note.trim()}`
    : transcript.slice(0, MAX_TRANSCRIPT_CHARS);

  return {
    id: `debrief-real-${jobId}-${Date.now()}`,
    jobId,
    stage: ctx.stage,
    occurredAt: new Date().toISOString().slice(0, 10),
    rawNotes,
    questions,
    weakPoints,
    interviewerSignals,
    nextRoundFocus: analysis.nextRoundFocus.map((f) => L(f, f)),
    userConfirmed: false,
    sourceType: "real_interview",
    ...(storyHints.length > 0 ? { storyHints } : {}),
  };
}

// ----------------------------------------------------------------- facade ---

/**
 * Analyse a real-interview transcript into an editable debrief draft.
 * Mock mode is deterministic; live mode calls the LLM once and falls back
 * to the deterministic analysis on any failure, so the button always
 * returns an editable draft.
 */
export async function generateRealDebriefDraft(
  jobId: string,
  input: { transcript: string; note?: string; locale: Locale },
): Promise<InterviewDebrief> {
  const transcript = input.transcript.trim().slice(0, MAX_TRANSCRIPT_CHARS);
  if (!transcript) throw new AiError("invalid_request");
  const note = (input.note ?? "").trim().slice(0, MAX_NOTE_CHARS);

  const ctx = await buildDebriefContext(jobId, input.locale);
  if (!ctx) throw new AiError("not_found");

  const mode = resolveAiMode();
  if (mode === "mock") {
    return toDebriefDraft(
      jobId,
      ctx,
      mockAnalysis(ctx, transcript, note, input.locale),
      transcript,
      note,
    );
  }

  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  try {
    const analysis = await analyseWithProvider(
      ctx,
      transcript,
      note,
      input.locale,
    );
    logAiRequest({
      route: "debrief",
      requestId,
      status: "ok",
      startedAt,
      mode: "live",
    });
    return toDebriefDraft(jobId, ctx, analysis, transcript, note);
  } catch (err) {
    const aiError =
      err instanceof AiError ? err : new AiError("provider", "unknown");
    logAiRequest({
      route: "debrief",
      requestId,
      status: "error",
      startedAt,
      mode: "live",
      errorType: aiError.code,
    });
    return toDebriefDraft(
      jobId,
      ctx,
      mockAnalysis(ctx, transcript, note, input.locale),
      transcript,
      note,
    );
  }
}
