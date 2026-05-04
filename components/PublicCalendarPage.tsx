"use client";

import { useState, useCallback } from "react";
import CalendarView from "./calendar/CalendarView";
import DayDetailPanel from "./day-detail/DayDetailPanel";
import { useCalendarMonth } from "@/hooks/useCalendarMonth";

export default function PublicCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { plans, loading } = useCalendarMonth(year, month);

  const selectedPlan = selectedDate ? plans[selectedDate] : undefined;

  const prevMonth = useCallback(() => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }, [month]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🏃</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Running Training Plan</h1>
            <p className="text-xs text-gray-400">Team Schedule</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <CalendarView
              year={year}
              month={month}
              plans={plans}
              loading={loading}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
            />
          </div>

          {selectedDate && (
            <div className="lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:min-h-[400px]">
              <DayDetailPanel
                date={selectedDate}
                plan={selectedPlan}
                loading={loading}
                onClose={() => setSelectedDate(null)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
