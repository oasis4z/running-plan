"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Athlete } from "@/lib/types";

interface AdminLandingProps {
  initialAthletes: Athlete[];
}

export default function AdminLanding({ initialAthletes }: AdminLandingProps) {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>(initialAthletes);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug required");
      return;
    }
    setError("");
    setAdding(true);
    const res = await fetch("/api/athletes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add");
      return;
    }
    const created: Athlete = await res.json();
    setAthletes((prev) => [...prev, created]);
    setName("");
    setSlug("");
  };

  const handleRename = async (a: Athlete) => {
    const newName = prompt(`Rename "${a.name}" to:`, a.name);
    if (!newName || newName === a.name) return;
    const newSlug = prompt(`New slug (was /${a.slug}):`, a.slug);
    if (!newSlug) return;

    setBusyId(a.id);
    const res = await fetch(`/api/athletes/${a.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, slug: newSlug }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to update");
      return;
    }
    const updated: Athlete = await res.json();
    setAthletes((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
  };

  const handleDelete = async (a: Athlete) => {
    if (!confirm(`ลบ "${a.name}" และข้อมูลทั้งหมดของเขา (plans, Strava, race) — ทำไม่ได้กลับนะ`)) return;
    setBusyId(a.id);
    const res = await fetch(`/api/athletes/${a.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete");
      return;
    }
    setAthletes((prev) => prev.filter((x) => x.id !== a.id));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🏃</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-400">Manage athletes</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Athletes</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {athletes.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{a.name}</h3>
                  <p className="text-xs text-gray-400">/{a.slug}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <Link
                  href={`/admin/${a.slug}`}
                  className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-center font-medium"
                >
                  📅 Edit calendar
                </Link>
                <button
                  onClick={() => handleRename(a)}
                  disabled={busyId === a.id}
                  className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2 py-1.5 rounded-lg"
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(a)}
                  disabled={busyId === a.id}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1.5 rounded-lg"
                  title="Delete (cascade)"
                >
                  🗑
                </button>
              </div>
              <Link
                href={`/${a.slug}`}
                className="text-[11px] text-gray-400 hover:text-gray-600 mt-1"
              >
                Public view: /{a.slug} →
              </Link>
            </div>
          ))}
        </div>

        <h2 className="text-base font-semibold text-gray-700 mb-3">Add new athlete</h2>
        <form
          onSubmit={handleAdd}
          className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ploy"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Slug (URL)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. ploy"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">a-z, 0-9, dashes only</p>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg"
          >
            {adding ? "Adding…" : "+ Add athlete"}
          </button>
        </form>
      </main>
    </div>
  );
}
