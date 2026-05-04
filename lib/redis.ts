import { kv } from "@vercel/kv";
import type { TrainingPlan } from "./types";

export async function getPlan(date: string): Promise<TrainingPlan | null> {
  return kv.get<TrainingPlan>(`plan:${date}`);
}

export async function setPlan(plan: TrainingPlan): Promise<void> {
  await kv.set(`plan:${plan.date}`, plan);
}

export async function deletePlan(date: string): Promise<void> {
  await kv.del(`plan:${date}`);
}

export async function getMonthPlans(year: number, month: number): Promise<TrainingPlan[]> {
  const prefix = `plan:${year}-${String(month).padStart(2, "0")}-`;
  const keys = await kv.keys(`${prefix}*`);
  if (!keys.length) return [];
  const values = await kv.mget<TrainingPlan[]>(...keys);
  return values.filter((v): v is TrainingPlan => v !== null);
}
