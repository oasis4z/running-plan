"use client";

import { useState, useEffect } from "react";
import type { RaceInfo } from "@/lib/types";

interface RaceEditorProps {
  athleteId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function RaceEditor({ athleteId, onClose, onSaved }: RaceEditorProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [distance, setDistance] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    fetch(`/api/race?athlete=${encodeURIComponent(athleteId)}`)
      .then((r) => r.json())
      .then((data: RaceInfo | null) => {
        if (data) {
          setName(data.name);
          setDate(data.date);
          setDistance(data.distance ?? "");
          setHasExisting(true);
        }
      })
      .catch(() => {});
  }, [athleteId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    setSaving(true);
    await fetch(`/api/race?athlete=${encodeURIComponent(athleteId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), date, distance: distance.trim() || undefined }),
    });
    setSaving(false);
    onSaved();
  };

  const handleDelete = async () => {
    if (!confirm("ลบ race countdown?")) return;
    setDeleting(true);
    await fetch(`/api/race?athlete=${encodeURIComponent(athleteId)}`, { method: "DELETE" });
    setDeleting(false);
    onSaved();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">🏁 Race Countdown</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Race Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bangkok Marathon 2026"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Race Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Distance (optional)</label>
          <input
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="e.g. Full Marathon, 10K"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {hasExisting && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-1.5 rounded-lg transition-colors"
          >
            {deleting ? "Deleting…" : "🗑 Remove race countdown"}
          </button>
        )}
      </form>
    </div>
  );
}
