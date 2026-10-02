import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { I18nProvider } from "@/i18n/i18n-provider";
import { resolveLocale } from "@/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CareerOS",
    template: "%s · CareerOS",
  },
  description:
    "A calm, human-centered workspace for your first serious job search.",
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Resolved on the server so the first paint is already in the right language.
  const locale = await resolveLocale();

  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLocale={locale}>
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
