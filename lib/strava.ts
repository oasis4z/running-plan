import { getStravaTokens, setStravaTokens } from "./redis";
import type { StravaTokens, StravaActivity } from "./types";

const TOKEN_URL = "https://www.strava.com/oauth/token";
const ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";

interface RawStravaActivity {
  id: number;
  name: string;
  type: string;        // "Run", "TrailRun", "Ride", etc.
  sport_type?: string; // newer field
  distance: number;    // meters
  moving_time: number; // seconds
  elapsed_time: number;
  start_date: string;        // ISO UTC
  start_date_local: string;  // ISO local (no Z)
  has_heartrate?: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  total_elevation_gain?: number; // meters
  suffer_score?: number;         // relative effort
  map?: { summary_polyline?: string };
  kilojoules?: number;   // energy expenditure (list endpoint)
  gear_id?: string | null;
}

/**
 * Returns Strava app credentials for the given athlete.
 * Checks athlete-specific env vars first (STRAVA_CLIENT_ID_{ATHLETE_ID_UPPER}),
 * then falls back to the default STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET.
 *
 * Example: athlete id "ploy" → try STRAVA_CLIENT_ID_PLOY first.
 */
export function getClientCreds(athleteId?: string) {
  if (athleteId) {
    const suffix = athleteId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    const specificId = process.env[`STRAVA_CLIENT_ID_${suffix}`];
    const specificSecret = process.env[`STRAVA_CLIENT_SECRET_${suffix}`];
    if (specificId && specificSecret) {
      return { clientId: specificId, clientSecret: specificSecret };
    }
  }
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET");
  }
  return { clientId, clientSecret };
}

export async function exchangeCodeForTokens(code: string, athleteId?: string): Promise<StravaTokens> {
  const { clientId, clientSecret } = getClientCreds(athleteId);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token exchange failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete?.id,
    athleteName: data.athlete
      ? `${data.athlete.firstname ?? ""} ${data.athlete.lastname ?? ""}`.trim()
      : undefined,
  };
}

export async function refreshTokensIfNeeded(athleteId: string, tokens: StravaTokens): Promise<StravaTokens> {
  const now = Math.floor(Date.now() / 1000);
  // Refresh if expires within 60s
  if (tokens.expiresAt > now + 60) return tokens;

  const { clientId, clientSecret } = getClientCreds(athleteId);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token refresh failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const updated: StravaTokens = {
    ...tokens,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt: data.expires_at,
  };
  await setStravaTokens(athleteId, updated);
  return updated;
}

export async function getValidTokens(athleteId: string): Promise<StravaTokens | null> {
  const t = await getStravaTokens(athleteId);
  if (!t) return null;
  return refreshTokensIfNeeded(athleteId, t);
}

function localDateFromIsoLocal(isoLocal: string): string {
  // "2026-05-06T06:30:00Z" or "2026-05-06T06:30:00" → "2026-05-06"
  return isoLocal.slice(0, 10);
}

export async function fetchMonthActivities(
  year: number,
  month: number,
  tokens: StravaTokens
): Promise<StravaActivity[]> {
  // Bangkok-centric range. Use UTC of midnight ±1 day for safety
  const startLocal = new Date(Date.UTC(year, month - 1, 1, -7, 0, 0)); // Bangkok midnight = UTC 17:00 prev day, but easier: just fetch a bit wider
  const endLocal = new Date(Date.UTC(year, month, 1, -7, 0, 0));

  const after = Math.floor(startLocal.getTime() / 1000);
  const before = Math.floor(endLocal.getTime() / 1000);

  const url = `${ACTIVITIES_URL}?after=${after}&before=${before}&per_page=200`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava activities fetch failed: ${res.status} ${text}`);
  }
  const raw: RawStravaActivity[] = await res.json();

  const isRun = (a: RawStravaActivity) => {
    const t = a.sport_type ?? a.type;
    return (
      t === "Run" || t === "TrailRun" || t === "VirtualRun" || t === "TreadmillRun" ||
      t === "Ride" || t === "VirtualRide" || t === "EBikeRide" || t === "MountainBikeRide" ||
      t === "Elliptical" || t === "StairStepper" || t === "Workout"
    );
  };

  return raw.filter(isRun).map((a) => {
    const distanceKm = a.distance / 1000;
    const durationMin = a.moving_time / 60;
    const paceSecPerKm = distanceKm > 0 ? a.moving_time / distanceKm : 0;
    return {
      id: a.id,
      date: localDateFromIsoLocal(a.start_date_local),
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMin: Math.round(durationMin),
      paceSecPerKm: Math.round(paceSecPerKm),
      type: a.sport_type ?? a.type,
      name: a.name,
      url: `https://www.strava.com/activities/${a.id}`,
      avgHr: a.has_heartrate && a.average_heartrate ? Math.round(a.average_heartrate) : undefined,
      maxHr: a.has_heartrate && a.max_heartrate ? Math.round(a.max_heartrate) : undefined,
      elevationGain: a.total_elevation_gain ? Math.round(a.total_elevation_gain) : undefined,
      sufferScore: a.suffer_score ? Math.round(a.suffer_score) : undefined,
      mapPolyline: a.map?.summary_polyline || undefined,
      calories: a.kilojoules ? Math.round(a.kilojoules / 4.184) : undefined,
      gearId: a.gear_id ?? undefined,
    };
  });
}

export function formatPace(secPerKm: number): string {
  if (!secPerKm || !isFinite(secPerKm)) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

export function formatDurationHHMM(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}
