import { NextRequest, NextResponse } from "next/server";
import { listAthletes, addAthlete } from "@/lib/athletes";
import { ensureMigrated } from "@/lib/migration";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureMigrated();
    const athletes = await listAthletes();
    return NextResponse.json(athletes);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureMigrated();
    const body = await req.json().catch(() => null);
    if (!body || !body.name || !body.slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }
    const athlete = await addAthlete({ name: body.name, slug: body.slug, displayName: body.displayName });
    return NextResponse.json(athlete);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
