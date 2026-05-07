import {
  getAthletesList, setAthletesList,
  getAthleteRaw, setAthleteRaw, deleteAthleteRaw,
  deleteAllAthleteData,
} from "./redis";
import type { Athlete } from "./types";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,30}$/;

export function validateSlug(slug: string): string | null {
  if (!slug) return "Slug is required";
  if (!SLUG_RE.test(slug)) {
    return "Slug must be lowercase a-z, 0-9, and dashes (max 31 chars, no leading dash)";
  }
  if (slug === "admin" || slug === "api" || slug === "login") {
    return `Slug "${slug}" is reserved`;
  }
  return null;
}

export async function listAthletes(): Promise<Athlete[]> {
  const ids = await getAthletesList();
  if (!ids.length) return [];
  const all = await Promise.all(ids.map((id) => getAthleteRaw(id)));
  return all.filter((a): a is Athlete => a !== null);
}

export async function getAthleteById(id: string): Promise<Athlete | null> {
  return getAthleteRaw(id);
}

export async function getAthleteBySlug(slug: string): Promise<Athlete | null> {
  const all = await listAthletes();
  return all.find((a) => a.slug === slug) ?? null;
}

export async function addAthlete(input: { name: string; slug: string; displayName?: string }): Promise<Athlete> {
  const slugErr = validateSlug(input.slug);
  if (slugErr) throw new Error(slugErr);

  const existing = await getAthleteBySlug(input.slug);
  if (existing) throw new Error(`Slug "${input.slug}" already in use`);

  const id = input.slug; // initial id == slug
  const idExisting = await getAthleteById(id);
  if (idExisting) throw new Error(`ID "${id}" already exists`);

  const athlete: Athlete = {
    id,
    slug: input.slug,
    name: input.name.trim() || input.slug,
    displayName: input.displayName?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  await setAthleteRaw(athlete);
  const list = await getAthletesList();
  if (!list.includes(id)) {
    await setAthletesList([...list, id]);
  }
  return athlete;
}

export async function updateAthlete(id: string, patch: { name?: string; slug?: string; displayName?: string }): Promise<Athlete> {
  const current = await getAthleteById(id);
  if (!current) throw new Error("Athlete not found");

  if (patch.slug && patch.slug !== current.slug) {
    const slugErr = validateSlug(patch.slug);
    if (slugErr) throw new Error(slugErr);
    const conflict = await getAthleteBySlug(patch.slug);
    if (conflict && conflict.id !== id) throw new Error(`Slug "${patch.slug}" already in use`);
  }

  const updated: Athlete = {
    ...current,
    name: patch.name?.trim() || current.name,
    slug: patch.slug?.trim() || current.slug,
    displayName: patch.displayName === undefined ? current.displayName : (patch.displayName.trim() || undefined),
  };
  await setAthleteRaw(updated);
  return updated;
}

export async function removeAthlete(id: string): Promise<void> {
  const list = await getAthletesList();
  if (!list.includes(id)) throw new Error("Athlete not found");

  // Cascade delete all data for this athlete
  await deleteAllAthleteData(id);
  await deleteAthleteRaw(id);
  await setAthletesList(list.filter((x) => x !== id));
}
