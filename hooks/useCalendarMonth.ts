"use client";

import { useState, useEffect, useCallback } from "react";
import type { TrainingPlan } from "@/lib/types";

function adjacentMonths(year: number, month: number) {
  const prev = month === 1  ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1  } : { year, month: month + 1 };
  return [prev, { year, month }, next];
}

export function useCalendarMonth(athleteId: string, year: number, month: number) {
  const [plans, setPlans] = useState<Record<string, TrainingPlan>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true);
    setError(null);
    try {
      const months = adjacentMonths(year, month);
      const results = await Promise.all(
        months.map(({ year: y, month: m }) =>
          fetch(`/api/plans?athlete=${encodeURIComponent(athleteId)}&year=${y}&month=${m}`).then((r) => {
            if (!r.ok) throw new Error("Failed to fetch plans");
            return r.json() as Promise<TrainingPlan[]>;
          })
        )
      );
      const map: Record<string, TrainingPlan> = {};
      for (const list of results) {
        for (const plan of list) {
          map[plan.date] = plan;
        }
      }
      setPlans(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [athleteId, year, month]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, loading, error, refetch: fetchPlans };
}
