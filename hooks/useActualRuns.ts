"use client";

import { useState, useEffect } from "react";
import type { StravaActivity } from "@/lib/types";

export function useActualRuns(athleteId: string, year: number, month: number) {
  const [runs, setRuns] = useState<Record<string, StravaActivity>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!athleteId) return;
    setLoading(true);
    const months: { y: number; m: number }[] = [];
    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    months.push(prev, { y: year, m: month }, next);

    Promise.all(
      months.map(({ y, m }) =>
        fetch(`/api/strava/activities?athlete=${encodeURIComponent(athleteId)}&year=${y}&month=${m}`)
          .then((r) => (r.ok ? r.json() : { runs: [] }))
          .then((d: { runs?: StravaActivity[] }) => d.runs ?? [])
          .catch(() => [] as StravaActivity[])
      )
    )
      .then((lists) => {
        const map: Record<string, StravaActivity> = {};
        for (const list of lists) {
          for (const run of list) {
            const existing = map[run.date];
            if (!existing) {
              map[run.date] = run;
            } else {
              const totalKm = existing.distanceKm + run.distanceKm;
              const totalMin = existing.durationMin + run.durationMin;
              const longer = run.distanceKm > existing.distanceKm ? run : existing;
              map[run.date] = {
                ...longer,
                distanceKm: Math.round(totalKm * 10) / 10,
                durationMin: Math.round(totalMin),
                paceSecPerKm:
                  totalKm > 0 ? Math.round((totalMin * 60) / totalKm) : longer.paceSecPerKm,
                name: `${existing.name} +${run.name}`,
              };
            }
          }
        }
        setRuns(map);
      })
      .finally(() => setLoading(false));
  }, [athleteId, year, month]);

  return { runs, loading };
}
