"use client";

import { useEffect, useState } from "react";
import type { RaceInfo } from "@/lib/types";

interface RaceCountdownProps {
  athleteId: string;
  isAdmin?: boolean;
  onEditClick?: () => void;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(dateStr + "T00:00:00");
  return Math.round((race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RaceCountdown({ athleteId, isAdmin, onEditClick }: RaceCountdownProps) {
  const [race, setRace] = useState<RaceInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!athleteId) return;
    fetch(`/api/race?athlete=${encodeURIComponent(athleteId)}`)
      .then((r) => r.json())
      .then((data) => {
        setRace(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [athleteId]);

  if (!loaded) return null;
  if (!race) {
    if (!isAdmin) return null;
    // Admin: show a subtle "Set race" prompt
    return (
      <button
        onClick={onEditClick}
        className="w-full text-left px-4 py-2.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 text-indigo-500 text-sm hover:bg-indigo-100 transition-colors"
      >
        🏁 Set a race countdown…
      </button>
    );
  }

  const days = daysUntil(race.date);
  const isUrgent = days >= 0 && days < 7;
  const isPast = days < 0;

  const bgClass = isPast
    ? "bg-gradient-to-r from-gray-500 to-gray-600"
    : isUrgent
    ? "bg-gradient-to-r from-red-500 to-rose-600"
    : "bg-gradient-to-r from-indigo-500 to-purple-600";

  const label = isPast
    ? `${Math.abs(days)} วันที่แล้ว`
    : days === 0
    ? "วันนี้! 🎉"
    : `อีก ${days} วัน`;

  return (
    <div className={`${bgClass} rounded-xl px-4 py-3 flex items-center gap-3 text-white shadow-sm`}>
      <span className="text-xl flex-shrink-0">🏁</span>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm sm:text-base">{race.name}</span>
        {race.distance && (
          <span className="ml-2 text-xs opacity-80 font-normal">{race.distance}</span>
        )}
      </div>
      <span className="font-bold text-sm sm:text-base whitespace-nowrap">{label}</span>
      {isAdmin && onEditClick && (
        <button
          onClick={onEditClick}
          className="ml-1 p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
          title="Edit race"
        >
          ✏️
        </button>
      )}
    </div>
  );
}
