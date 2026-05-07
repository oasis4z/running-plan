"use client";

import dynamic from "next/dynamic";
import type { TrainingPlan, StravaActivity } from "@/lib/types";
import { RUN_TYPE_BG, RUN_TYPE_TEXT, RUN_TYPE_LIGHT_BG } from "@/lib/constants";
import { formatPace, formatDurationHHMM } from "@/lib/strava";
import StravaLaps from "./StravaLaps";

const StravaRouteMap = dynamic(() => import("./StravaRouteMap"), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-xl animate-pulse mt-3" />,
});

interface DayDetailPanelProps {
  date: string;
  plan: TrainingPlan | null | undefined;
  /** All Strava activities for this day (replaces the old single `actual`). */
  actuals?: StravaActivity[];
  athleteId?: string;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  onQuickRest?: () => void;
  loading?: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function ActivityCard({
  activity,
  athleteId,
  index,
  total,
}: {
  activity: StravaActivity;
  athleteId?: string;
  index: number;
  total: number;
}) {
  const label = total > 1 ? `✓ Run ${index + 1} of ${total}` : "✓ Actual Run";
  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3">
      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-[10px] text-orange-700/70 uppercase">Distance</div>
          <div className="font-bold text-orange-900">{activity.distanceKm} km</div>
        </div>
        <div>
          <div className="text-[10px] text-orange-700/70 uppercase">Time</div>
          <div className="font-bold text-orange-900">{formatDurationHHMM(activity.durationMin)}</div>
        </div>
        <div>
          <div className="text-[10px] text-orange-700/70 uppercase">Pace</div>
          <div className="font-bold text-orange-900">{formatPace(activity.paceSecPerKm)}</div>
        </div>
      </div>

      {(activity.avgHr || activity.maxHr || (activity.elevationGain != null && activity.elevationGain > 0) || activity.sufferScore != null || activity.calories) && (
        <div className="mt-2 grid grid-cols-3 gap-2 text-sm border-t border-orange-200/50 pt-2">
          {activity.avgHr && (
            <div>
              <div className="text-[10px] text-rose-700/80 uppercase">❤️ Avg HR</div>
              <div className="font-bold text-rose-900">{activity.avgHr} <span className="text-[10px] font-normal">bpm</span></div>
            </div>
          )}
          {activity.maxHr && (
            <div>
              <div className="text-[10px] text-rose-700/80 uppercase">💢 Max HR</div>
              <div className="font-bold text-rose-900">{activity.maxHr} <span className="text-[10px] font-normal">bpm</span></div>
            </div>
          )}
          {activity.elevationGain != null && activity.elevationGain > 0 && (
            <div>
              <div className="text-[10px] text-emerald-700/80 uppercase">⛰️ Elev</div>
              <div className="font-bold text-emerald-900">{activity.elevationGain} <span className="text-[10px] font-normal">m</span></div>
            </div>
          )}
          {activity.sufferScore != null && (
            <div>
              <div className="text-[10px] text-purple-700/80 uppercase">💪 Effort</div>
              <div className="font-bold text-purple-900">{activity.sufferScore}</div>
            </div>
          )}
          {activity.calories && (
            <div>
              <div className="text-[10px] text-orange-700/80 uppercase">🔥 Cal</div>
              <div className="font-bold text-orange-900">{activity.calories} <span className="text-[10px] font-normal">kcal</span></div>
            </div>
          )}
        </div>
      )}

      {activity.name && (
        <p className="text-xs text-orange-800 mt-2 truncate" title={activity.name}>
          {activity.name}
        </p>
      )}
      <a
        href={activity.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-900"
      >
        🔗 ดูบน Strava →
      </a>

      {athleteId && <StravaLaps activityId={activity.id} athleteId={athleteId} />}

      {activity.mapPolyline && (
        <div className="mt-3">
          <StravaRouteMap encodedPolyline={activity.mapPolyline} />
        </div>
      )}
    </div>
  );
}

export default function DayDetailPanel({
  date,
  plan,
  actuals,
  athleteId,
  isAdmin,
  onEdit,
  onDelete,
  onClose,
  onQuickRest,
  loading,
}: DayDetailPanelProps) {
  const actualBlock =
    actuals && actuals.length > 0 ? (
      <div className="flex flex-col gap-3">
        {actuals.map((a, i) => (
          <ActivityCard key={a.id} activity={a} athleteId={athleteId} index={i} total={actuals.length} />
        ))}
      </div>
    ) : null;
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Training Plan</p>
          <h3 className="text-base font-semibold text-gray-900 mt-0.5">{formatDate(date)}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Close">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
      ) : !plan ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          {actualBlock && <div className="w-full mb-4">{actualBlock}</div>}
          <div className="text-3xl mb-2">📅</div>
          <p className="text-gray-500 text-sm">No training scheduled</p>
          {isAdmin && (
            <div className="mt-4 flex flex-col gap-2 w-full max-w-[180px]">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + Add Training
                </button>
              )}
              {onQuickRest && (
                <button
                  onClick={onQuickRest}
                  className="text-sm border border-gray-300 hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-lg transition-colors"
                >
                  😴 Mark as Rest
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Run type badge */}
          {actualBlock}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${RUN_TYPE_LIGHT_BG[plan.runType]}`}>
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${RUN_TYPE_BG[plan.runType]}`} />
            <span className={`font-semibold text-sm ${RUN_TYPE_TEXT[plan.runType]}`}>{plan.runType}</span>
            <div className="ml-auto flex items-center gap-2">
              {plan.distanceKm && (
                <span className="text-sm font-medium text-gray-700">{plan.distanceKm} km</span>
              )}
              {plan.durationMin && (
                <span className="text-sm font-medium text-gray-700">{plan.durationMin} min</span>
              )}
            </div>
          </div>

          {/* Fartlek structure */}
          {plan.fartlek && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1.5">
                Fartlek Structure
              </p>
              <div className="space-y-0.5 text-indigo-900">
                <div>
                  ⚡ <span className="font-semibold">Fast {plan.fartlek.fastMin} min</span>
                  {plan.fartlek.fastPace ? ` @ ${plan.fartlek.fastPace}` : ""}
                </div>
                <div>
                  🚶 <span className="font-semibold">Slow {plan.fartlek.slowMin} min</span>
                  {plan.fartlek.slowPace ? ` @ ${plan.fartlek.slowPace}` : ""}
                </div>
                <div>
                  🔁 <span className="font-semibold">{plan.fartlek.sets} sets</span>
                  <span className="text-indigo-700/70 ml-2">
                    (total {(plan.fartlek.fastMin + plan.fartlek.slowMin) * plan.fartlek.sets} min)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Workout</p>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 rounded-xl p-3 leading-relaxed">
              {plan.description}
            </pre>
          </div>

          {/* Target Pace */}
          {plan.targetPace && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Target Pace</p>
              <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2">{plan.targetPace}</p>
            </div>
          )}

          {/* Notes */}
          {plan.notes && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Notes</p>
              <p className="text-sm text-gray-700 bg-yellow-50 rounded-xl px-3 py-2 border border-yellow-100">
                {plan.notes}
              </p>
            </div>
          )}

          {/* Updated at */}
          <p className="text-xs text-gray-300 mt-auto">
            Updated {new Date(plan.updatedAt).toLocaleString()}
          </p>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={onEdit}
                className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="text-sm text-red-600 hover:bg-red-50 border border-red-200 px-4 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
