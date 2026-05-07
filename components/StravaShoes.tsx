"use client";
import { useState, useEffect } from "react";

const MAX_KM = 700;

interface StravaShoe {
  id: string;
  name: string;
  distanceKm: number;
  primary: boolean;
}

export default function StravaShoes({ athleteId }: { athleteId: string }) {
  const [shoes, setShoes] = useState<StravaShoe[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    fetch(`/api/strava/shoes?athlete=${encodeURIComponent(athleteId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.connected === false) setConnected(false);
        setShoes(d.shoes ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [athleteId]);

  if (!connected || (!loading && shoes.length === 0)) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm">👟</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shoe Mileage</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-8 animate-pulse bg-gray-100 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {shoes.map((shoe) => {
            const pct = Math.min((shoe.distanceKm / MAX_KM) * 100, 100);
            const barColor = pct > 80 ? "#ef4444" : pct > 60 ? "#f97316" : "#3b82f6";
            const textColor = pct > 80 ? "text-red-600" : pct > 60 ? "text-orange-600" : "text-gray-700";
            return (
              <div key={shoe.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-xs font-medium truncate ${textColor}`}>{shoe.name}</span>
                    {shoe.primary && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold leading-none flex-shrink-0">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ml-2 ${textColor}`}>
                    {shoe.distanceKm.toLocaleString()} <span className="font-normal text-gray-400">km</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-gray-400">{Math.round(pct)}% of {MAX_KM}km</span>
                  <span className="text-[9px] text-gray-400">{MAX_KM - shoe.distanceKm > 0 ? `${MAX_KM - shoe.distanceKm} km left` : "⚠️ Replace soon"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
