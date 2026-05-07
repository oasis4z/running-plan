import { NextRequest, NextResponse } from "next/server";
import { getValidTokens, fetchMonthActivities } from "@/lib/strava";
import { rawGet, rawSetEx } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";
import { getManualShoes } from "@/lib/manualShoes";

export const dynamic = "force-dynamic";

export interface StravaShoe {
  id: string;
  name: string;
  distanceKm: number;
  primary: boolean;
}

/** Fetch all months from startDate to today and return activities with gearId */
async function fetchActivitiesSince(
  startDate: string,
  tokens: { accessToken: string; refreshToken: string; expiresAt: number; athleteId: number }
) {
  const [sy, sm] = startDate.split("-").map(Number);
  const now = new Date();
  const ey = now.getFullYear();
  const em = now.getMonth() + 1;

  const months: { y: number; m: number }[] = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push({ y, m });
    m++;
    if (m > 12) { m = 1; y++; }
  }

  const allActivities = (
    await Promise.all(months.map(({ y, m }) => fetchMonthActivities(y, m, tokens).catch(() => [])))
  ).flat();

  // Deduplicate by id
  const seen = new Set<number>();
  return allActivities.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

export async function GET(req: NextRequest) {
  const athleteId = req.nextUrl.searchParams.get("athlete");
  if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });

  const athlete = await getAthleteById(athleteId);
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  const manual = getManualShoes(athleteId);

  // ── 1. Try Strava live shoes (needs profile:read_all scope) ──────────────
  const cacheKey = `strava:shoes:v2:${athleteId}`;
  const cached = await rawGet(cacheKey);
  if (cached) return NextResponse.json({ shoes: JSON.parse(cached as string), cached: true });

  const tokens = await getValidTokens(athleteId);

  if (tokens) {
    const res = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const raw: Array<{ id: string; primary: boolean; name: string; nickname?: string; distance: number; retired?: boolean }> =
        data.shoes ?? [];

      const liveShoes: StravaShoe[] = raw
        .filter((g) => !g.retired)
        .map((g) => ({
          id: g.id,
          name: g.nickname || g.name,
          distanceKm: Math.round(g.distance / 100) / 10,
          primary: g.primary,
        }))
        .sort((a, b) => b.distanceKm - a.distanceKm);

      if (liveShoes.length > 0) {
        await rawSetEx(cacheKey, JSON.stringify(liveShoes), 3600);
        return NextResponse.json({ shoes: liveShoes, cached: false, source: "strava_live" });
      }
    }
  }

  // ── 2. Strava shoes unavailable — use manual base + dynamic activity sum ──
  if (!manual) {
    return NextResponse.json({ shoes: [], connected: false, source: "no_data" });
  }

  // If we have tokens, dynamically add km from activities after each shoe's baseDate
  if (tokens) {
    // Find earliest baseDate across all shoes
    const earliestBase = manual.reduce(
      (min, s) => (s.baseDate < min ? s.baseDate : min),
      manual[0].baseDate
    );

    try {
      const activities = await fetchActivitiesSince(earliestBase, tokens);

      // Sum km per gearId for activities strictly AFTER baseDate
      const kmByGear: Record<string, number> = {};
      for (const act of activities) {
        if (!act.gearId) continue;
        kmByGear[act.gearId] = Math.round(((kmByGear[act.gearId] ?? 0) + act.distanceKm) * 10) / 10;
      }

      // Also collect unknown gearIds for debug
      const knownGearIds = new Set(manual.map((s) => s.gearId).filter(Boolean));
      const unknownGears: Record<string, number> = {};
      for (const [gid, km] of Object.entries(kmByGear)) {
        if (!knownGearIds.has(gid)) unknownGears[gid] = km;
      }

      const shoes: StravaShoe[] = manual.map((s) => ({
        id: s.id,
        name: s.name,
        distanceKm: Math.round((s.baseKm + (s.gearId ? (kmByGear[s.gearId] ?? 0) : 0)) * 10) / 10,
        primary: s.primary,
      })).sort((a, b) => b.distanceKm - a.distanceKm);

      return NextResponse.json({
        shoes,
        cached: false,
        source: "manual+dynamic",
        debug: { unknownGears, knownGearIds: Object.fromEntries(manual.map((s) => [s.name, s.gearId])) },
      });
    } catch {
      // Fall through to static manual
    }
  }

  // ── 3. Static manual fallback (no tokens) ────────────────────────────────
  const shoes: StravaShoe[] = manual
    .map((s) => ({ id: s.id, name: s.name, distanceKm: s.baseKm, primary: s.primary }))
    .sort((a, b) => b.distanceKm - a.distanceKm);

  return NextResponse.json({ shoes, cached: false, source: "manual_static" });
}
