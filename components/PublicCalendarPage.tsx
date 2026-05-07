"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import CalendarView from "./calendar/CalendarView";
import DayDetailPanel from "./day-detail/DayDetailPanel";
import RaceCountdown from "./RaceCountdown";
import WeatherWidget from "./WeatherWidget";
import WeeklySummary from "./WeeklySummary";
import MonthlyLoadChart from "./MonthlyLoadChart";
import AthleteSwitcher from "./AthleteSwitcher";
import { useCalendarMonth } from "@/hooks/useCalendarMonth";
import { useRace } from "@/hooks/useRace";
import { useActualRuns } from "@/hooks/useActualRuns";
import type { Athlete } from "@/lib/types";

interface PublicCalendarPageProps {
  athlete: Athlete;
}

export default function PublicCalendarPage({ athlete }: PublicCalendarPageProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { plans, loading } = useCalendarMonth(athlete.id, year, month);
  const race = useRace(athlete.id);
  const { runs: actuals } = useActualRuns(athlete.id, year, month);

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
          <Link href="/" className="text-2xl hover:opacity-80">🏃</Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{athlete.name}</h1>
            <p className="text-xs text-gray-400">Training Plan</p>
          </div>
          <AthleteSwitcher currentSlug={athlete.slug} />
          <a
            href={`/api/calendar.ics?athlete=${encodeURIComponent(athlete.id)}`}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            title="Download .ics to import into Google/iOS Calendar"
          >
            📅 .ics
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          {/* Race Countdown */}
          <RaceCountdown athleteId={athlete.id} />

          {/* Weather + PM2.5 (shared) */}
          <WeatherWidget />

          {/* Monthly Cumulative Load */}
          <MonthlyLoadChart actuals={actuals} year={year} month={month} />

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <WeeklySummary plans={plans} anchorDate={selectedDate} />
                <CalendarView
                  year={year}
                  month={month}
                  plans={plans}
                  actuals={actuals}
                  loading={loading}
                  selectedDate={selectedDate}
                  raceDate={race?.date}
                  raceName={race?.name}
                  onSelectDate={setSelectedDate}
                  onPrevMonth={prevMonth}
                  onNextMonth={nextMonth}
                />
              </div>
            </div>

            {selectedDate && (
              <div className="lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:min-h-[400px]">
                <DayDetailPanel
                  date={selectedDate}
                  plan={selectedPlan}
                  actual={actuals[selectedDate]}
                  loading={loading}
                  onClose={() => setSelectedDate(null)}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
