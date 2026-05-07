import { NextRequest, NextResponse } from "next/server";
import { getPlan, setPlan } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";
import type { TrainingPlan } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.athlete || !DATE_RE.test(body.sourceMonday) || !DATE_RE.test(body.targetMonday)) {
      return NextResponse.json({ error: "athlete, sourceMonday, targetMonday (YYYY-MM-DD) required" }, { status: 400 });
    }
    const athleteId = body.athlete as string;
    const athlete = await getAthleteById(athleteId);
    if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    const overwrite = !!body.overwrite;

    let copied = 0;
    let skipped = 0;
    const skippedDates: string[] = [];

    for (let i = 0; i < 7; i++) {
      const srcDate = addDays(body.sourceMonday, i);
      const tgtDate = addDays(body.targetMonday, i);

      const srcPlan = await getPlan(athleteId, srcDate);
      if (!srcPlan) continue;

      if (!overwrite) {
        const existing = await getPlan(athleteId, tgtDate);
        if (existing) {
          skipped++;
          skippedDates.push(tgtDate);
          continue;
        }
      }

      const newPlan: TrainingPlan = {
        ...srcPlan,
        date: tgtDate,
        updatedAt: new Date().toISOString(),
      };
      await setPlan(athleteId, newPlan);
      copied++;
    }

    return NextResponse.json({ copied, skipped, skippedDates });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
