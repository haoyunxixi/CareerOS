import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Greeting } from "@/components/home/greeting";
import { HomeView } from "@/components/home/home-view";
import { getDayPart } from "@/lib/greeting";
import type { Locale } from "@/i18n/config";

/**
 * Home for a real (cloud or browser-local) user. Presentational only —
 * the caller (a server page or the local-mode gate) assembles the
 * interview list and latest learning from its own data space, so this
 * component stays importable from both server and client trees.
 */
export function UserHome({
  name,
  interviews,
  learning,
  hasProfile,
  locale,
}: {
  name: string;
  interviews: Parameters<typeof HomeView>[0]["interviews"];
  learning?: Parameters<typeof HomeView>[0]["learning"];
  hasProfile: boolean;
  locale: Locale;
}) {
  return (
    <Container padding="none" className="pb-16 pt-10 md:pb-24 md:pt-20">
      <Greeting name={name} dayPart={getDayPart()} />

      <div className="mt-8 flex flex-col gap-10 md:mt-11">
        {!hasProfile ? (
          <div className="rounded-field border border-line bg-canvas-raised px-6 py-6">
            <p className="text-body text-ink">Let CareerOS get to know you first.</p>
            <div className="mt-4">
              <ButtonLink href="/onboarding">Build my career profile</ButtonLink>
            </div>
          </div>
        ) : null}

        {interviews.length === 0 ? (
          <div className="rounded-field border border-line bg-canvas-raised px-6 py-6">
            <p className="text-body text-ink">No target jobs yet.</p>
            <div className="mt-4">
              <ButtonLink href="/interview">Add an interview</ButtonLink>
            </div>
          </div>
        ) : (
          <HomeView
            interviews={interviews}
            learning={learning}
            locale={locale}
          />
        )}
      </div>
    </Container>
  );
}
