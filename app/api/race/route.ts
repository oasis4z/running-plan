import { NextRequest, NextResponse } from "next/server";
import { getRace, setRace, deleteRace } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";

function getAthleteId(req: NextRequest): string | null {
  return req.nextUrl.searchParams.get("athlete");
}

export async function GET(req: NextRequest) {
  const athleteId = getAthleteId(req);
  if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
  try {
    const athlete = await getAthleteById(athleteId);
    if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    const race = await getRace(athleteId);
    return NextResponse.json(race ?? null);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const athleteId = getAthleteId(req);
  if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
  try {
    const athlete = await getAthleteById(athleteId);
    if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    const body = await req.json().catch(() => null);
    if (!body || !body.name || !body.date) {
      return NextResponse.json({ error: "name and date are required" }, { status: 400 });
    }
    const race = { name: body.name, date: body.date, distance: body.distance ?? undefined };
    await setRace(athleteId, race);
    return NextResponse.json(race);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const athleteId = getAthleteId(req);
  if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
  try {
    await deleteRace(athleteId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
