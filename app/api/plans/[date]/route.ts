import { NextRequest, NextResponse } from "next/server";
import { getPlan, setPlan, deletePlan } from "@/lib/redis";
import type { TrainingPlan } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(_req: NextRequest, { params }: { params: { date: string } }) {
  const { date } = params;
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }
  const plan = await getPlan(date);
  if (!plan) return NextResponse.json(null);
  return NextResponse.json(plan);
}

export async function PUT(req: NextRequest, { params }: { params: { date: string } }) {
  const { date } = params;
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.description || !body.runType) {
    return NextResponse.json({ error: "description and runType are required" }, { status: 400 });
  }

  const plan: TrainingPlan = {
    date,
    description: body.description,
    runType: body.runType,
    distanceKm: body.distanceKm ?? undefined,
    targetPace: body.targetPace ?? undefined,
    notes: body.notes ?? undefined,
    updatedAt: new Date().toISOString(),
  };

  await setPlan(plan);
  return NextResponse.json(plan);
}

export async function DELETE(_req: NextRequest, { params }: { params: { date: string } }) {
  const { date } = params;
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }
  await deletePlan(date);
  return NextResponse.json({ ok: true });
}
