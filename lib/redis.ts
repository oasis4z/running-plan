import type { TrainingPlan, RaceInfo, StravaTokens, StravaActivity, Athlete } from "./types";

async function upstash(command: unknown[]) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Missing KV_REST_API_URL or KV_REST_API_TOKEN");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// --- Plans (per-athlete) ---

export async function getPlan(athleteId: string, date: string): Promise<TrainingPlan | null> {
  const raw = await upstash(["GET", `plan:${athleteId}:${date}`]);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function setPlan(athleteId: string, plan: TrainingPlan): Promise<void> {
  await upstash(["SET", `plan:${athleteId}:${plan.date}`, JSON.stringify(plan)]);
}

export async function deletePlan(athleteId: string, date: string): Promise<void> {
  await upstash(["DEL", `plan:${athleteId}:${date}`]);
}

export async function getMonthPlans(athleteId: string, year: number, month: number): Promise<TrainingPlan[]> {
  const prefix = `plan:${athleteId}:${year}-${String(month).padStart(2, "0")}-`;
  const keys: string[] = await upstash(["KEYS", `${prefix}*`]);
  if (!keys.length) return [];
  const values: (string | null)[] = await upstash(["MGET", ...keys]);
  return values
    .filter((v): v is string => v !== null)
    .map((v) => (typeof v === "string" ? JSON.parse(v) : v));
}

// --- Race (per-athlete) ---

export async function getRace(athleteId: string): Promise<RaceInfo | null> {
  const raw = await upstash(["GET", `race:next:${athleteId}`]);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function setRace(athleteId: string, race: RaceInfo): Promise<void> {
  await upstash(["SET", `race:next:${athleteId}`, JSON.stringify(race)]);
}

export async function deleteRace(athleteId: string): Promise<void> {
  await upstash(["DEL", `race:next:${athleteId}`]);
}

// --- Strava (per-athlete) ---

export async function getStravaTokens(athleteId: string): Promise<StravaTokens | null> {
  const raw = await upstash(["GET", `strava:tokens:${athleteId}`]);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function setStravaTokens(athleteId: string, tokens: StravaTokens): Promise<void> {
  await upstash(["SET", `strava:tokens:${athleteId}`, JSON.stringify(tokens)]);
}

export async function deleteStravaTokens(athleteId: string): Promise<void> {
  await upstash(["DEL", `strava:tokens:${athleteId}`]);
}

interface StravaCacheEntry {
  fetchedAt: number;
  runs: StravaActivity[];
}

export async function getStravaCache(athleteId: string, year: number, month: number): Promise<StravaCacheEntry | null> {
  const key = `strava:cache:${athleteId}:${year}-${String(month).padStart(2, "0")}`;
  const raw = await upstash(["GET", key]);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function setStravaCache(athleteId: string, year: number, month: number, entry: StravaCacheEntry): Promise<void> {
  const key = `strava:cache:${athleteId}:${year}-${String(month).padStart(2, "0")}`;
  await upstash(["SET", key, JSON.stringify(entry), "EX", 600]);
}

export async function deleteStravaCache(athleteId: string): Promise<void> {
  const keys: string[] = await upstash(["KEYS", `strava:cache:${athleteId}:*`]);
  if (keys.length) {
    await upstash(["DEL", ...keys]);
  }
}

// --- Athletes ---

export async function getAthletesList(): Promise<string[]> {
  const raw = await upstash(["GET", "athletes:list"]);
  if (!raw) return [];
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function setAthletesList(ids: string[]): Promise<void> {
  await upstash(["SET", "athletes:list", JSON.stringify(ids)]);
}

export async function getAthleteRaw(id: string): Promise<Athlete | null> {
  const raw = await upstash(["GET", `athlete:${id}`]);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function setAthleteRaw(athlete: Athlete): Promise<void> {
  await upstash(["SET", `athlete:${athlete.id}`, JSON.stringify(athlete)]);
}

export async function deleteAthleteRaw(id: string): Promise<void> {
  await upstash(["DEL", `athlete:${id}`]);
}

export async function deleteAllAthleteData(athleteId: string): Promise<void> {
  // Cascade-delete ALL keys for this athlete
  const patterns = [
    `plan:${athleteId}:*`,
    `race:next:${athleteId}`,
    `strava:tokens:${athleteId}`,
    `strava:cache:${athleteId}:*`,
    `athlete:${athleteId}`,
  ];
  for (const p of patterns) {
    if (p.includes("*")) {
      const keys: string[] = await upstash(["KEYS", p]);
      if (keys.length) await upstash(["DEL", ...keys]);
    } else {
      await upstash(["DEL", p]);
    }
  }
}

// --- Migration helpers ---

export async function rawGet(key: string): Promise<unknown> {
  return upstash(["GET", key]);
}

export async function rawSet(key: string, value: string): Promise<void> {
  await upstash(["SET", key, value]);
}

export async function rawDel(...keys: string[]): Promise<void> {
  if (keys.length) await upstash(["DEL", ...keys]);
}

export async function rawKeys(pattern: string): Promise<string[]> {
  return (await upstash(["KEYS", pattern])) as string[];
}
