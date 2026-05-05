"use client";

import type { TrainingPlan } from "@/lib/types";
import type { RunType } from "@/lib/types";
import { RUN_TYPE_ABBR } from "@/lib/constants";

// Inline styles — Tailwind JIT cannot detect dynamic class names from object lookups
const CELL_COLORS: Record<RunType, { bg: string; border: string; text: string; badge: string }> = {
  Rest:       { bg: "#f3f4f6", border: "#d1d5db", text: "#4b5563", badge: "#6b7280" },
  Easy:       { bg: "#a7f3d0", border: "#34d399", text: "#064e3b", badge: "#059669" },
  "Long Run": { bg: "#bfdbfe", border: "#60a5fa", text: "#1e3a8a", badge: "#2563eb" },
  Tempo:      { bg: "#fed7aa", border: "#fb923c", text: "#7c2d12", badge: "#ea580c" },
  Interval:   { bg: "#fca5a5", border: "#f87171", text: "#7f1d1d", badge: "#dc2626" },
};

interface CalendarDayProps {
  day: number;
  date: string;
  plan?: TrainingPlan;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  onClick: (date: string) => void;
}

export default function CalendarDay({
  day, date, plan, isToday, isSelected, isCurrentMonth, onClick,
}: CalendarDayProps) {
  const summaryText = plan?.description?.split("\n").join(" · ") ?? "";
  const colors = plan ? CELL_COLORS[plan.runType] : null;

  return (
    <button
      onClick={() => onClick(date)}
      style={colors ? {
        backgroundColor: colors.bg,
        borderColor: isSelected ? "#3b82f6" : colors.border,
        opacity: isCurrentMonth ? 1 : 0.25,
      } : {
        borderColor: isSelected ? "#3b82f6" : "#e5e7eb",
        opacity: isCurrentMonth ? 1 : 0.25,
      }}
      className={[
        "relative flex flex-col items-start p-1.5 sm:p-2 min-h-[100px] sm:min-h-[120px] rounded-xl border-2 text-left transition-all w-full",
        !plan && "bg-white hover:bg-gray-50",
        isSelected && "ring-2 ring-blue-500 ring-offset-1",
      ].filter(Boolean).join(" ")}
    >
      {/* Day number */}
      <span
        style={colors && !isToday ? { color: colors.text } : undefined}
        className={[
          "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 flex-shrink-0",
          isToday ? "bg-blue-600 text-white" : !plan ? "text-gray-400" : "",
        ].join(" ")}
      >
        {day}
      </span>

      {plan && colors && (
        <div className="flex flex-col gap-1 w-full min-w-0">
          {/* Badge */}
          <span
            style={{ backgroundColor: colors.badge }}
            className="inline-flex self-start items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-tight"
          >
            {RUN_TYPE_ABBR[plan.runType]}
            {plan.distanceKm ? ` ${plan.distanceKm}km` : ""}
          </span>
          {/* Workout text */}
          <p
            style={{ color: colors.text }}
            className="text-[11px] leading-snug font-medium line-clamp-3"
          >
            {summaryText}
          </p>
        </div>
      )}
    </button>
  );
}
