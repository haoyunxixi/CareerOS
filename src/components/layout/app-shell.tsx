import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      {/* Bottom padding reserves room for the compact tab bar. */}
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
    </div>
  );
}
