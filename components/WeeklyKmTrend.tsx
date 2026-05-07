"use client";
import { useWeeklyTrend } from "@/hooks/useWeeklyTrend";

export default function WeeklyKmTrend({ athleteId }: { athleteId: string }) {
  const { weeks, loading } = useWeeklyTrend(athleteId);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="h-6 w-40 bg-gray-100 rounded animate-pulse mb-3" />
      <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
    </div>
  );

  if (!weeks.length) return null;

  const today = new Date();
  const todayMonday = (() => {
    const d = new Date(today);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d.toISOString().slice(0, 10);
  })();

  const maxKm = Math.max(...weeks.map((w) => w.actualKm), 1);
  const totalKm = Math.round(weeks.reduce((s, w) => s + w.actualKm, 0) * 10) / 10;
  const activeWeeks = weeks.filter((w) => w.actualKm > 0).length;
  const avgKm = activeWeeks > 0 ? Math.round((totalKm / activeWeeks) * 10) / 10 : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📈</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Weekly km (8 weeks)</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>Avg <span className="font-semibold text-gray-700">{avgKm} km</span>/week</span>
          <span>Total <span className="font-semibold text-blue-600">{totalKm} km</span></span>
        </div>
      </div>

      <div className="flex items-end gap-1 sm:gap-1.5 h-24">
        {weeks.map((week) => {
          const isCurrent = week.weekStart === todayMonday;
          const barH = week.actualKm > 0 ? Math.max((week.actualKm / maxKm) * 64, 6) : 0;
          return (
            <div key={week.weekStart} className="flex-1 flex flex-col items-center" title={`${week.weekLabel}: ${week.actualKm} km`}>
              {/* km label */}
              <span className={`text-[8px] sm:text-[9px] leading-none mb-0.5 font-medium ${week.actualKm > 0 ? (isCurrent ? "text-blue-600" : "text-gray-400") : "text-transparent"}`}>
                {week.actualKm > 0 ? week.actualKm : "0"}
              </span>
              {/* bar container */}
              <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
                {week.actualKm > 0 ? (
                  <div
                    className={`w-full rounded-t-md ${isCurrent ? "bg-blue-500 shadow-sm" : "bg-blue-200"}`}
                    style={{ height: barH }}
                  />
                ) : (
                  <div className="w-full rounded-t-sm bg-gray-100" style={{ height: 3 }} />
                )}
              </div>
              {/* week label */}
              <span className={`text-[7px] sm:text-[8px] mt-0.5 leading-none text-center truncate w-full ${isCurrent ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                {week.weekLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
