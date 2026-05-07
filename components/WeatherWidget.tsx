"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  pm25: number | null;
  pm25Source: {
    station: string;
    area: string;
    distKm: number;
    updatedAt: string;
  } | null;
  updatedAt: string;
}

function pm25Info(pm25: number) {
  if (pm25 <= 25)  return { label: "Good",                  emoji: "🟢", bg: "#dcfce7", text: "#166534" };
  if (pm25 <= 37)  return { label: "Moderate",              emoji: "🟡", bg: "#fef9c3", text: "#854d0e" };
  if (pm25 <= 50)  return { label: "Sensitive",             emoji: "🟠", bg: "#ffedd5", text: "#9a3412" };
  if (pm25 <= 90)  return { label: "Unhealthy",             emoji: "🔴", bg: "#fee2e2", text: "#991b1b" };
  return             { label: "Very Unhealthy",      emoji: "🟣", bg: "#f3e8ff", text: "#6b21a8" };
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((d: WeatherData) => setData(d))
      .catch(() => setError(true));
  }, []);

  if (error || !data) return null;

  const pm = data.pm25 != null ? pm25Info(data.pm25) : null;
  const iconUrl = data.icon ? `https://openweathermap.org/img/wn/${data.icon}@2x.png` : null;

  return (
    <div className="bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 shadow-sm">
      {/* Weather */}
      <div className="flex items-center gap-2 min-w-0">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" className="w-10 h-10 -my-1 flex-shrink-0" />
        ) : (
          <span className="text-2xl">🌤</span>
        )}
        <div className="leading-tight">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">{data.temp}°C</span>
            <span className="text-xs text-gray-500 capitalize">{data.description}</span>
          </div>
          <div className="text-[11px] text-gray-500">
            feels {data.feelsLike}° · humidity {data.humidity}%
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-8 w-px bg-sky-200" />

      {/* PM2.5 */}
      {pm && data.pm25 != null && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">PM2.5</span>
          <span
            style={{ backgroundColor: pm.bg, color: pm.text }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold"
            title={
              data.pm25Source
                ? `Station: ${data.pm25Source.station} (${data.pm25Source.distKm} km away)\nUpdated: ${data.pm25Source.updatedAt}`
                : ""
            }
          >
            {pm.emoji} {data.pm25} <span className="font-medium opacity-80">µg/m³</span>
          </span>
          <span className="text-xs text-gray-500 hidden sm:inline">{pm.label}</span>
        </div>
      )}

      {/* Location + source */}
      <div className="ml-auto text-[11px] text-gray-400 leading-tight text-right">
        <div>📍 สวนวชิรเบญจทัศ</div>
        {data.pm25Source && (
          <div className="text-gray-400/80">
            PM2.5 จาก {data.pm25Source.station} ({data.pm25Source.distKm} km)
          </div>
        )}
      </div>
    </div>
  );
}
