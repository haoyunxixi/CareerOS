"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { UserHome } from "@/components/home/user-home";
import { JobsView } from "@/components/jobs/JobsView";
import type { AddJobForm } from "@/components/jobs/AddJobDrawer";
import { JobDetailView, type TabId } from "@/components/jobs/JobDetailView";
import { ProfileView } from "@/components/profile/ProfileView";
import { ResumeHomeView } from "@/components/resume/ResumeHomeView";
import { MockInterviewView } from "@/components/interview/MockInterviewView";
import {
  InterviewCaseView,
  type CaseTabId,
} from "@/components/interview/InterviewCaseView";
import { JourneyView } from "@/components/journey/JourneyView";
import { BubbleSpace } from "@/components/bubble/BubbleSpace";
import {
  InterviewCenterView,
  type InterviewCenterJob,
} from "@/components/interview/InterviewCenterView";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import { buildJourney } from "@/lib/journey";
import type { Locale } from "@/i18n/config";
import type { CareerEvent, CareerProfile, Job, SessionQuestion } from "@/types";
import {
  buildLocalJob,
  getLocalEvents,
  getLocalJobs,
  getLocalMode,
  getLocalProfile,
  newEventId,
  removeLocalEvent,
  saveLocalEvent,
  saveLocalJob,
  setLocalMode,
  type LocalJobRecord,
  type LocalProfileRecord,
} from "@/lib/local-data";

/**
 * Local-first user mode gates. localStorage is invisible to the server, so
 * each page renders its server-side demo tree by default and these client
 * gates swap in the browser-local data ("my CareerOS") after mount. The
 * three data spaces stay strictly separated:
 *
 *   demo  — Alex + the seeded jobs (server, untouched)
 *   local — this browser's profile + jobs (localStorage)
 *   cloud — Supabase accounts (future; the pages' server branches)
 */

// ------------------------------------------------------------------- home ---

export function HomeGate({
  demo,
  locale,
}: {
  demo: React.ReactNode;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [record, setRecord] = useState<LocalProfileRecord | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getLocalMode() === "local") setRecord(getLocalProfile());
    setChecked(true);
  }, []);

  if (checked && record) {
    // Local jobs have no server-side preparation, so no focus line —
    // the same three-area home with honest empties.
    return (
      <UserHome
        name={record.profile.basic.name || record.name || t("auth.myCareerOS")}
        interviews={getLocalJobs().map((r) => ({
          jobId: r.job.id,
          company: r.job.company,
          role: r.job.title,
          status: r.job.status,
          stage: "first_round" as const,
          date: r.job.nextAction?.date,
          time: r.job.nextAction?.time,
        }))}
        hasProfile
        locale={locale}
      />
    );
  }

  return (
    <>
      {checked ? (
        <Container padding="none" className="pt-8 md:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-field border border-line bg-canvas-raised px-5 py-4">
            <p className="text-body text-ink-muted">{t("home.demoNote")}</p>
            {record ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLocalMode("local");
                  router.refresh();
                }}
              >
                {t("home.backMine")}
              </Button>
            ) : (
              <ButtonLink href="/onboarding" variant="secondary" size="sm">
                {t("home.startMine")}
              </ButtonLink>
            )}
          </div>
        </Container>
      ) : null}
      {demo}
    </>
  );
}

// ------------------------------------------------------------------- jobs ---

export function JobsGate({
  demoJobs,
  locale,
}: {
  demoJobs: Job[];
  locale: Locale;
}) {
  const [records, setRecords] = useState<LocalJobRecord[] | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getLocalMode() === "local" && getLocalProfile()) {
      setRecords(getLocalJobs());
    }
    setChecked(true);
  }, []);

  if (checked && records) {
    return (
      <JobsView
        jobs={records.map((r) => r.job)}
        locale={locale}
        mode="local"
        onLocalAdd={async (form: AddJobForm) => {
          const record = buildLocalJob(form);
          saveLocalJob(record);
          setRecords(getLocalJobs());
        }}
      />
    );
  }

  return <JobsView jobs={demoJobs} locale={locale} mode="demo" />;
}

// ----------------------------------------------------------------- profile ---

export function ProfileGate({
  demo,
  locale,
}: {
  demo: React.ReactNode;
  locale: Locale;
}) {
  const [record, setRecord] = useState<LocalProfileRecord | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getLocalMode() === "local") setRecord(getLocalProfile());
    setChecked(true);
  }, []);

  if (checked && record) {
    return <ProfileView profile={record.profile} locale={locale} mode="local" />;
  }

  return <>{demo}</>;
}

// ------------------------------------------------------------------ resume ---

export function ResumeGate({
  demo,
  locale,
  storyId,
}: {
  demo: React.ReactNode;
  locale: Locale;
  storyId?: string;
}) {
  const [record, setRecord] = useState<LocalProfileRecord | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getLocalMode() === "local") setRecord(getLocalProfile());
    setChecked(true);
  }, []);

  if (checked && record) {
    return (
      <ResumeHomeView
        profile={record.profile}
        stories={[]}
        locale={locale}
        storyId={storyId}
      />
    );
  }

  return <>{demo}</>;
}

// --------------------------------------------------------------- interview ---

export function InterviewGate({
  demo,
  locale,
}: {
  demo: React.ReactNode;
  locale: Locale;
}) {
  const [jobs, setJobs] = useState<InterviewCenterJob[] | null>(null);
  const [checked, setChecked] = useState(false);

  function refresh() {
    setJobs(
      getLocalJobs().map((r) => ({
        job: r.job,
        stage: "first_round" as const,
        scheduledAt: "",
        focusTitles: [],
        stories: [],
        sessionCount: 0,
      })),
    );
  }

  useEffect(() => {
    if (getLocalMode() === "local" && getLocalProfile()) refresh();
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checked && jobs) {
    return (
      <InterviewCenterView
        jobs={jobs}
        reviews={[]}
        locale={locale}
        onAddInterview={async (form) => {
          saveLocalJob(buildLocalJob(form));
          refresh();
        }}
      />
    );
  }

  return <>{demo}</>;
}

// ---------------------------------------------------- local job workspace ---

export function LocalInterviewCase({
  id,
  initialTab,
  locale,
}: {
  id: string;
  initialTab?: CaseTabId;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const [entry, setEntry] = useState<LocalJobRecord | "missing" | null>(null);

  useEffect(() => {
    const record = getLocalJobs().find((r) => r.job.id === id);
    setEntry(record ?? "missing");
  }, [id]);

  if (entry === "missing") {
    return <p className="text-body text-ink-muted">{t("interview.case.notFound")}</p>;
  }
  if (!entry) return null;

  // Local jobs carry their own JD analysis but no curated match / prep /
  // review data — the same graceful degradation the job workspace uses.
  return (
    <InterviewCaseView
      job={entry.job}
      analysis={entry.analysis}
      stage="first_round"
      scheduledAt=""
      focusTitles={[]}
      initialTab={initialTab}
      locale={locale}
    />
  );
}

export function LocalJobDetail({
  id,
  initialTab,
  locale,
}: {
  id: string;
  initialTab?: TabId;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const [entry, setEntry] = useState<LocalJobRecord | "missing" | null>(null);
  const [profile, setProfile] = useState<CareerProfile | null>(null);

  useEffect(() => {
    const record = getLocalJobs().find((r) => r.job.id === id);
    setEntry(record ?? "missing");
    setProfile(getLocalProfile()?.profile ?? null);
  }, [id]);

  if (entry === "missing") {
    return <p className="text-body text-ink-muted">{t("local.notFound")}</p>;
  }
  if (!entry) return null;

  return (
    <JobDetailView
      job={entry.job}
      analysis={entry.analysis}
      profile={profile ?? undefined}
      initialTab={initialTab}
      locale={locale}
    />
  );
}

// --------------------------------------------------- local mock interview ---

export function LocalMockInterview({
  id,
  locale,
}: {
  id: string;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<
    { job: Job; questions: SessionQuestion[] } | "missing" | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    const record = getLocalJobs().find((r) => r.job.id === id);
    const profileRecord = getLocalProfile();
    if (!record || !profileRecord) {
      setState("missing");
      return;
    }

    // Upload the browser-local context once; the shared interview engine
    // (question generation, feedback, memory) then works with plain ids.
    fetch("/api/ai/session-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job: record.job,
        analysis: record.analysis,
        profile: profileRecord.profile,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as { questions?: SessionQuestion[] };
        if (cancelled) return;
        if (!data.questions || data.questions.length === 0) {
          setState("missing");
          return;
        }
        setState({ job: record.job, questions: data.questions });
      })
      .catch(() => {
        if (!cancelled) setState("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state === "missing") {
    return <p className="text-body text-ink-muted">{t("local.notFound")}</p>;
  }
  if (!state) return null;

  return (
    <MockInterviewView
      job={state.job}
      stage="first_round"
      questions={state.questions}
      evidence={[]}
      focusTitles={[]}
      locale={locale}
    />
  );
}

// ----------------------------------------------------------------- journey ---

export function JourneyGate({
  demo,
  locale,
}: {
  demo: React.ReactNode;
  locale: Locale;
}) {
  const [built, setBuilt] = useState<ReturnType<typeof buildJourney> | null>(
    null,
  );
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getLocalMode() === "local" && getLocalProfile()) {
      setBuilt(
        buildJourney(
          {
            jobs: getLocalJobs().map((r) => r.job),
            sessions: [],
            debriefs: [],
            events: getLocalEvents(),
          },
          locale,
        ),
      );
    }
    setChecked(true);
  }, [locale]);

  if (checked && built) {
    return (
      <JourneyView
        timeline={built.timeline}
        focus={built.focus}
        locale={locale}
        mode="local"
      />
    );
  }

  return <>{demo}</>;
}

// ------------------------------------------------------------------ bubble ---

export function BubbleGate({
  demo,
  locale,
}: {
  demo: React.ReactNode;
  locale: Locale;
}) {
  const [local, setLocal] = useState<{
    events: CareerEvent[];
    jobs: { id: string; label: string }[];
  } | null>(null);
  const [checked, setChecked] = useState(false);

  function refresh() {
    setLocal({
      events: getLocalEvents().filter((e) => e.eventType === "bubble"),
      jobs: getLocalJobs().map((r) => ({
        id: r.job.id,
        label: `${pick(r.job.company, locale)} · ${pick(r.job.title, locale)}`,
      })),
    });
  }

  useEffect(() => {
    if (getLocalMode() === "local" && getLocalProfile()) refresh();
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  if (checked && local) {
    return (
      <BubbleSpace
        events={local.events}
        jobs={local.jobs}
        mode="local"
        locale={locale}
        onAdd={(content, jobId) => {
          saveLocalEvent({
            id: newEventId("event"),
            eventType: "bubble",
            sourceType: "bubble",
            ...(jobId ? { jobId } : {}),
            content,
            createdAt: new Date().toISOString(),
          });
          refresh();
        }}
        onDelete={(id) => {
          removeLocalEvent(id);
          refresh();
        }}
      />
    );
  }

  return <>{demo}</>;
}

/** Shared helper for the header's local-mode identity slot. */
export function useLocalIdentity(): {
  ready: boolean;
  mode: "demo" | "local";
  hasProfile: boolean;
  name: string;
} {
  const [identity, setIdentity] = useState({
    ready: false,
    mode: "demo" as "demo" | "local",
    hasProfile: false,
    name: "",
  });

  useEffect(() => {
    const record = getLocalProfile();
    setIdentity({
      ready: true,
      mode: getLocalMode(),
      hasProfile: record !== null,
      name: record?.profile.basic.name || record?.name || "",
    });
  }, []);

  return identity;
}
