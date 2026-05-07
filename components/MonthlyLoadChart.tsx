"use client";

import { useMemo } from "react";
import type { StravaActivity } from "@/lib/types";

interface MonthlyLoadChartProps {
  actuals?: Record<string, StravaActivity>;
  year: number;
  month: number; // 1-indexed
}

function formatKm(km: number): string {
  return km % 1 === 0 ? `${km}` : km.toFixed(1);
}

export default function MonthlyLoadChart({ actuals, year, month }: MonthlyLoadChartProps) {
  const data = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const points: { day: number; cumKm: number; dayKm: number; hasRun: boolean }[] = [];
    let cumKm = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const a = actuals?.[dateStr];
      const dayKm = a?.distanceKm ?? 0;
      cumKm += dayKm;
      points.push({ day, cumKm, dayKm, hasRun: !!a });
    }
    return { points, daysInMonth, totalKm: cumKm };
  }, [actuals, year, month]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDay = isCurrentMonth ? today.getDate() : null;

  if (data.totalKm === 0) return null;

  // Only draw line up to today
  const drawPoints = todayDay
    ? data.points.filter((p) => p.day <= todayDay)
    : data.points;

  // SVG dimensions
  const W = 700;
  const H = 160;
  const padL = 44, padR = 16, padT = 18, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxKm = Math.max(10, data.totalKm);
  const xFor = (day: number) => padL + ((day - 1) / (data.daysInMonth - 1)) * plotW;
  const yKm = (km: number) => padT + plotH - (km / maxKm) * plotH;

  const kmPath = drawPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.day)} ${yKm(p.cumKm)}`)
    .join(" ");

  const yTicksKm = (() => {
    let step = 5;
    if (maxKm > 200) step = 50;
    else if (maxKm > 100) step = 25;
    else if (maxKm > 50) step = 10;
    else if (maxKm > 20) step = 5;
    else step = 2;
    const ticks: number[] = [];
    for (let v = 0; v <= maxKm; v += step) ticks.push(v);
    return ticks;
  })();

  const xTicks = [1, 5, 10, 15, 20, 25, data.daysInMonth].filter(
    (d, i, arr) => arr.indexOf(d) === i && d <= data.daysInMonth
  );

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          📈 Monthly Distance — <span className="normal-case font-bold text-gray-800">{monthLabel}</span>
        </h3>
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="font-bold text-orange-600 text-sm">{formatKm(data.totalKm)} km</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400 text-[10px]">run + ride รวม</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Y grid */}
        {yTicksKm.map((t, i) => (
          <line
            key={`yg${i}`}
            x1={padL} x2={W - padR}
            y1={yKm(t)} y2={yKm(t)}
            stroke="#f1f5f9"
            strokeWidth={1}
          />
        ))}

        {/* Y labels (km) */}
        {yTicksKm.map((t, i) => (
          <text
            key={`yl${i}`}
            x={padL - 6} y={yKm(t) + 4}
            fontSize={10} fill="#94a3b8"
            textAnchor="end"
          >
            {t === 0 ? "0" : `${t}km`}
          </text>
        ))}

        {/* X labels */}
        {xTicks.map((d, i) => (
          <text
            key={`x${i}`}
            x={xFor(d)} y={H - padB + 14}
            fontSize={10} fill="#94a3b8"
            textAnchor="middle"
          >
            {d}
          </text>
        ))}

        {/* Today vertical marker */}
        {todayDay && (
          <line
            x1={xFor(todayDay)} x2={xFor(todayDay)}
            y1={padT} y2={H - padB}
            stroke="#fb923c"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
        )}

        {/* Filled area under line */}
        {drawPoints.length > 0 && (
          <path
            d={`${kmPath} L ${xFor(drawPoints[drawPoints.length - 1].day)} ${yKm(0)} L ${xFor(1)} ${yKm(0)} Z`}
            fill="url(#kmGradient)"
            opacity={0.18}
          />
        )}
        <defs>
          <linearGradient id="kmGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Distance line */}
        <path
          d={kmPath}
          fill="none"
          stroke="#ea580c"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots on run days */}
        {drawPoints
          .filter((p) => p.hasRun)
          .map((p) => (
            <circle key={`d${p.day}`} cx={xFor(p.day)} cy={yKm(p.cumKm)} r={2.5} fill="#ea580c">
              <title>
                Day {p.day}: +{formatKm(p.dayKm)} km{"\n"}Total: {formatKm(p.cumKm)} km
              </title>
            </circle>
          ))}

        {/* Today dot (larger) */}
        {todayDay && drawPoints.length > 0 && (
          <circle
            cx={xFor(todayDay)}
            cy={yKm(drawPoints[drawPoints.length - 1].cumKm)}
            r={5}
            fill="#ea580c"
            stroke="#fff"
            strokeWidth={2}
          />
        )}
      </svg>
    </div>
  );
}
