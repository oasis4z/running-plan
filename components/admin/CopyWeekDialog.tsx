"use client";

import { useState, useMemo } from "react";

interface CopyWeekDialogProps {
  athleteId: string;
  onClose: () => void;
  onCopied: () => void;
}

function getMondayStr(d: Date): string {
  const dow = d.getDay();
  const diff = (dow + 6) % 7;
  const m = new Date(d);
  m.setDate(d.getDate() - diff);
  const y = m.getFullYear();
  const mm = String(m.getMonth() + 1).padStart(2, "0");
  const dd = String(m.getDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function formatRange(monday: string): string {
  const start = new Date(monday + "T00:00:00");
  const end = new Date(monday + "T00:00:00");
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function CopyWeekDialog({ athleteId, onClose, onCopied }: CopyWeekDialogProps) {
  const todayMonday = useMemo(() => getMondayStr(new Date()), []);
  const lastWeekMonday = useMemo(() => addDays(todayMonday, -7), [todayMonday]);

  const [sourceMonday, setSourceMonday] = useState(lastWeekMonday);
  const [targetMonday, setTargetMonday] = useState(todayMonday);
  const [overwrite, setOverwrite] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ copied: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  const handleCopy = async () => {
    setSubmitting(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/plans/copy-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athlete: athleteId, sourceMonday, targetMonday, overwrite }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to copy");
      return;
    }
    const data = await res.json();
    setResult({ copied: data.copied, skipped: data.skipped });
    onCopied();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">📋 Copy Week</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Source week (Monday)</label>
          <input
            type="date"
            value={sourceMonday}
            onChange={(e) => setSourceMonday(getMondayStr(new Date(e.target.value + "T00:00:00")))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-[11px] text-gray-400 mt-1">Range: {formatRange(sourceMonday)}</p>
        </div>

        <div className="flex items-center justify-center text-gray-400">↓</div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Target week (Monday)</label>
          <input
            type="date"
            value={targetMonday}
            onChange={(e) => setTargetMonday(getMondayStr(new Date(e.target.value + "T00:00:00")))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-[11px] text-gray-400 mt-1">Range: {formatRange(targetMonday)}</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            className="rounded border-gray-300"
          />
          Overwrite existing plans on target week
        </label>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
            ✅ Copied {result.copied} plan{result.copied !== 1 ? "s" : ""}
            {result.skipped > 0 && ` · Skipped ${result.skipped} (already filled)`}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? "Copying…" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
