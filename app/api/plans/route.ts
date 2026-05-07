import { NextRequest, NextResponse } from "next/server";
import { getMonthPlans } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const athleteId = searchParams.get("athlete");

  if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  try {
    const athlete = await getAthleteById(athleteId);
    if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    const plans = await getMonthPlans(athleteId, year, month);
    return NextResponse.json(plans);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
