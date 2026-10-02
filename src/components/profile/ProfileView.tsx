"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileBasicSection } from "@/components/profile/ProfileBasicSection";
import { ProfileExperienceSection } from "@/components/profile/ProfileExperienceSection";
import { ProfileSkillsSection } from "@/components/profile/ProfileSkillsSection";
import { EditProfileDrawer } from "@/components/profile/EditProfileDrawer";
import { getLocalProfile, saveLocalProfile } from "@/lib/local-data";
import type { Locale } from "@/i18n/config";
import type { CareerProfile } from "@/types";

export interface ProfileViewProps {
  profile: CareerProfile;
  locale: Locale;
  /**
   * "user": the logged-in user's own profile — edits are persisted back to
   * their account. "local": the browser-local profile (local-first mode) —
   * edits are saved to localStorage. "demo" (default): local-state only.
   */
  mode?: "demo" | "user" | "local";
}

/**
 * Top-level client wrapper for `/profile`.
 *
 * Owns the editable copy of the profile. In demo mode edits stay in local
 * state (the seeded profile is read-only by design); in user mode an edit
 * is PUT to /api/profile so the confirmed profile — the source the Match /
 * Interview pipeline reads — stays current. In local mode the edit updates
 * the browser's localStorage copy.
 */
export function ProfileView({ profile, locale, mode = "demo" }: ProfileViewProps) {
  const [current, setCurrent] = useState<CareerProfile>(profile);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const handleSave = async (next: CareerProfile) => {
    setCurrent(next);
    if (mode === "local") {
      // Local-first mode: keep this browser's copy current.
      const record = getLocalProfile();
      saveLocalProfile({
        profile: next,
        name: record?.name ?? next.basic.name ?? "",
        resumeText: record?.resumeText ?? "",
      });
      return;
    }
    if (mode !== "user") return;
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: next }),
      });
      setSaveFailed(!res.ok);
    } catch {
      setSaveFailed(true);
    }
  };

  return (
    <>
      <ProfileHeader
        profile={current}
        locale={locale}
        onEdit={() => setDrawerOpen(true)}
      />

      <div className="mt-14 flex flex-col gap-14 md:mt-16 md:gap-16">
        <ProfileBasicSection profile={current} locale={locale} />
        <ProfileExperienceSection profile={current} locale={locale} />
        <ProfileSkillsSection profile={current} locale={locale} />
      </div>

      {saveFailed ? (
        <p className="mt-6 text-meta text-ink">保存失败，请重试。</p>
      ) : null}

      <EditProfileDrawer
        open={drawerOpen}
        profile={current}
        locale={locale}
        onClose={() => setDrawerOpen(false)}
        onSave={(next) => void handleSave(next)}
      />
    </>
  );
}
