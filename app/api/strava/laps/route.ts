import { NextRequest, NextResponse } from "next/server";
import { getValidTokens } from "@/lib/strava";
import { rawGet, rawSetEx } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";
import type { StravaLap } from "@/lib/types";

export const dynamic = "force-dynamic";

interface RawLap {
  lap_index: number;
  distance: number;         // meters
  moving_time: number;      // seconds
  average_speed: number;    // m/s
  average_heartrate?: number;
  has_heartrate?: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const athleteId = searchParams.get("athlete");
  const activityId = searchParams.get("activityId");

  if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
  if (!activityId) return NextResponse.json({ error: "Missing activityId" }, { status: 400 });

  const athlete = await getAthleteById(athleteId);
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  // Cache laps for 24h — laps never change after recording
  const cacheKey = `strava:laps:${athleteId}:${activityId}`;
  const cached = await rawGet(cacheKey);
  if (cached) {
    return NextResponse.json({ laps: JSON.parse(cached), cached: true });
  }

  const tokens = await getValidTokens(athleteId);
  if (!tokens) return NextResponse.json({ laps: [], connected: false });

  const res = await fetch(
    `https://www.strava.com/api/v3/activities/${activityId}/laps`,
    { headers: { Authorization: `Bearer ${tokens.accessToken}` }, cache: "no-store" }
  );
  if (!res.ok) {
    return NextResponse.json({ error: `Strava: ${res.status}` }, { status: res.status });
  }

  const raw: RawLap[] = await res.json();
  const laps: StravaLap[] = raw.map((lap) => {
    const distanceKm = lap.distance / 1000;
    const paceSecPerKm = distanceKm > 0 ? lap.moving_time / distanceKm : 0;
    return {
      lapIndex: lap.lap_index,
      distanceKm: Math.round(distanceKm * 100) / 100,
      movingTimeSec: lap.moving_time,
      paceSecPerKm: Math.round(paceSecPerKm),
      avgHr: lap.has_heartrate && lap.average_heartrate
        ? Math.round(lap.average_heartrate)
        : undefined,
    };
  });

  // Cache 24h
  await rawSetEx(cacheKey, JSON.stringify(laps), 86400);

  return NextResponse.json({ laps, cached: false });
}
