"use client";

import { useState, useEffect } from "react";
import type { TrainingPlan } from "@/lib/types";

/**
 * Fetch plans from the last `monthsBack` months + current month, in parallel.
 * Used by Training Load Chart (8 weeks ≈ 2 months back).
 */
export function useRecentPlans(monthsBack: number = 2) {
  const [plans, setPlans] = useState<Record<string, TrainingPlan>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const months: { year: number; month: number }[] = [];
    for (let i = monthsBack; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    Promise.all(
      months.map((m) =>
        fetch(`/api/plans?year=${m.year}&month=${m.month}`)
          .then((r) => (r.ok ? (r.json() as Promise<TrainingPlan[]>) : []))
          .catch(() => [])
      )
    )
      .then((results) => {
        const map: Record<string, TrainingPlan> = {};
        for (const list of results) {
          for (const p of list) map[p.date] = p;
        }
        setPlans(map);
      })
      .finally(() => setLoading(false));
  }, [monthsBack]);

  return { plans, loading };
}
