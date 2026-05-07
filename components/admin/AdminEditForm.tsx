"use client";

import { useState } from "react";
import type { TrainingPlan, RunType } from "@/lib/types";
import { RUN_TYPES } from "@/lib/constants";

interface AdminEditFormProps {
  athleteId: string;
  date: string;
  existing?: TrainingPlan | null;
  onSave: (plan: TrainingPlan) => void;
  onCancel: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

type WorkoutMode = "distance" | "time" | "none";

function inferMode(plan?: TrainingPlan | null): WorkoutMode {
  if (plan?.distanceKm) return "distance";
  if (plan?.durationMin) return "time";
  return "distance"; // default for new plans
}

export default function AdminEditForm({ athleteId, date, existing, onSave, onCancel }: AdminEditFormProps) {
  const [description, setDescription] = useState(existing?.description ?? "");
  const [runType, setRunType] = useState<RunType>(existing?.runType ?? "Easy");
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>(inferMode(existing));
  const [distanceKm, setDistanceKm] = useState(existing?.distanceKm?.toString() ?? "");
  const [durationMin, setDurationMin] = useState(existing?.durationMin?.toString() ?? "");
  const [targetPace, setTargetPace] = useState(existing?.targetPace ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  // Fartlek fields
  const [fastMin, setFastMin] = useState(existing?.fartlek?.fastMin?.toString() ?? "2");
  const [fastPace, setFastPace] = useState(existing?.fartlek?.fastPace ?? "");
  const [slowMin, setSlowMin] = useState(existing?.fartlek?.slowMin?.toString() ?? "2");
  const [slowPace, setSlowPace] = useState(existing?.fartlek?.slowPace ?? "");
  const [fartlekSets, setFartlekSets] = useState(existing?.fartlek?.sets?.toString() ?? "7");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isFartlek = runType === "Fartlek";
  const fartlekTotalMin =
    isFartlek && fastMin && slowMin && fartlekSets
      ? (parseFloat(fastMin) + parseFloat(slowMin)) * parseInt(fartlekSets)
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { setError("Workout description is required"); return; }
    setError("");
    setSaving(true);

    const body = {
      description: description.trim(),
      runType,
      distanceKm: !isFartlek && workoutMode === "distance" && distanceKm ? parseFloat(distanceKm) : undefined,
      durationMin: isFartlek
        ? fartlekTotalMin || undefined
        : workoutMode === "time" && durationMin
        ? parseInt(durationMin)
        : undefined,
      targetPace: targetPace.trim() || undefined,
      notes: notes.trim() || undefined,
      fartlek: isFartlek
        ? {
            fastMin: parseFloat(fastMin) || 0,
            fastPace: fastPace.trim() || undefined,
            slowMin: parseFloat(slowMin) || 0,
            slowPace: slowPace.trim() || undefined,
            sets: parseInt(fartlekSets) || 0,
          }
        : undefined,
    };

    const res = await fetch(`/api/plans/${date}?athlete=${encodeURIComponent(athleteId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      const saved: TrainingPlan = await res.json();
      onSave(saved);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            {existing ? "Edit Training" : "Add Training"}
          </p>
          <h3 className="text-base font-semibold text-gray-900 mt-0.5">{formatDate(date)}</h3>
        </div>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Cancel">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 overflow-y-auto">
        {/* Run Type */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Run Type *</label>
          <select
            value={runType}
            onChange={(e) => setRunType(e.target.value as RunType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {RUN_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Workout *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            placeholder={"e.g. 1200 x4 rest 120sec run at 10 km pace\n+400 x10 faster than 10 km pace (400 rest 1 min)"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Fartlek structure */}
        {isFartlek && (
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-lg p-3">
            <label className="block text-xs font-semibold text-indigo-700 mb-2">
              Fartlek Structure
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 w-12">Fast</span>
                <input
                  type="number" step="0.5" min="0"
                  value={fastMin}
                  onChange={(e) => setFastMin(e.target.value)}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="2"
                />
                <span className="text-xs text-gray-500">min @</span>
                <input
                  type="text"
                  value={fastPace}
                  onChange={(e) => setFastPace(e.target.value)}
                  placeholder="4:00/km"
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 w-12">Slow</span>
                <input
                  type="number" step="0.5" min="0"
                  value={slowMin}
                  onChange={(e) => setSlowMin(e.target.value)}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="2"
                />
                <span className="text-xs text-gray-500">min @</span>
                <input
                  type="text"
                  value={slowPace}
                  onChange={(e) => setSlowPace(e.target.value)}
                  placeholder="6:00/km"
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 w-12">Sets</span>
                <input
                  type="number" step="1" min="1"
                  value={fartlekSets}
                  onChange={(e) => setFartlekSets(e.target.value)}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="7"
                />
                {fartlekTotalMin > 0 && (
                  <span className="text-xs text-indigo-700 font-medium">
                    Total: {fartlekTotalMin} min
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Workout mode toggle + value (non-Rest, non-Fartlek) */}
        {runType !== "Rest" && !isFartlek && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Volume</label>
            {/* Toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-2 text-sm">
              <button
                type="button"
                onClick={() => setWorkoutMode("distance")}
                className={`flex-1 py-1.5 font-medium transition-colors ${
                  workoutMode === "distance"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                📏 Distance
              </button>
              <button
                type="button"
                onClick={() => setWorkoutMode("time")}
                className={`flex-1 py-1.5 font-medium transition-colors border-l border-gray-300 ${
                  workoutMode === "time"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                ⏱ Time
              </button>
            </div>

            {workoutMode === "distance" ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="e.g. 12"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500 font-medium">km</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  placeholder="e.g. 45"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500 font-medium">min</span>
              </div>
            )}
          </div>
        )}

        {/* Target Pace (distance mode only, non-fartlek) */}
        {runType !== "Rest" && !isFartlek && workoutMode === "distance" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Target Pace</label>
            <input
              type="text"
              value={targetPace}
              onChange={(e) => setTargetPace(e.target.value)}
              placeholder="e.g. 5:30/km"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional coach notes, location, etc."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-100 mt-auto">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !description.trim()}
            className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
