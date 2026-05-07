"use client";

import { useMemo } from "react";
import { useRecentPlans } from "@/hooks/useRecentPlans";

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMondayOfWeek(d: Date): Date {
  const dow = d.getDay();
  const diff = (dow + 6) % 7;
  const m = new Date(d);
  m.setDate(d.getDate() - diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

const WEEKS = 8;

export default function TrainingLoadChart() {
  const { plans, loading } = useRecentPlans(2);

  const weeks = useMemo(() => {
    const today = new Date();
    const thisMonday = getMondayOfWeek(today);

    const result: { label: string; km: number; min: number; isCurrent: boolean }[] = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const monday = new Date(thisMonday);
      monday.setDate(thisMonday.getDate() - i * 7);

      let km = 0;
      let min = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + d);
        const plan = plans[localDateStr(day)];
        if (!plan) continue;
        if (plan.distanceKm) km += plan.distanceKm;
        if (plan.durationMin) min += plan.durationMin;
      }

      const label =
        i === 0
          ? "Now"
          : monday.toLocaleDateString("en-US", { day: "numeric", month: "short" });

      result.push({ label, km, min, isCurrent: i === 0 });
    }
    return result;
  }, [plans]);

  if (loading) return null;

  const maxKm = Math.max(1, ...weeks.map((w) => w.km));
  const hasData = weeks.some((w) => w.km > 0 || w.min > 0);
  if (!hasData) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          📊 Training Load
        </h3>
        <span className="text-[11px] text-gray-400">last 8 weeks</span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {weeks.map((w, i) => {
          const heightPct = w.km > 0 ? Math.max(8, (w.km / maxKm) * 100) : 4;
          const barColor = w.isCurrent ? "#2563eb" : w.km > 0 ? "#60a5fa" : "#e5e7eb";
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-[10px] font-semibold text-gray-700 leading-none mb-0.5">
                {w.km > 0 ? (w.km % 1 === 0 ? w.km : w.km.toFixed(1)) : ""}
              </span>
              <div
                style={{ height: `${heightPct}%`, backgroundColor: barColor }}
                className="w-full rounded-t-md transition-all"
                title={`${w.label}: ${w.km} km${w.min ? ` · ${w.min} min` : ""}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        {weeks.map((w, i) => (
          <div key={i} className="flex-1 text-center">
            <span className={`text-[10px] ${w.isCurrent ? "text-blue-600 font-bold" : "text-gray-400"}`}>
              {w.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
