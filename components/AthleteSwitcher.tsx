"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Athlete } from "@/lib/types";

interface AthleteSwitcherProps {
  currentSlug: string;
  adminMode?: boolean;
}

export default function AthleteSwitcher({ currentSlug, adminMode }: AthleteSwitcherProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/athletes")
      .then((r) => r.json())
      .then((data: Athlete[]) => setAthletes(Array.isArray(data) ? data : []))
      .catch(() => setAthletes([]));
  }, []);

  if (athletes.length <= 1) return null;

  const current = athletes.find((a) => a.slug === currentSlug);
  const others = athletes.filter((a) => a.slug !== currentSlug);
  const prefix = adminMode ? "/admin" : "";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="text-sm text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
      >
        👤 {current?.name ?? currentSlug} <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-20">
          {others.map((a) => (
            <Link
              key={a.id}
              href={`${prefix}/${a.slug}`}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {a.name}
              <span className="text-xs text-gray-400 ml-2">/{a.slug}</span>
            </Link>
          ))}
          {adminMode && (
            <Link
              href="/admin"
              className="block px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100"
            >
              ← Manage athletes
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
