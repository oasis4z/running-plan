import { Redis } from "@upstash/redis";
import type { TrainingPlan } from "./types";

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables");
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
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
