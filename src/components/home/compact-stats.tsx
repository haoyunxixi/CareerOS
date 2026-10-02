"use client";

import { Stat } from "@/components/ui/stat";
import { useTranslation } from "@/i18n/use-translation";
import type { StatItem } from "@/types";

/**
 * Three numbers in one horizontal strip.
 *
 * No surface, no vertical rules, one hairline to mark where the band starts.
 * The wide horizontal gaps do the separating instead of borders, which keeps
 * the strip from reading as a KPI table.
 */
export function CompactStats({ stats }: { stats: StatItem[] }) {
  const { t } = useTranslation();

  return (
    <section className="border-t border-line pt-5 md:pt-6">
      <ul className="grid grid-cols-3 gap-x-6 md:gap-x-16">
        {stats.map((stat) => (
          <li key={stat.id}>
            <Stat value={stat.value} label={t(stat.labelKey)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
