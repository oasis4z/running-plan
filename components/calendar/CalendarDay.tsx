"use client";

import type { TrainingPlan } from "@/lib/types";
import { RUN_TYPE_BG, RUN_TYPE_ABBR } from "@/lib/constants";

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
  return (
    <button
      onClick={() => onClick(date)}
      className={[
        "relative flex flex-col items-start p-1.5 sm:p-2 min-h-[64px] sm:min-h-[80px] rounded-lg border text-left transition-all",
        isSelected
          ? "border-blue-400 bg-blue-50 shadow-sm"
          : "border-transparent hover:border-gray-200 hover:bg-gray-50",
        !isCurrentMonth && "opacity-40",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
          isToday
            ? "bg-blue-600 text-white"
            : "text-gray-700",
        ].join(" ")}
      >
        {day}
      </span>

      {plan && (
        <div className="mt-1 w-full">
          <span
            className={[
              "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white",
              RUN_TYPE_BG[plan.runType],
            ].join(" ")}
          >
            {RUN_TYPE_ABBR[plan.runType]}
            {plan.distanceKm ? ` ${plan.distanceKm}k` : ""}
          </span>
        </div>
      )}
    </button>
  );
}
