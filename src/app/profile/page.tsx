import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ProfileView } from "@/components/profile/ProfileView";
import { resolveLocale } from "@/i18n/server";
import { getSessionUser, getProfileForViewer, getUserProfile } from "@/lib/user-data";
import { ProfileGate } from "@/components/mode/local-gates";

export async function generateMetadata(): Promise<Metadata> {
  // The page title is the same key as the headline — keeping them in sync
  // means there is one place to change the profile's wording in future.
  const { createTranslator } = await import("@/i18n/dictionaries");
  const locale = await resolveLocale();
  return { title: createTranslator(locale)("profile.title") };
}

export default async function ProfilePage() {
  const locale = await resolveLocale();
  const user = await getSessionUser();

  // Real user without a confirmed profile yet → onboarding first.
  if (user) {
    const existing = await getUserProfile();
    if (!existing) redirect("/onboarding");
    return (
      <Container>
        <ProfileView profile={existing} locale={locale} mode="user" />
      </Container>
    );
  }

  // Demo mode by default; the gate swaps in the browser-local profile when
  // the viewer is in local-first mode (no Supabase required).
  const { profile } = await getProfileForViewer();
  if (!profile) redirect("/onboarding");
  return (
    <Container>
      <ProfileGate
        locale={locale}
        demo={<ProfileView profile={profile} locale={locale} mode="demo" />}
      />
    </Container>
  );
}
