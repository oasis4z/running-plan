import { NextRequest, NextResponse } from "next/server";
import { getMonthPlans } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  try {
    const plans = await getMonthPlans(year, month);
    return NextResponse.json(plans);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
