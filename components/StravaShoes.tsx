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
  const [debug, setDebug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/strava/shoes?athlete=${encodeURIComponent(athleteId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.debug) setDebug(d.debug);
        if (d.connected === false) { setConnected(false); return; }
        if (d.error) { setError(d.error); return; }
        setShoes(d.shoes ?? []);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [athleteId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm">👟</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shoe Mileage</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse bg-gray-100 rounded-lg" />)}
        </div>
      ) : !connected ? (
        <div className="text-center py-3">
          <p className="text-xs text-gray-400 mb-2">Connect Strava to track shoe mileage</p>
          {debug && <p className="text-[9px] text-gray-300">debug: {debug}</p>}
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : shoes.length === 0 ? (
        <div className="text-center py-3">
          <p className="text-xs text-gray-400 mb-2">No shoes added in Strava yet</p>
          <a
            href="https://www.strava.com/settings/gear"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium border border-orange-200 rounded-lg px-3 py-1.5"
          >
            + Add shoes on Strava →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {shoes.map((shoe) => {
            const pct = Math.min((shoe.distanceKm / MAX_KM) * 100, 100);
            const barColor = pct > 80 ? "#ef4444" : pct > 60 ? "#f97316" : "#3b82f6";
            const textColor = pct > 80 ? "text-red-600" : pct > 60 ? "text-orange-600" : "text-gray-700";
            const kmLeft = MAX_KM - shoe.distanceKm;
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
                  <span className="text-[9px] text-gray-400">
                    {kmLeft > 0 ? `${kmLeft} km left` : "⚠️ Replace soon"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
