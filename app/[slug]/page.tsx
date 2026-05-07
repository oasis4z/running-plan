import { notFound } from "next/navigation";
import PublicCalendarPage from "@/components/PublicCalendarPage";
import { getAthleteBySlug } from "@/lib/athletes";
import { ensureMigrated } from "@/lib/migration";

export const dynamic = "force-dynamic";

export default async function AthletePublicPage({ params }: { params: { slug: string } }) {
  await ensureMigrated();
  const athlete = await getAthleteBySlug(params.slug);
  if (!athlete) notFound();
  return <PublicCalendarPage athlete={athlete} />;
}
