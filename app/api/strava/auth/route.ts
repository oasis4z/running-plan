import { NextRequest, NextResponse } from "next/server";
import { getClientCreds } from "@/lib/strava";
import { getAthleteById } from "@/lib/athletes";

export async function GET(req: NextRequest) {
  try {
    const athleteId = req.nextUrl.searchParams.get("athlete");
    if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
    const athlete = await getAthleteById(athleteId);
    if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

    const { clientId } = getClientCreds(athleteId);
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/strava/callback`;

    // Encode athleteId in OAuth state param
    const state = Buffer.from(JSON.stringify({ athlete: athleteId })).toString("base64url");

    const url =
      `https://www.strava.com/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=read,activity:read` +
      `&approval_prompt=auto` +
      `&state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
