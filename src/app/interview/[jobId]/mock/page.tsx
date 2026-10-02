import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { MockInterviewView } from "@/components/interview/MockInterviewView";
import { findMatch } from "@/data/mock-matches";
import { buildInterviewPreparation } from "@/lib/interview-preparation";
import { generateSessionQuestions } from "@/lib/ai/question-generator";
import { resolveLocale } from "@/i18n/server";
import { pick } from "@/lib/localize";
import { createTranslator } from "@/i18n/dictionaries";
import { getJobEntry } from "@/lib/user-data";
import { isLocalJobId } from "@/lib/local-data";
import { LocalMockInterview } from "@/components/mode/local-gates";

/**
 * /interview/[jobId]/mock — the mock interview, reached from the interview
 * area. The exact same engine as /jobs/[id]/interview/mock: the same jobId
 * drives generateSessionQuestions (which builds the interview context),
 * the same MockInterviewView / InterviewRoom, voice and STT. No second
 * implementation — this route is only a new door into the one engine.
 */

interface CaseMockPageProps {
  params: Promise<{ jobId: string }>;
}

export async function generateMetadata({
  params,
}: CaseMockPageProps): Promise<Metadata> {
  const { jobId } = await params;
  const entry = await getJobEntry(jobId);
  if (!entry) return { title: "Mock interview" };

  const locale = await resolveLocale();
  return {
    title: `${pick(entry.job.company, locale)} · ${pick(entry.job.title, locale)}`,
  };
}

export default async function CaseMockPage({ params }: CaseMockPageProps) {
  const { jobId } = await params;

  // Browser-local job (local-first mode): the client uploads its own job +
  // profile context, then runs the exact same interview view.
  if (isLocalJobId(jobId)) {
    const locale = await resolveLocale();
    return (
      <Container>
        <LocalMockInterview id={jobId} locale={locale} />
      </Container>
    );
  }

  // Unified lookup — demo jobs and user-created jobs run the same engine.
  const entry = await getJobEntry(jobId);
  if (!entry) notFound();
  const { job } = entry;

  const locale = await resolveLocale();
  const t = createTranslator(locale);

  // A job without a JD has nothing to generate from — never fall back to
  // another job's data or fixed questions.
  if (!job.jd.trim()) {
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
              href={`/interview/${job.id}?tab=analysis`}
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
  // context (JD analysis, match, profile, history) — same call the
  // /jobs/[id]/interview/mock route makes.
  const questions = await generateSessionQuestions(job.id);
  if (questions.length === 0) notFound();

  // Same dynamic preparation flow as the case page — one source of truth
  // for stage / focuses / stories, derived from this job's own context.
  const preparation = await buildInterviewPreparation(jobId);
  const match = findMatch(jobId);

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
