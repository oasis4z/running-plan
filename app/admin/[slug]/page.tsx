import { notFound } from "next/navigation";
import AdminCalendarPage from "@/components/AdminCalendarPage";
import { getAthleteBySlug } from "@/lib/athletes";
import { ensureMigrated } from "@/lib/migration";

export const dynamic = "force-dynamic";

export default async function AthleteAdminPage({ params }: { params: { slug: string } }) {
  await ensureMigrated();
  const athlete = await getAthleteBySlug(params.slug);
  if (!athlete) notFound();
  return <AdminCalendarPage athlete={athlete} />;
}
