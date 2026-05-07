import { NextRequest, NextResponse } from "next/server";
import { getPlan, setPlan, deletePlan } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";
import type { TrainingPlan } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getAthleteId(req: NextRequest): string | null {
  return req.nextUrl.searchParams.get("athlete");
}

export async function GET(req: NextRequest, { params }: { params: { date: string } }) {
  try {
    const { date } = params;
    const athleteId = getAthleteId(req);
    if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
    if (!DATE_RE.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    const athlete = await getAthleteById(athleteId);
    if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    const plan = await getPlan(athleteId, date);
    if (!plan) return NextResponse.json(null);
    return NextResponse.json(plan);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { date: string } }) {
  try {
    const { date } = params;
    const athleteId = getAthleteId(req);
    if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
    if (!DATE_RE.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    const athlete = await getAthleteById(athleteId);
    if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || !body.description || !body.runType) {
      return NextResponse.json({ error: "description and runType are required" }, { status: 400 });
    }

    const plan: TrainingPlan = {
      date,
      description: body.description,
      runType: body.runType,
      distanceKm: body.distanceKm ?? undefined,
      durationMin: body.durationMin ?? undefined,
      targetPace: body.targetPace ?? undefined,
      notes: body.notes ?? undefined,
      fartlek: body.fartlek ?? undefined,
      updatedAt: new Date().toISOString(),
    };

    await setPlan(athleteId, plan);
    return NextResponse.json(plan);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { date: string } }) {
  try {
    const { date } = params;
    const athleteId = getAthleteId(req);
    if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
    if (!DATE_RE.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    await deletePlan(athleteId, date);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
