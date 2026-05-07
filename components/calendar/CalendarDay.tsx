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
  onClick: (date: string, rect: DOMRect) => void;
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
      onClick={(e) => onClick(date, e.currentTarget.getBoundingClientRect())}
      title={isRaceDay && raceName ? `🏁 Race day: ${raceName}` : undefined}
      style={cellStyle}
      className={[
        "relative flex flex-col items-start p-1 sm:p-2 min-h-[72px] sm:min-h-[96px] rounded-xl border-2 text-left transition-all w-full overflow-hidden",
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
          "text-xs sm:text-sm font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mb-0.5 flex-shrink-0",
          isToday ? "bg-blue-600 text-white" : isRaceDay ? "text-purple-900" : !plan ? "text-gray-400" : "",
        ].join(" ")}
      >
        {day}
      </span>

      {/* Race day label */}
      {isRaceDay && raceName && (
        <span className="inline-flex self-start items-center px-1 py-0.5 rounded text-[8px] sm:text-[10px] font-bold text-white leading-tight bg-gradient-to-r from-purple-600 to-pink-600 mb-0.5 max-w-full truncate">
          🏁 RACE
        </span>
      )}
      {isRaceDay && raceName && (
        <p className="text-[9px] sm:text-[11px] leading-snug font-bold text-purple-900 line-clamp-2 mb-0.5 break-words w-full">
          {raceName}
        </p>
      )}

      {plan && colors && (
        <span
          style={{ backgroundColor: colors.badge }}
          className="self-start px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold text-white leading-none max-w-full truncate"
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
      )}

      {/* Strava actual — green "completed" card */}
      {actual && (
        <div
          className="mt-auto w-full rounded-lg overflow-hidden"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
          title={`${actual.name} · ${actual.distanceKm}km · ${formatDurMin(actual.durationMin)}${actual.avgHr ? ` · Avg♥${actual.avgHr}` : ""}${actual.maxHr ? ` Max♥${actual.maxHr}` : ""}`}
        >
          <div className="px-2 py-1 sm:py-1.5 flex flex-col gap-0.5">
            {/* Plan label */}
            {plan && (
              <span className="text-[8px] sm:text-[9px] text-white/70 font-medium leading-none">
                Plan: {plan.runType}
              </span>
            )}
            {/* ✓ dist · time */}
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-white leading-none flex-shrink-0">
                ✓ {actual.distanceKm}km
              </span>
              <span className="text-[9px] sm:text-[10px] text-white/80 leading-none truncate min-w-0">
                · {formatDurMin(actual.durationMin)}
              </span>
            </div>
            {/* HR: Max ♥ then Avg ♥ */}
            {(actual.maxHr || actual.avgHr) && (
              <div className="flex items-center gap-2">
                {actual.maxHr && (
                  <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-white/90 leading-none">
                    <span className="opacity-60 text-[8px] sm:text-[9px]">Max</span>
                    <span className="font-semibold">{actual.maxHr}</span>
                    <span>♥</span>
                  </span>
                )}
                {actual.avgHr && (
                  <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-white/90 leading-none">
                    <span className="opacity-60 text-[8px] sm:text-[9px]">Avg</span>
                    <span className="font-semibold">{actual.avgHr}</span>
                    <span>♥</span>
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
