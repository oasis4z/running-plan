import { NextRequest, NextResponse } from "next/server";
import { getMonthPlans } from "@/lib/redis";
import { getAthleteById } from "@/lib/athletes";
import type { TrainingPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

const HOST = "running-training-plans.vercel.app";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtDate(date: string, hh: number, mm: number): string {
  // "YYYY-MM-DD" → "YYYYMMDDTHHMMSS" (floating local time)
  const [y, mo, d] = date.split("-").map(Number);
  return `${y}${pad2(mo)}${pad2(d)}T${pad2(hh)}${pad2(mm)}00`;
}

function escapeICS(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function buildSummary(plan: TrainingPlan): string {
  const parts: string[] = [`🏃 ${plan.runType}`];
  if (plan.fartlek) {
    parts.push(`${plan.fartlek.fastMin}/${plan.fartlek.slowMin}×${plan.fartlek.sets}`);
  } else if (plan.distanceKm) {
    parts.push(`${plan.distanceKm}km`);
  } else if (plan.durationMin) {
    parts.push(`${plan.durationMin}min`);
  }
  return parts.join(" ");
}

function buildDescription(plan: TrainingPlan): string {
  const lines: string[] = [plan.description];
  if (plan.targetPace) lines.push(`Target: ${plan.targetPace}`);
  if (plan.fartlek) {
    const f = plan.fartlek;
    lines.push(
      `Fast ${f.fastMin}min${f.fastPace ? ` @ ${f.fastPace}` : ""} · Slow ${f.slowMin}min${
        f.slowPace ? ` @ ${f.slowPace}` : ""
      } · ${f.sets} sets`
    );
  }
  if (plan.notes) lines.push(`Notes: ${plan.notes}`);
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const athleteId = req.nextUrl.searchParams.get("athlete");
    if (!athleteId) return NextResponse.json({ error: "Missing athlete" }, { status: 400 });
    const athlete = await getAthleteById(athleteId);
    if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

    const today = new Date();
    const months: { year: number; month: number }[] = [];
    for (let i = -6; i <= 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const allLists = await Promise.all(
      months.map((m) => getMonthPlans(athleteId, m.year, m.month).catch(() => []))
    );
    const allPlans = allLists.flat();

    const now = new Date();
    const dtstamp =
      `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}` +
      `T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${HOST}//Running Training Plan//EN`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:🏃 ${athlete.name}'s Training Plan`,
      "X-WR-TIMEZONE:Asia/Bangkok",
    ];

    for (const plan of allPlans) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:plan-${plan.date}@${HOST}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART;TZID=Asia/Bangkok:${fmtDate(plan.date, 6, 0)}`);
      lines.push(`DTEND;TZID=Asia/Bangkok:${fmtDate(plan.date, 7, 0)}`);
      lines.push(`SUMMARY:${escapeICS(buildSummary(plan))}`);
      lines.push(`DESCRIPTION:${escapeICS(buildDescription(plan))}`);
      lines.push("LOCATION:สวนวชิรเบญจทัศ");
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    const ics = lines.join("\r\n");

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="training-plan-${athlete.slug}.ics"`,
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
