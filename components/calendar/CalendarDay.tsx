"use client";

import type { TrainingPlan } from "@/lib/types";
import { RUN_TYPE_CELL_BG, RUN_TYPE_CELL_TEXT, RUN_TYPE_LABEL_BG, RUN_TYPE_ABBR } from "@/lib/constants";

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
  day,
  date,
  plan,
  isToday,
  isSelected,
  isCurrentMonth,
  onClick,
}: CalendarDayProps) {
  // Join all lines for display, replacing \n with " · "
  const summaryText = plan?.description?.split("\n").join(" · ") ?? "";

  return (
    <button
      onClick={() => onClick(date)}
      className={[
        "relative flex flex-col items-start p-1.5 sm:p-2 min-h-[100px] sm:min-h-[120px] rounded-xl border-2 text-left transition-all w-full",
        plan
          ? RUN_TYPE_CELL_BG[plan.runType]
          : "bg-white border-gray-200 hover:bg-gray-50",
        isSelected && "ring-2 ring-blue-500 ring-offset-1",
        !isCurrentMonth && "opacity-25",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Day number */}
      <span
        className={[
          "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 flex-shrink-0",
          isToday
            ? "bg-blue-600 text-white"
            : plan ? RUN_TYPE_CELL_TEXT[plan.runType] : "text-gray-400",
        ].join(" ")}
      >
        {day}
      </span>

      {plan && (
        <div className="flex flex-col gap-1 w-full min-w-0">
          {/* Run type badge */}
          <span className={`inline-flex self-start items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-tight ${RUN_TYPE_LABEL_BG[plan.runType]}`}>
            {RUN_TYPE_ABBR[plan.runType]}
            {plan.distanceKm ? ` ${plan.distanceKm}km` : ""}
          </span>
          {/* Full workout summary */}
          <p className={`text-[11px] leading-snug font-medium line-clamp-3 ${RUN_TYPE_CELL_TEXT[plan.runType]}`}>
            {summaryText}
          </p>
        </div>
      )}
    </button>
  );
}
