"use client";

import { useMemo } from "react";
import CalendarNav from "./CalendarNav";
import CalendarDay from "./CalendarDay";

import type { TrainingPlan, StravaActivity } from "@/lib/types";

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarViewProps {
  year: number;
  month: number;
  plans: Record<string, TrainingPlan>;
  actuals?: Record<string, StravaActivity>;
  loading: boolean;
  isAdmin?: boolean;
  selectedDate: string | null;
  raceDate?: string | null;
  raceName?: string;
  onSelectDate: (date: string, rect: DOMRect) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

// Use local date to avoid UTC timezone shift (e.g. GMT+7)
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i);
    days.push({ date: localDateStr(d), day: d.getDate(), isCurrentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(year, month - 1, d);
    days.push({ date: localDateStr(dateObj), day: d, isCurrentMonth: true });
  }
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month, i);
      days.push({ date: localDateStr(d), day: d.getDate(), isCurrentMonth: false });
    }
  }
  return days;
}

export default function CalendarView({
  year, month, plans, actuals, loading, isAdmin = false, selectedDate, raceDate, raceName, onSelectDate, onPrevMonth, onNextMonth,
}: CalendarViewProps) {
  const todayStr = localDateStr(new Date());
  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);

  return (
    <div className="flex flex-col gap-4">
      <CalendarNav year={year} month={month} onPrev={onPrevMonth} onNext={onNextMonth} />

      {isAdmin && (
        <div className="flex items-center gap-2 px-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            Admin Mode
          </span>
          <span className="text-xs text-gray-500">Click any day to add or edit training</span>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center text-xs font-medium text-gray-400 py-1">
            {h}
          </div>
        ))}
        {calendarDays.map(({ date, day, isCurrentMonth }) => (
          <CalendarDay
            key={date}
            day={day}
            date={date}
            plan={plans[date]}
            actual={actuals?.[date]}
            isToday={date === todayStr}
            isSelected={date === selectedDate}
            isCurrentMonth={isCurrentMonth}
            isRaceDay={raceDate === date}
            raceName={raceDate === date ? raceName : undefined}
            onClick={onSelectDate}
          />
        ))}
      </div>

      {loading && (
        <p className="text-center text-xs text-gray-400 py-2">Loading...</p>
      )}

    </div>
  );
}
