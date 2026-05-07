"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CalendarView from "./calendar/CalendarView";
import DayDetailPanel from "./day-detail/DayDetailPanel";
import AdminEditForm from "./admin/AdminEditForm";
import RaceCountdown from "./RaceCountdown";
import RaceEditor from "./admin/RaceEditor";
import CopyWeekDialog from "./admin/CopyWeekDialog";
import WeatherWidget from "./WeatherWidget";
import WeeklySummary from "./WeeklySummary";
import MonthlyLoadChart from "./MonthlyLoadChart";
import WeeklyKmTrend from "./WeeklyKmTrend";
import StravaShoes from "./StravaShoes";
import StravaConnect from "./StravaConnect";
import AthleteSwitcher from "./AthleteSwitcher";
import DayDetailPopover from "./DayDetailPopover";
import { useCalendarMonth } from "@/hooks/useCalendarMonth";
import { useRace } from "@/hooks/useRace";
import { useActualRuns } from "@/hooks/useActualRuns";
import type { TrainingPlan, Athlete } from "@/lib/types";

type Mode = "view" | "edit" | "race" | "copy";

interface AdminCalendarPageProps {
  athlete: Athlete;
}

export default function AdminCalendarPage({ athlete }: AdminCalendarPageProps) {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mode, setMode] = useState<Mode>("view");
  const [deleting, setDeleting] = useState(false);
  const [raceKey, setRaceKey] = useState(0);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { plans, loading, refetch } = useCalendarMonth(athlete.id, year, month);
  const race = useRace(athlete.id, raceKey);
  const { runs: actuals, runLists } = useActualRuns(athlete.id, year, month);

  const selectedPlan: TrainingPlan | undefined = selectedDate ? plans[selectedDate] : undefined;

  const closeDetail = useCallback(() => {
    setSelectedDate(null);
    setAnchorRect(null);
    setMode("view");
  }, []);

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

  const handleSelectDate = useCallback((date: string, rect: DOMRect) => {
    if (selectedDate === date && mode === "view") {
      closeDetail();
    } else {
      setSelectedDate(date);
      setAnchorRect(isDesktop ? rect : null);
      setMode("view");
    }
  }, [selectedDate, mode, isDesktop, closeDetail]);

  const handleEdit = () => setMode("edit");

  const handleSave = async (saved: TrainingPlan) => {
    await refetch();
    setSelectedDate(saved.date);
    setMode("view");
  };

  const handleDelete = async () => {
    if (!selectedDate) return;
    const confirmed = window.confirm(`Delete training for ${selectedDate}?`);
    if (!confirmed) return;

    setDeleting(true);
    await fetch(`/api/plans/${selectedDate}?athlete=${encodeURIComponent(athlete.id)}`, { method: "DELETE" });
    await refetch();
    setDeleting(false);
    closeDetail();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleQuickRest = async () => {
    if (!selectedDate) return;
    await fetch(`/api/plans/${selectedDate}?athlete=${encodeURIComponent(athlete.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runType: "Rest", description: "Rest day" }),
    });
    await refetch();
    setMode("view");
  };

  const handleRaceSaved = () => {
    setRaceKey((k) => k + 1);
    setMode("view");
    setSelectedDate(null);
  };

  const handleCopiedWeek = async () => {
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <Link href="/admin" className="text-2xl hover:opacity-80" title="Back to admin home">🏃</Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
              {athlete.name}
              <span className="text-xs text-gray-400 font-normal ml-2">/ {athlete.slug}</span>
            </h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
          <AthleteSwitcher currentSlug={athlete.slug} adminMode />
          <StravaConnect athleteId={athlete.id} />
          <button
            onClick={() => { setMode("copy"); setSelectedDate(null); }}
            className="text-sm text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            📋 Copy Week
          </button>
          <a
            href={`/api/calendar.ics?athlete=${encodeURIComponent(athlete.id)}`}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            📅 .ics
          </a>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <RaceCountdown
            key={raceKey}
            athleteId={athlete.id}
            isAdmin
            onEditClick={() => { setMode("race"); setSelectedDate(null); }}
          />

          {/* Top section: left main | right shoes sidebar */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left: Weather, Monthly, Weekly */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <WeatherWidget />
              <MonthlyLoadChart actuals={actuals} year={year} month={month} />
              <WeeklyKmTrend athleteId={athlete.id} />
            </div>
            {/* Right: Shoes sidebar */}
            <div className="lg:w-72 flex-shrink-0">
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
                  isAdmin
                  selectedDate={selectedDate}
                  raceDate={race?.date}
                  raceName={race?.name}
                  onSelectDate={handleSelectDate}
                  onPrevMonth={prevMonth}
                  onNextMonth={nextMonth}
                />
              </div>
            </div>

            {/* Race editor / Copy Week — always side panel (triggered from header buttons) */}
            {(mode === "race" || mode === "copy") && (
              <div className="lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:min-h-[400px]">
                {mode === "copy" ? (
                  <CopyWeekDialog
                    athleteId={athlete.id}
                    onClose={() => setMode("view")}
                    onCopied={handleCopiedWeek}
                  />
                ) : (
                  <RaceEditor
                    athleteId={athlete.id}
                    onClose={() => setMode("view")}
                    onSaved={handleRaceSaved}
                  />
                )}
              </div>
            )}

            {/* Mobile: day detail / edit form stacked below calendar */}
            {selectedDate && !isDesktop && (mode === "view" || mode === "edit") && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                {mode === "edit" ? (
                  <AdminEditForm
                    athleteId={athlete.id}
                    date={selectedDate}
                    existing={selectedPlan}
                    onSave={handleSave}
                    onCancel={() => setMode("view")}
                  />
                ) : (
                  <DayDetailPanel
                    date={selectedDate}
                    plan={selectedPlan}
                    actuals={selectedDate ? runLists[selectedDate] : undefined}
                    athleteId={athlete.id}
                    isAdmin
                    loading={loading || deleting}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onQuickRest={!selectedPlan ? handleQuickRest : undefined}
                    onClose={closeDetail}
                  />
                )}
              </div>
            )}
          </div>

          {/* Desktop: floating popover for day detail / edit form */}
          {selectedDate && isDesktop && anchorRect && (mode === "view" || mode === "edit") && (
            <DayDetailPopover anchorRect={anchorRect} onClose={closeDetail}>
              {mode === "edit" ? (
                <AdminEditForm
                  athleteId={athlete.id}
                  date={selectedDate}
                  existing={selectedPlan}
                  onSave={handleSave}
                  onCancel={() => setMode("view")}
                />
              ) : (
                <DayDetailPanel
                  date={selectedDate}
                  plan={selectedPlan}
                  actuals={selectedDate ? runLists[selectedDate] : undefined}
                  athleteId={athlete.id}
                  isAdmin
                  loading={loading || deleting}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onQuickRest={!selectedPlan ? handleQuickRest : undefined}
                  onClose={closeDetail}
                />
              )}
            </DayDetailPopover>
          )}
        </div>
      </main>
    </div>
  );
}
