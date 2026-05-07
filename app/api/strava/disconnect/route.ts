import { NextRequest, NextResponse } from "next/server";
import { deleteStravaTokens, deleteStravaCache } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const athleteId = req.nextUrl.searchParams.get("athlete");
    if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
    await deleteStravaTokens(athleteId);
    await deleteStravaCache(athleteId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
