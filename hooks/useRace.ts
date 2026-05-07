"use client";

import { useState, useEffect } from "react";
import type { RaceInfo } from "@/lib/types";

export function useRace(athleteId: string, key: number = 0): RaceInfo | null {
  const [race, setRace] = useState<RaceInfo | null>(null);
  useEffect(() => {
    if (!athleteId) return;
    fetch(`/api/race?athlete=${encodeURIComponent(athleteId)}`)
      .then((r) => r.json())
      .then((d) => setRace(d))
      .catch(() => {});
  }, [athleteId, key]);
  return race;
}
