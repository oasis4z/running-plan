import AdminLanding from "@/components/admin/AdminLanding";
import { listAthletes } from "@/lib/athletes";
import { ensureMigrated } from "@/lib/migration";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await ensureMigrated();
  const athletes = await listAthletes();
  return <AdminLanding initialAthletes={athletes} />;
}
