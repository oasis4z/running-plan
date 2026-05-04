"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CalendarView from "./calendar/CalendarView";
import DayDetailPanel from "./day-detail/DayDetailPanel";
import AdminEditForm from "./admin/AdminEditForm";
import { useCalendarMonth } from "@/hooks/useCalendarMonth";
import type { TrainingPlan } from "@/lib/types";

type Mode = "view" | "edit";

export default function AdminCalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [deleting, setDeleting] = useState(false);

  const { plans, loading, refetch } = useCalendarMonth(year, month);

  const selectedPlan: TrainingPlan | undefined = selectedDate ? plans[selectedDate] : undefined;

  const prevMonth = useCallback(() => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
    setMode("view");
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
    setMode("view");
  }, [month]);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setMode("view");
  }, []);

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
    await fetch(`/api/plans/${selectedDate}`, { method: "DELETE" });
    await refetch();
    setDeleting(false);
    setSelectedDate(null);
    setMode("view");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🏃</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Running Training Plan</h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <CalendarView
              year={year}
              month={month}
              plans={plans}
              loading={loading}
              isAdmin
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
            />
          </div>

          {/* Detail / Edit Panel */}
          {selectedDate && (
            <div className="lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:min-h-[400px]">
              {mode === "edit" ? (
                <AdminEditForm
                  date={selectedDate}
                  existing={selectedPlan}
                  onSave={handleSave}
                  onCancel={() => setMode("view")}
                />
              ) : (
                <DayDetailPanel
                  date={selectedDate}
                  plan={selectedPlan}
                  isAdmin
                  loading={loading || deleting}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onClose={() => setSelectedDate(null)}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
