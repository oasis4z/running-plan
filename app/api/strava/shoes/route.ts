import { NextRequest, NextResponse } from "next/server";
import { getValidTokens } from "@/lib/strava";
import { rawGet, rawSetEx } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";

export const dynamic = "force-dynamic";

export interface StravaShoe {
  id: string;
  name: string;
  distanceKm: number;
  primary: boolean;
}

export async function GET(req: NextRequest) {
  const athleteId = req.nextUrl.searchParams.get("athlete");
  if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });

  const athlete = await getAthleteById(athleteId);
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  const cacheKey = `strava:shoes:v2:${athleteId}`; // v2: don't cache empty results
  const cached = await rawGet(cacheKey);
  if (cached) return NextResponse.json({ shoes: JSON.parse(cached as string), cached: true });

  const tokens = await getValidTokens(athleteId);
  if (!tokens) return NextResponse.json({ shoes: [], connected: false, debug: "no_tokens" });

  const res = await fetch("https://www.strava.com/api/v3/athlete", {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: `Strava: ${res.status}`, debug: "api_error" }, { status: res.status });

  const data = await res.json();
  const raw: Array<{ id: string; primary: boolean; name: string; nickname?: string; distance: number; retired?: boolean }> =
    data.shoes ?? [];

  const shoes: StravaShoe[] = raw
    .filter((g) => !g.retired)
    .map((g) => ({
      id: g.id,
      name: g.nickname || g.name,
      distanceKm: Math.round(g.distance / 100) / 10,
      primary: g.primary,
    }))
    .sort((a, b) => b.distanceKm - a.distanceKm);

  // Only cache if we actually got shoes — don't cache empty (user may add shoes later)
  if (shoes.length > 0) {
    await rawSetEx(cacheKey, JSON.stringify(shoes), 3600);
  }
  return NextResponse.json({ shoes, cached: false });
}
