"use client";

import type { TrainingPlan } from "@/lib/types";
import { RUN_TYPE_BG, RUN_TYPE_TEXT, RUN_TYPE_LIGHT_BG } from "@/lib/constants";

interface DayDetailPanelProps {
  date: string;
  plan: TrainingPlan | null | undefined;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  loading?: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function DayDetailPanel({
  date,
  plan,
  isAdmin,
  onEdit,
  onDelete,
  onClose,
  loading,
}: DayDetailPanelProps) {
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
          <div className="text-3xl mb-2">📅</div>
          <p className="text-gray-500 text-sm">No training scheduled</p>
          {isAdmin && onEdit && (
            <button
              onClick={onEdit}
              className="mt-4 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + Add Training
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Run type badge */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${RUN_TYPE_LIGHT_BG[plan.runType]}`}>
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${RUN_TYPE_BG[plan.runType]}`} />
            <span className={`font-semibold text-sm ${RUN_TYPE_TEXT[plan.runType]}`}>{plan.runType}</span>
            {plan.distanceKm && (
              <span className="ml-auto text-sm font-medium text-gray-700">{plan.distanceKm} km</span>
            )}
          </div>

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
