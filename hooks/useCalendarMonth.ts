"use client";

import { useState, useEffect, useCallback } from "react";
import type { TrainingPlan } from "@/lib/types";

export function useCalendarMonth(year: number, month: number) {
  const [plans, setPlans] = useState<Record<string, TrainingPlan>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/plans?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch plans");
      const data: TrainingPlan[] = await res.json();
      const map: Record<string, TrainingPlan> = {};
      for (const plan of data) {
        map[plan.date] = plan;
      }
      setPlans(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, loading, error, refetch: fetchPlans };
}
