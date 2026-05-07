"use client";

import { useEffect, useState } from "react";

interface StravaStatus {
  connected: boolean;
  athleteName?: string | null;
}

interface StravaConnectProps {
  athleteId: string;
}

export default function StravaConnect({ athleteId }: StravaConnectProps) {
  const [status, setStatus] = useState<StravaStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/strava/status?athlete=${encodeURIComponent(athleteId)}`)
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => setStatus({ connected: false }));
  }, [athleteId]);

  if (!status) return null;

  if (!status.connected) {
    return (
      <a
        href={`/api/strava/auth?athlete=${encodeURIComponent(athleteId)}`}
        className="text-sm text-orange-600 hover:text-orange-800 border border-orange-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-colors"
        title="Connect Strava account"
      >
        🔗 Connect Strava
      </a>
    );
  }

  const handleDisconnect = async () => {
    if (!confirm("ปิดการเชื่อมต่อ Strava ของ athlete นี้?")) return;
    setBusy(true);
    await fetch(`/api/strava/disconnect?athlete=${encodeURIComponent(athleteId)}`, { method: "POST" });
    setBusy(false);
    setStatus({ connected: false });
    window.location.reload();
  };

  return (
    <div className="text-sm flex items-center gap-2 border border-orange-200 bg-orange-50 px-3 py-1.5 rounded-lg">
      <span className="text-orange-700">
        ✅ <span className="font-medium">{status.athleteName ?? "Strava"}</span>
      </span>
      <button
        onClick={handleDisconnect}
        disabled={busy}
        className="text-xs text-orange-500 hover:text-orange-700"
        title="Disconnect Strava"
      >
        ✕
      </button>
    </div>
  );
}
