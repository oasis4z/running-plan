import { NextRequest, NextResponse } from "next/server";
import { updateAthlete, removeAthlete } from "@/lib/athletes";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Body required" }, { status: 400 });
    const updated = await updateAthlete(params.id, {
      name: body.name,
      slug: body.slug,
      displayName: body.displayName,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await removeAthlete(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
