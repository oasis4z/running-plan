/**
 * Manual / hardcoded shoe baselines per athlete.
 *
 * Values are sourced from Strava Gear page (screenshot) minus km logged on
 * dates that are already tracked in the app calendar, to avoid double-counting
 * when the dynamic Strava API is unavailable (e.g. missing profile:read_all scope).
 *
 * Last updated: 2026-05-07
 *   me — subtracted May 5 (XTEP 11.1 km), May 6+7 (Eleos 11.6 km)
 */

export interface ManualShoe {
  id: string;
  name: string;
  distanceKm: number;
  primary: boolean;
}

const MANUAL_SHOES: Record<string, ManualShoe[]> = {
  me: [
    { id: "manual-eleos",   name: "361 Eleos SE",       distanceKm: 254.7, primary: true },
    { id: "manual-xtep",    name: "XTEP 260X 2.0",      distanceKm: 78.0,  primary: false },
    { id: "manual-nb",      name: "NB SC TRAINER V3",   distanceKm: 88.7,  primary: false },
    { id: "manual-saucony", name: "Saucony Guide17",     distanceKm: 85.1,  primary: false },
    { id: "manual-qd",      name: "QIAODAN TG 1.0",     distanceKm: 28.2,  primary: false },
  ],
};

export function getManualShoes(athleteId: string): ManualShoe[] | null {
  return MANUAL_SHOES[athleteId] ?? null;
}
