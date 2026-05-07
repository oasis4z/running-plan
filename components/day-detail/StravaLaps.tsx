"use client";

import { useEffect, useState } from "react";
import type { StravaLap } from "@/lib/types";
import { formatPace } from "@/lib/strava";

interface Props {
  activityId: number;
  athleteId: string;
}

function fmtTime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}:${String(rm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StravaLaps({ activityId, athleteId }: Props) {
  const [laps, setLaps] = useState<StravaLap[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLaps(null);
    setError(false);
    fetch(`/api/strava/laps?athlete=${encodeURIComponent(athleteId)}&activityId=${activityId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.laps && d.laps.length > 1) setLaps(d.laps);
        // If only 1 lap, not worth showing the table
      })
      .catch(() => setError(true));
  }, [activityId, athleteId]);

  if (error) return null;
  if (laps === null) {
    // Loading skeleton
    return (
      <div className="mt-3 space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-5 bg-orange-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }
  if (laps.length === 0) return null;

  const hasHr = laps.some((l) => l.avgHr != null);

  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold text-orange-700/70 uppercase tracking-wide mb-1.5">
        Laps
      </p>
      <div className="overflow-x-auto rounded-lg border border-orange-100">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-orange-50 text-orange-700/70 uppercase text-[9px] tracking-wide">
              <th className="px-2 py-1.5 text-left font-semibold">Lap</th>
              <th className="px-2 py-1.5 text-right font-semibold">Dist</th>
              <th className="px-2 py-1.5 text-right font-semibold">Time</th>
              <th className="px-2 py-1.5 text-right font-semibold">Pace</th>
              {hasHr && <th className="px-2 py-1.5 text-right font-semibold">HR</th>}
            </tr>
          </thead>
          <tbody>
            {laps.map((lap, i) => (
              <tr
                key={lap.lapIndex}
                className={i % 2 === 0 ? "bg-white" : "bg-orange-50/40"}
              >
                <td className="px-2 py-1.5 font-semibold text-orange-900">{lap.lapIndex}</td>
                <td className="px-2 py-1.5 text-right text-gray-700">
                  {lap.distanceKm.toFixed(2)} km
                </td>
                <td className="px-2 py-1.5 text-right text-gray-700">
                  {fmtTime(lap.movingTimeSec)}
                </td>
                <td className="px-2 py-1.5 text-right text-gray-700">
                  {formatPace(lap.paceSecPerKm)}
                </td>
                {hasHr && (
                  <td className="px-2 py-1.5 text-right text-rose-700 font-medium">
                    {lap.avgHr ? `${lap.avgHr}` : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
