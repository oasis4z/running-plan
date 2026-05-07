import { NextRequest, NextResponse } from "next/server";
import { getStravaTokens } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const athleteId = req.nextUrl.searchParams.get("athlete");
    if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
    const t = await getStravaTokens(athleteId);
    if (!t) return NextResponse.json({ connected: false });
    return NextResponse.json({
      connected: true,
      athleteName: t.athleteName ?? null,
      athleteId: t.athleteId ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
