"use client";
import { useState, useEffect } from "react";
import type { StravaActivity } from "@/lib/types";

export interface WeekData {
  weekStart: string;   // "YYYY-MM-DD" Monday
  weekLabel: string;   // "Apr 28"
  actualKm: number;
}

function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(mondayStr: string): string {
  const d = new Date(mondayStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function useWeeklyTrend(athleteId: string) {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!athleteId) return;
    setLoading(true);

    const today = new Date();
    // fetch current month + 2 months back = enough for 8 weeks
    const monthsToFetch: { y: number; m: number }[] = [];
    for (let i = 0; i <= 2; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthsToFetch.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
    }

    Promise.all(
      monthsToFetch.map(({ y, m }) =>
        fetch(`/api/strava/activities?athlete=${encodeURIComponent(athleteId)}&year=${y}&month=${m}`)
          .then((r) => (r.ok ? r.json() : { runs: [] }))
          .then((d: { runs?: StravaActivity[] }) => d.runs ?? [])
          .catch(() => [] as StravaActivity[])
      )
    ).then((allLists) => {
      const byDate: Record<string, number> = {};
      const seen = new Set<number>();
      for (const list of allLists) {
        for (const run of list) {
          if (seen.has(run.id)) continue;
          seen.add(run.id);
          byDate[run.date] = (byDate[run.date] ?? 0) + run.distanceKm;
        }
      }

      const byWeek: Record<string, number> = {};
      for (const [date, km] of Object.entries(byDate)) {
        const monday = getMondayOf(date);
        byWeek[monday] = Math.round(((byWeek[monday] ?? 0) + km) * 10) / 10;
      }

      const todayMonday = getMondayOf(today.toISOString().slice(0, 10));
      const result: WeekData[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(todayMonday + "T00:00:00");
        d.setDate(d.getDate() - i * 7);
        const mondayStr = d.toISOString().slice(0, 10);
        result.push({
          weekStart: mondayStr,
          weekLabel: formatWeekLabel(mondayStr),
          actualKm: byWeek[mondayStr] ?? 0,
        });
      }
      setWeeks(result);
    }).finally(() => setLoading(false));
  }, [athleteId]);

  return { weeks, loading };
}
