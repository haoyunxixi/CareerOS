import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { MockInterviewView } from "@/components/interview/MockInterviewView";
import { findMatch } from "@/data/mock-matches";
import { findInterviewPreparation } from "@/data/mock-interview";
import { generateSessionQuestions } from "@/lib/ai/question-generator";
import { resolveLocale } from "@/i18n/server";
import { pick } from "@/lib/localize";
import { createTranslator } from "@/i18n/dictionaries";
import { getJobEntry } from "@/lib/user-data";
import { isLocalJobId } from "@/lib/local-data";
import { LocalMockInterview } from "@/components/mode/local-gates";

interface MockInterviewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MockInterviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getJobEntry(id);
  if (!entry) return { title: "Mock interview" };

  const locale = await resolveLocale();
  return {
    title: `${pick(entry.job.company, locale)} · ${pick(entry.job.title, locale)}`,
  };
}

export default async function MockInterviewPage({
  params,
}: MockInterviewPageProps) {
  const { id } = await params;

  // Browser-local job (local-first mode): the client uploads its own job +
  // profile context, then runs the exact same interview view.
  if (isLocalJobId(id)) {
    const locale = await resolveLocale();
    return (
      <Container>
        <LocalMockInterview id={id} locale={locale} />
      </Container>
    );
  }

  // Unified lookup — demo jobs and user-created jobs run the same engine.
  const entry = await getJobEntry(id);
  if (!entry) notFound();
  const { job, analysis } = entry;

  const locale = await resolveLocale();
  const t = createTranslator(locale);

  // A job without a JD has nothing to generate from — never fall back to
  // another job's data. (Every job entry carries at least a heuristic
  // analysis built from its own JD, so this only fires for empty JDs.)
  if (!analysis) {
    return (
      <Container>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <p className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("jobs.mock.title")}
          </p>
          <h1 className="font-serif text-page font-medium text-ink">
            {pick(job.company, locale)} · {pick(job.title, locale)}
          </h1>
          <p className="text-body text-ink-muted">
            {t("jobs.mock.needsJd.note")}
          </p>
          <div>
            <Link
              href={`/jobs/${job.id}?tab=jd-analysis`}
              className="inline-flex h-11 items-center rounded-btn bg-ink px-5 text-btn font-semibold text-canvas transition-opacity hover:opacity-80"
            >
              {t("jobs.mock.needsJd.cta")}
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  // One engine, every job: the questions are generated from THIS job's
  // context (JD analysis, match, profile, history). Deterministic in mock
  // mode; LLM-backed (with mock fallback) in live mode.
  const questions = await generateSessionQuestions(job.id);
  if (questions.length === 0) notFound();

  const preparation = findInterviewPreparation(id);
  // Demo jobs have curated match evidence; user jobs run without it.
  const match = findMatch(id);

  return (
    <Container>
      <MockInterviewView
        job={job}
        stage={preparation?.stage ?? "first_round"}
        questions={questions}
        evidence={match?.evidence ?? []}
        focusTitles={(preparation?.focuses ?? []).map((f) => f.title)}
        stories={preparation?.stories ?? []}
        locale={locale}
      />
    </Container>
  );
}
