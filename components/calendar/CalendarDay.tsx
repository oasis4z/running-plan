"use client";

import type { TrainingPlan, StravaActivity } from "@/lib/types";
import type { RunType } from "@/lib/types";
import { RUN_TYPE_ABBR } from "@/lib/constants";

// Inline styles — Tailwind JIT cannot detect dynamic class names from object lookups
const CELL_COLORS: Record<RunType, { bg: string; border: string; text: string; badge: string }> = {
  Rest:       { bg: "#f3f4f6", border: "#d1d5db", text: "#4b5563", badge: "#6b7280" },
  Easy:       { bg: "#a7f3d0", border: "#34d399", text: "#064e3b", badge: "#059669" },
  "Long Run": { bg: "#bfdbfe", border: "#60a5fa", text: "#1e3a8a", badge: "#2563eb" },
  Tempo:      { bg: "#fed7aa", border: "#fb923c", text: "#7c2d12", badge: "#ea580c" },
  Interval:   { bg: "#fca5a5", border: "#f87171", text: "#7f1d1d", badge: "#dc2626" },
  Fartlek:    { bg: "#c7d2fe", border: "#818cf8", text: "#312e81", badge: "#4f46e5" },
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
  onClick: (date: string) => void;
}

function formatDurMin(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h} hr` : `${h}h ${m}m`;
}

export default function CalendarDay({
  day, date, plan, actual, isToday, isSelected, isCurrentMonth, isRaceDay, raceName, onClick,
}: CalendarDayProps) {
  const summaryText = plan?.description?.split("\n").join(" · ") ?? "";
  const colors = plan ? CELL_COLORS[plan.runType] : null;

  // Race day takes visual priority — purple gradient style
  const cellStyle: React.CSSProperties = isRaceDay
    ? {
        background:
          "linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)",
        borderColor: isSelected ? "#3b82f6" : "#a855f7",
        opacity: isCurrentMonth ? 1 : 0.35,
      }
    : colors
    ? {
        backgroundColor: colors.bg,
        borderColor: isSelected ? "#3b82f6" : colors.border,
        opacity: isCurrentMonth ? 1 : 0.25,
      }
    : {
        borderColor: isSelected ? "#3b82f6" : "#e5e7eb",
        opacity: isCurrentMonth ? 1 : 0.25,
      };

  return (
    <button
      onClick={() => onClick(date)}
      title={isRaceDay && raceName ? `🏁 Race day: ${raceName}` : undefined}
      style={cellStyle}
      className={[
        "relative flex flex-col items-start p-1.5 sm:p-2 min-h-[100px] sm:min-h-[120px] rounded-xl border-2 text-left transition-all w-full",
        !plan && !isRaceDay && "bg-white hover:bg-gray-50",
        isSelected && "ring-2 ring-blue-500 ring-offset-1",
        isRaceDay && "shadow-md",
      ].filter(Boolean).join(" ")}
    >
      {/* Race day flag in corner */}
      {isRaceDay && (
        <span className="absolute top-1 right-1 text-base leading-none">🏁</span>
      )}

      {/* Day number */}
      <span
        style={colors && !isToday && !isRaceDay ? { color: colors.text } : undefined}
        className={[
          "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 flex-shrink-0",
          isToday ? "bg-blue-600 text-white" : isRaceDay ? "text-purple-900" : !plan ? "text-gray-400" : "",
        ].join(" ")}
      >
        {day}
      </span>

      {/* Race day label */}
      {isRaceDay && raceName && (
        <span className="inline-flex self-start items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-tight bg-gradient-to-r from-purple-600 to-pink-600 mb-1 max-w-full truncate">
          🏁 RACE DAY
        </span>
      )}
      {isRaceDay && raceName && (
        <p className="text-[11px] leading-snug font-bold text-purple-900 line-clamp-2 mb-1">
          {raceName}
        </p>
      )}

      {plan && colors && (
        <div className="flex flex-col gap-1 w-full min-w-0">
          {/* Badge */}
          <span
            style={{ backgroundColor: colors.badge }}
            className="inline-flex self-start items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-tight"
          >
            {RUN_TYPE_ABBR[plan.runType]}
            {plan.fartlek
              ? ` ${plan.fartlek.fastMin}/${plan.fartlek.slowMin}×${plan.fartlek.sets}`
              : plan.distanceKm
              ? ` ${plan.distanceKm}km`
              : plan.durationMin
              ? ` ${plan.durationMin}min`
              : ""}
          </span>
          {/* Workout text */}
          <p
            style={{ color: isRaceDay ? "#581c87" : colors.text }}
            className="text-[11px] leading-snug font-medium line-clamp-2"
          >
            {summaryText}
          </p>
        </div>
      )}

      {/* Actual run badge from Strava */}
      {actual && (
        <div
          className="mt-auto self-start inline-flex flex-col gap-0.5 px-2 py-1 rounded-md text-white text-[10px] font-semibold leading-tight shadow-sm"
          style={{ background: "linear-gradient(135deg, #fc4c02 0%, #f43f5e 100%)" }}
          title={`${actual.name} · ${actual.distanceKm} km · ${formatDurMin(actual.durationMin)}${actual.avgHr ? ` · ❤️ ${actual.avgHr}` : ""}`}
        >
          <span className="flex items-center gap-1">
            <span>✓</span>
            <span className="font-bold">{actual.distanceKm} km</span>
          </span>
          <span className="opacity-90 font-medium">
            {formatDurMin(actual.durationMin)}
            {actual.avgHr ? ` · ${actual.avgHr}♥` : ""}
          </span>
        </div>
      )}
    </button>
  );
}
