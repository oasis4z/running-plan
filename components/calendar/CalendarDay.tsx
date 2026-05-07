"use client";

import type { TrainingPlan, StravaActivity } from "@/lib/types";
import type { RunType } from "@/lib/types";

// Softer pastel backgrounds + bold badge colors per run type
const CELL_COLORS: Record<RunType, { bg: string; border: string; text: string; badge: string }> = {
  Rest:       { bg: "#f8fafc", border: "#e2e8f0", text: "#64748b", badge: "#94a3b8" },
  Easy:       { bg: "#f0fdf4", border: "#86efac", text: "#166534", badge: "#16a34a" },
  "Long Run": { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", badge: "#2563eb" },
  Tempo:      { bg: "#fff7ed", border: "#fdba74", text: "#9a3412", badge: "#ea580c" },
  Interval:   { bg: "#fff1f2", border: "#fda4af", text: "#9f1239", badge: "#e11d48" },
  Fartlek:    { bg: "#f5f3ff", border: "#c4b5fd", text: "#5b21b6", badge: "#7c3aed" },
};

interface CalendarDayProps {
  day: number;
  date: string;
  plan?: TrainingPlan;
  actual?: StravaActivity;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isRaceDay?: boolean;
  raceName?: string;
  onClick: (date: string, rect: DOMRect) => void;
}

function getActivityIcon(type: string): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("ride") || t === "cycling") return "🚴";
  if (t.includes("swim")) return "🏊";
  if (t.includes("walk") || t.includes("hike")) return "🚶";
  if (t.includes("yoga") || t === "workout") return "🏋️";
  return "🏃";
}

function formatDurMin(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

export default function CalendarDay({
  day, date, plan, actual, isToday, isSelected, isCurrentMonth, isRaceDay, raceName, onClick,
}: CalendarDayProps) {
  const colors = plan ? CELL_COLORS[plan.runType] : null;

  const cellStyle: React.CSSProperties = isRaceDay
    ? {
        background: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%)",
        borderColor: isSelected ? "#3b82f6" : "#c084fc",
        opacity: isCurrentMonth ? 1 : 0.35,
      }
    : colors
    ? {
        backgroundColor: colors.bg,
        borderColor: isSelected ? "#3b82f6" : colors.border,
        opacity: isCurrentMonth ? 1 : 0.25,
      }
    : {
        backgroundColor: "#ffffff",
        borderColor: isSelected ? "#3b82f6" : "#f1f5f9",
        opacity: isCurrentMonth ? 1 : 0.25,
      };

  return (
    <button
      onClick={(e) => onClick(date, e.currentTarget.getBoundingClientRect())}
      title={isRaceDay && raceName ? `🏁 Race day: ${raceName}` : undefined}
      style={cellStyle}
      className={[
        "relative flex flex-col items-start p-1.5 sm:p-2 min-h-[80px] sm:min-h-[104px] rounded-xl border-2 text-left w-full overflow-hidden",
        "transition-all duration-150 hover:brightness-95",
        !plan && !isRaceDay && "hover:bg-slate-50",
        isSelected && "ring-2 ring-blue-500 ring-offset-1 shadow-md",
        isRaceDay && "shadow-sm",
      ].filter(Boolean).join(" ")}
    >
      {/* Race day emoji */}
      {isRaceDay && (
        <span className="absolute top-1.5 right-1.5 text-sm leading-none">🏁</span>
      )}

      {/* Day number */}
      <span
        style={colors && !isToday && !isRaceDay ? { color: colors.text } : undefined}
        className={[
          "text-xs sm:text-sm font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full flex-shrink-0 mb-1",
          isToday
            ? "bg-blue-600 text-white shadow-sm"
            : isRaceDay
            ? "text-purple-800"
            : !plan
            ? "text-slate-300"
            : "",
        ].join(" ")}
      >
        {day}
      </span>

      {/* Race label */}
      {isRaceDay && raceName && (
        <>
          <span className="inline-flex self-start items-center px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 mb-1 leading-none">
            🏁 RACE
          </span>
          <p className="text-[9px] sm:text-[11px] font-semibold text-purple-900 line-clamp-2 break-words w-full leading-snug">
            {raceName}
          </p>
        </>
      )}

      {/* Plan badge */}
      {plan && colors && (
        <span
          style={{ backgroundColor: colors.badge }}
          className="self-start px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold text-white leading-none max-w-full truncate"
        >
          {"Plan: " + plan.runType}
          {plan.fartlek
            ? ` ${plan.fartlek.fastMin}/${plan.fartlek.slowMin}×${plan.fartlek.sets}`
            : plan.distanceKm
            ? ` ${plan.distanceKm}km`
            : plan.durationMin
            ? ` ${plan.durationMin}min`
            : ""}
        </span>
      )}

      {/* Strava actual — white card, works on every bg color */}
      {actual && (
        <div
          className="mt-auto w-full rounded-lg overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.90)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
          title={`${actual.name} · ${actual.distanceKm}km · ${formatDurMin(actual.durationMin)}${actual.avgHr ? ` · Avg♥${actual.avgHr}` : ""}${actual.maxHr ? ` Max♥${actual.maxHr}` : ""}`}
        >
          <div className="px-1.5 sm:px-2 py-1 sm:py-1.5 flex flex-col gap-0.5">
            {/* icon dist · time */}
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 leading-none flex-shrink-0">
                {getActivityIcon(actual.type)} {actual.distanceKm}km
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 leading-none truncate min-w-0">
                · {formatDurMin(actual.durationMin)}
              </span>
            </div>
            {/* Max ♥ · Avg ♥ */}
            {(actual.maxHr || actual.avgHr) && (
              <div className="flex items-center gap-2">
                {actual.maxHr && (
                  <span className="flex items-center gap-0.5 leading-none">
                    <span className="text-[8px] text-slate-400">Max</span>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-rose-500">{actual.maxHr}</span>
                    <span className="text-[9px] text-rose-400">♥</span>
                  </span>
                )}
                {actual.avgHr && (
                  <span className="flex items-center gap-0.5 leading-none">
                    <span className="text-[8px] text-slate-400">Avg</span>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-rose-400">{actual.avgHr}</span>
                    <span className="text-[9px] text-rose-300">♥</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  );
}
