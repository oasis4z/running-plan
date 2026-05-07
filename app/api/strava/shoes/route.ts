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
  maxKm?: number;
}

/** Fetch all months from startDate to today, return all activities (deduped) */
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

  const all = (
    await Promise.all(months.map(({ y, m }) => fetchMonthActivities(y, m, tokens).catch(() => [])))
  ).flat();

  const seen = new Set<number>();
  return all.filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
}

export async function GET(req: NextRequest) {
  const athleteId = req.nextUrl.searchParams.get("athlete");
  if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });

  const athlete = await getAthleteById(athleteId);
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  const manual = getManualShoes(athleteId);
  const tokens = await getValidTokens(athleteId);

  // ── 1. manual + dynamic (highest priority when manual config exists) ──────
  // Strava's /athlete endpoint only returns full gear with profile:read_all scope.
  // Without it, Strava may return partial/wrong data. So we bypass Strava live
  // shoes and instead: use hardcoded base km + sum activities by gear_id.
  if (manual && tokens) {
    // Cache key v3: invalidates stale v2 cache that had wrong Strava data
    const cacheKey = `strava:shoes:v4:${athleteId}`;
    const cached = await rawGet(cacheKey);
    if (cached) return NextResponse.json({ shoes: JSON.parse(cached as string), cached: true, source: "manual+dynamic" });

    const earliestBase = manual.reduce((min, s) => (s.baseDate < min ? s.baseDate : min), manual[0].baseDate);

    try {
      const activities = await fetchActivitiesSince(earliestBase, tokens);

      // Sum km per gearId for activities AFTER each shoe's baseDate
      const kmByGear: Record<string, number> = {};
      for (const act of activities) {
        if (!act.gearId) continue;
        kmByGear[act.gearId] = Math.round(((kmByGear[act.gearId] ?? 0) + act.distanceKm) * 10) / 10;
      }

      const shoes: StravaShoe[] = manual
        .map((s) => ({
          id: s.id,
          name: s.name,
          distanceKm: Math.round((s.baseKm + (s.gearId ? (kmByGear[s.gearId] ?? 0) : 0)) * 10) / 10,
          primary: s.primary,
          maxKm: s.maxKm,
        }))
        .sort((a, b) => b.distanceKm - a.distanceKm);

      // Cache 30 min (shorter than live — activities update frequently)
      await rawSetEx(cacheKey, JSON.stringify(shoes), 1800);
      return NextResponse.json({ shoes, cached: false, source: "manual+dynamic" });
    } catch {
      // Fall through to static manual
    }
  }

  // ── 2. Static manual fallback (tokens unavailable or fetch failed) ────────
  if (manual) {
    const shoes: StravaShoe[] = manual
      .map((s) => ({ id: s.id, name: s.name, distanceKm: s.baseKm, primary: s.primary, maxKm: s.maxKm }))
      .sort((a, b) => b.distanceKm - a.distanceKm);
    return NextResponse.json({ shoes, cached: false, source: "manual_static" });
  }

  // ── 3. Strava live shoes (athletes without manual config) ─────────────────
  const cacheKey = `strava:shoes:v2:${athleteId}`;
  const cached = await rawGet(cacheKey);
  if (cached) return NextResponse.json({ shoes: JSON.parse(cached as string), cached: true, source: "strava_live" });

  if (!tokens) return NextResponse.json({ shoes: [], connected: false });

  const res = await fetch("https://www.strava.com/api/v3/athlete", {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: `Strava: ${res.status}` }, { status: res.status });

  const data = await res.json();
  const raw: Array<{ id: string; primary: boolean; name: string; nickname?: string; distance: number; retired?: boolean }> =
    data.shoes ?? [];

  const shoes: StravaShoe[] = raw
    .filter((g) => !g.retired)
    .map((g) => ({ id: g.id, name: g.nickname || g.name, distanceKm: Math.round(g.distance / 100) / 10, primary: g.primary }))
    .sort((a, b) => b.distanceKm - a.distanceKm);

  if (shoes.length > 0) await rawSetEx(cacheKey, JSON.stringify(shoes), 3600);
  return NextResponse.json({ shoes, cached: false, source: "strava_live" });
}
