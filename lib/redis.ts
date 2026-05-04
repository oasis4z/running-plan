import type { TrainingPlan } from "./types";

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

export async function getPlan(date: string): Promise<TrainingPlan | null> {
  const raw = await upstash(["GET", `plan:${date}`]);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function setPlan(plan: TrainingPlan): Promise<void> {
  await upstash(["SET", `plan:${plan.date}`, JSON.stringify(plan)]);
}

export async function deletePlan(date: string): Promise<void> {
  await upstash(["DEL", `plan:${date}`]);
}

export async function getMonthPlans(year: number, month: number): Promise<TrainingPlan[]> {
  const prefix = `plan:${year}-${String(month).padStart(2, "0")}-`;
  const keys: string[] = await upstash(["KEYS", `${prefix}*`]);
  if (!keys.length) return [];
  const values: (string | null)[] = await upstash(["MGET", ...keys]);
  return values
    .filter((v): v is string => v !== null)
    .map((v) => (typeof v === "string" ? JSON.parse(v) : v));
}
