"use client";

import { useState } from "react";
import type { TrainingPlan, RunType } from "@/lib/types";
import { RUN_TYPES } from "@/lib/constants";

interface AdminEditFormProps {
  date: string;
  existing?: TrainingPlan | null;
  onSave: (plan: TrainingPlan) => void;
  onCancel: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function AdminEditForm({ date, existing, onSave, onCancel }: AdminEditFormProps) {
  const [description, setDescription] = useState(existing?.description ?? "");
  const [runType, setRunType] = useState<RunType>(existing?.runType ?? "Easy");
  const [distanceKm, setDistanceKm] = useState(existing?.distanceKm?.toString() ?? "");
  const [targetPace, setTargetPace] = useState(existing?.targetPace ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { setError("Workout description is required"); return; }
    setError("");
    setSaving(true);

    const body = {
      description: description.trim(),
      runType,
      distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
      targetPace: targetPace.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const res = await fetch(`/api/plans/${date}`, {
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

        {/* Distance */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Distance (km)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="e.g. 12"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
        </div>

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
