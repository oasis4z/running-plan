import { NextRequest, NextResponse } from "next/server";
import { getValidTokens, fetchMonthActivities } from "@/lib/strava";
import { getStravaCache, setStravaCache } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const year = parseInt(searchParams.get("year") ?? "0");
  const month = parseInt(searchParams.get("month") ?? "0");
  const athleteId = searchParams.get("athlete");
  if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
  if (!year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
  }

  const forceRefresh = searchParams.get("refresh") === "1";

  try {
    const athlete = await getAthleteById(athleteId);
    if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

    if (!forceRefresh) {
      const cached = await getStravaCache(athleteId, year, month);
      if (cached && Date.now() / 1000 - cached.fetchedAt < 600) {
        return NextResponse.json({ runs: cached.runs, cached: true });
      }
    }

    const tokens = await getValidTokens(athleteId);
    if (!tokens) {
      return NextResponse.json({ runs: [], connected: false });
    }

    const runs = await fetchMonthActivities(year, month, tokens);
    await setStravaCache(athleteId, year, month, { fetchedAt: Math.floor(Date.now() / 1000), runs });
    return NextResponse.json({ runs, cached: false });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
