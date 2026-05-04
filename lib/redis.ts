import { Redis } from "@upstash/redis";
import type { TrainingPlan } from "./types";

function getRedis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Missing Redis environment variables (KV_REST_API_URL / KV_REST_API_TOKEN)");
  }
  return new Redis({ url, token });
}

export async function getPlan(date: string): Promise<TrainingPlan | null> {
  const redis = getRedis();
  return redis.get<TrainingPlan>(`plan:${date}`);
}

export async function setPlan(plan: TrainingPlan): Promise<void> {
  const redis = getRedis();
  await redis.set(`plan:${plan.date}`, plan);
}

export async function deletePlan(date: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`plan:${date}`);
}

export async function getMonthPlans(year: number, month: number): Promise<TrainingPlan[]> {
  const redis = getRedis();
  const prefix = `plan:${year}-${String(month).padStart(2, "0")}-`;
  const keys = await redis.keys(`${prefix}*`);
  if (!keys.length) return [];
  const values = await redis.mget<TrainingPlan[]>(...keys);
  return values.filter((v): v is TrainingPlan => v !== null);
}
