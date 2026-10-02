import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { getSessionUser, getUserProfile } from "@/lib/user-data";

export const metadata: Metadata = { title: "Onboarding" };

/**
 * Onboarding does not require a login (local-first user mode): without a
 * cloud session the confirmed profile is saved to this browser. A logged-in
 * user saves to their account as before.
 */
export default async function OnboardingPage() {
  const user = await getSessionUser();

  if (user) {
    // Already onboarded → straight home.
    const profile = await getUserProfile();
    if (profile) redirect("/");
  }

  return (
    <Container>
      <div className="mx-auto flex w-full justify-center py-12">
        <OnboardingFlow />
      </div>
    </Container>
  );
}
