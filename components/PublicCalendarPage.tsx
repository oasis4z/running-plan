"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import CalendarView from "./calendar/CalendarView";
import DayDetailPanel from "./day-detail/DayDetailPanel";
import DayDetailPopover from "./DayDetailPopover";
import RaceCountdown from "./RaceCountdown";
import WeatherWidget from "./WeatherWidget";
import WeeklySummary from "./WeeklySummary";
import MonthlyLoadChart from "./MonthlyLoadChart";
import WeeklyKmTrend from "./WeeklyKmTrend";
import StravaShoes from "./StravaShoes";
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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { plans, loading } = useCalendarMonth(athlete.id, year, month);
  const race = useRace(athlete.id);
  const { runs: actuals, runLists } = useActualRuns(athlete.id, year, month);

  const selectedPlan = selectedDate ? plans[selectedDate] : undefined;

  const closeDetail = useCallback(() => {
    setSelectedDate(null);
    setAnchorRect(null);
  }, []);

  const handleSelectDate = useCallback((date: string, rect: DOMRect) => {
    if (selectedDate === date) {
      closeDetail();
    } else {
      setSelectedDate(date);
      setAnchorRect(isDesktop ? rect : null);
    }
  }, [selectedDate, isDesktop, closeDetail]);

  const prevMonth = useCallback(() => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    closeDetail();
  }, [month, closeDetail]);

  const nextMonth = useCallback(() => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    closeDetail();
  }, [month, closeDetail]);

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <WeeklyKmTrend athleteId={athlete.id} />
            </div>
            <div>
              <StravaShoes athleteId={athlete.id} />
            </div>
          </div>

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
                  onSelectDate={handleSelectDate}
                  onPrevMonth={prevMonth}
                  onNextMonth={nextMonth}
                />
              </div>
            </div>

            {/* Mobile: stacked panel below calendar */}
            {selectedDate && !isDesktop && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <DayDetailPanel
                  date={selectedDate}
                  plan={selectedPlan}
                  actuals={selectedDate ? runLists[selectedDate] : undefined}
                  athleteId={athlete.id}
                  loading={loading}
                  onClose={closeDetail}
                />
              </div>
            )}
          </div>

          {/* Desktop: floating popover near clicked cell */}
          {selectedDate && isDesktop && anchorRect && (
            <DayDetailPopover anchorRect={anchorRect} onClose={closeDetail}>
              <DayDetailPanel
                date={selectedDate}
                plan={selectedPlan}
                actuals={selectedDate ? runLists[selectedDate] : undefined}
                athleteId={athlete.id}
                loading={loading}
                onClose={closeDetail}
              />
            </DayDetailPopover>
          )}
        </div>
      </main>
    </div>
  );
}
