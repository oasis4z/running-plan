"use client";

import { useMemo } from "react";
import type { TrainingPlan, RunType } from "@/lib/types";

interface WeeklySummaryProps {
  plans: Record<string, TrainingPlan>;
  anchorDate?: string | null; // use this date's week; default to today
}

// Pill colors for each run type (inline hex for Tailwind JIT safety)
const TYPE_COLORS: Record<RunType, { bg: string; text: string; dot: string }> = {
  Easy:       { bg: "#d1fae5", text: "#065f46", dot: "#059669" },
  "Long Run": { bg: "#dbeafe", text: "#1e3a8a", dot: "#2563eb" },
  Tempo:      { bg: "#ffedd5", text: "#7c2d12", dot: "#ea580c" },
  Interval:   { bg: "#fee2e2", text: "#7f1d1d", dot: "#dc2626" },
  Fartlek:    { bg: "#e0e7ff", text: "#312e81", dot: "#4f46e5" },
  Rest:       { bg: "#f3f4f6", text: "#4b5563", dot: "#9ca3af" },
};

function getMondayOfWeek(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay(); // 0=Sun
  const diff = (dow + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WeeklySummary({ plans, anchorDate }: WeeklySummaryProps) {
  const today = localDateStr(new Date());
  const anchor = anchorDate ?? today;

  const { totalKm, totalMin, sessions, breakdown, weekStart, weekEnd, hasData } = useMemo(() => {
    const monday = getMondayOfWeek(anchor);
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(localDateStr(d));
    }

    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];

    let totalKm = 0;
    let totalMin = 0;
    let sessions = 0;
    const breakdown: Partial<Record<RunType, number>> = {};

    for (const date of weekDates) {
      const plan = plans[date];
      if (!plan) continue;
      if (plan.runType !== "Rest") {
        sessions++;
        if (plan.distanceKm) totalKm += plan.distanceKm;
        if (plan.durationMin) totalMin += plan.durationMin;
      }
      breakdown[plan.runType] = (breakdown[plan.runType] ?? 0) + 1;
    }

    const hasData = Object.keys(breakdown).length > 0;
    return { totalKm, totalMin, sessions, breakdown, weekStart, weekEnd, hasData };
  }, [plans, anchor]);

  if (!hasData) return null;

  const weekLabel = (() => {
    const s = new Date(weekStart + "T00:00:00");
    const e = new Date(weekEnd + "T00:00:00");
    const sStr = s.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    const eStr = e.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    return `${sStr} – ${eStr}`;
  })();

  const RUN_TYPE_ORDER: RunType[] = ["Easy", "Long Run", "Tempo", "Interval", "Fartlek", "Rest"];

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm shadow-sm">
      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
        <span>📅</span>
        <span>{weekLabel}</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {sessions > 0 && (
          <span className="text-gray-700 font-semibold">
            {sessions} session{sessions !== 1 ? "s" : ""}
          </span>
        )}
        {totalKm > 0 && (
          <span className="text-gray-700 font-semibold">
            {totalKm % 1 === 0 ? totalKm : totalKm.toFixed(1)} km
          </span>
        )}
        {totalMin > 0 && (
          <span className="text-gray-700 font-semibold">
            {totalMin} min
          </span>
        )}

        <div className="flex flex-wrap gap-1.5">
          {RUN_TYPE_ORDER.filter((t) => breakdown[t]).map((type) => {
            const c = TYPE_COLORS[type];
            const count = breakdown[type]!;
            return (
              <span
                key={type}
                style={{ backgroundColor: c.bg, color: c.text }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              >
                <span style={{ backgroundColor: c.dot }} className="w-1.5 h-1.5 rounded-full" />
                {type} ×{count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
