import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/strava";
import { setStravaTokens, deleteStravaCache } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Decode athlete from state
  let athleteId: string | null = null;
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      athleteId = decoded.athlete ?? null;
    } catch {
      athleteId = null;
    }
  }

  const backTo = athleteId ? `/admin/${athleteId}` : "/admin";

  if (error) {
    return NextResponse.redirect(`${origin}${backTo}?strava=error&reason=${encodeURIComponent(error)}`);
  }
  if (!code || !athleteId) {
    return NextResponse.redirect(`${origin}${backTo}?strava=error&reason=missing_code_or_state`);
  }

  try {
    const athlete = await getAthleteById(athleteId);
    if (!athlete) {
      return NextResponse.redirect(`${origin}/admin?strava=error&reason=unknown_athlete`);
    }
    const tokens = await exchangeCodeForTokens(code);
    await setStravaTokens(athleteId, tokens);
    await deleteStravaCache(athleteId);
    return NextResponse.redirect(`${origin}/admin/${athlete.slug}?strava=connected`);
  } catch (e) {
    return NextResponse.redirect(
      `${origin}${backTo}?strava=error&reason=${encodeURIComponent(String(e).slice(0, 80))}`
    );
  }
}
