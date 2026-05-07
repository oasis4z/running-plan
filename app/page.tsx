import Link from "next/link";
import { listAthletes } from "@/lib/athletes";
import { ensureMigrated } from "@/lib/migration";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureMigrated();
  const athletes = await listAthletes();

  if (athletes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl">🏃</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Running Training Plans</h1>
          <p className="text-gray-500 mt-2">No athletes yet.</p>
          <Link
            href="/admin"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Admin login
          </Link>
        </div>
      </div>
    );
  }

  if (athletes.length === 1) {
    // Single athlete: redirect feel — show their page directly via link
    const a = athletes[0];
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Link
          href={`/${a.slug}`}
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all min-w-[280px] text-center"
        >
          <span className="text-4xl">🏃</span>
          <h2 className="text-xl font-bold text-gray-900 mt-3">{a.name}</h2>
          <p className="text-xs text-gray-400 mt-1">/{a.slug}</p>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🏃</span>
          <h1 className="text-lg font-bold text-gray-900">Running Training Plans</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Choose an athlete</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {athletes.map((a) => (
            <Link
              key={a.id}
              href={`/${a.slug}`}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏃</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{a.name}</h3>
                  <p className="text-xs text-gray-400">/{a.slug}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
