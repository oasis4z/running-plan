import { rawGet, rawSet, rawDel, rawKeys, getAthletesList } from "./redis";

let migrationDone = false;

const DEFAULT_ATHLETE_ID = "me";

/**
 * One-time, idempotent migration.
 * Runs lazily on first admin request after deploy.
 */
export async function ensureMigrated(): Promise<void> {
  if (migrationDone) return;

  const list = await getAthletesList();
  if (list.length > 0) {
    migrationDone = true;
    return;
  }

  // Create default athlete record
  const athlete = {
    id: DEFAULT_ATHLETE_ID,
    slug: DEFAULT_ATHLETE_ID,
    name: "Me",
    createdAt: new Date().toISOString(),
  };
  await rawSet(`athlete:${DEFAULT_ATHLETE_ID}`, JSON.stringify(athlete));
  await rawSet("athletes:list", JSON.stringify([DEFAULT_ATHLETE_ID]));

  // Migrate plans: plan:YYYY-MM-DD → plan:me:YYYY-MM-DD
  const planKeys = await rawKeys("plan:*");
  for (const key of planKeys) {
    // Skip already-namespaced keys (plan:athleteId:date)
    const parts = key.split(":");
    if (parts.length === 3) continue; // already plan:{athlete}:{date}
    if (parts.length === 2) {
      // plan:YYYY-MM-DD → plan:me:YYYY-MM-DD
      const date = parts[1];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const value = await rawGet(key);
      if (value !== null && value !== undefined) {
        const valueStr = typeof value === "string" ? value : JSON.stringify(value);
        await rawSet(`plan:${DEFAULT_ATHLETE_ID}:${date}`, valueStr);
        await rawDel(key);
      }
    }
  }

  // Migrate race: race:next → race:next:me
  const raceVal = await rawGet("race:next");
  if (raceVal !== null && raceVal !== undefined) {
    const valueStr = typeof raceVal === "string" ? raceVal : JSON.stringify(raceVal);
    await rawSet(`race:next:${DEFAULT_ATHLETE_ID}`, valueStr);
    await rawDel("race:next");
  }

  // Migrate strava tokens: strava:tokens → strava:tokens:me
  const tokVal = await rawGet("strava:tokens");
  if (tokVal !== null && tokVal !== undefined) {
    const valueStr = typeof tokVal === "string" ? tokVal : JSON.stringify(tokVal);
    await rawSet(`strava:tokens:${DEFAULT_ATHLETE_ID}`, valueStr);
    await rawDel("strava:tokens");
  }

  // Migrate strava cache: strava:cache:YYYY-MM → strava:cache:me:YYYY-MM
  const cacheKeys = await rawKeys("strava:cache:*");
  for (const key of cacheKeys) {
    const parts = key.split(":");
    // Already namespaced: strava:cache:{athleteId}:{YYYY-MM} → 4 parts
    if (parts.length === 4) continue;
    if (parts.length === 3) {
      const yearMonth = parts[2];
      if (!/^\d{4}-\d{2}$/.test(yearMonth)) continue;
      const value = await rawGet(key);
      if (value !== null && value !== undefined) {
        const valueStr = typeof value === "string" ? value : JSON.stringify(value);
        await rawSet(`strava:cache:${DEFAULT_ATHLETE_ID}:${yearMonth}`, valueStr);
        await rawDel(key);
      }
    }
  }

  migrationDone = true;
}
