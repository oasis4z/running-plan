/**
 * Manual shoe baselines per athlete.
 *
 * baseKm  = Strava total as of baseDate, minus km logged on that date (already tracked in calendar)
 * baseDate = date of the snapshot (activities AFTER this date will be summed dynamically)
 * gearId   = Strava gear_id from activity data (populate once known, leave "" to skip dynamic sum)
 *
 * Last updated: 2026-05-07
 *   me — subtracted May 5 XTEP 11.1 km, May 6+7 Eleos 11.6 km from screenshot totals
 */

export interface ManualShoe {
  id: string;
  name: string;
  baseKm: number;
  baseDate: string;   // "YYYY-MM-DD" — sum activities AFTER this date
  gearId: string;     // Strava gear_id, e.g. "g12345678"  (empty = no dynamic update)
  primary: boolean;
}

const MANUAL_SHOES: Record<string, ManualShoe[]> = {
  me: [
    { id: "g30916375", name: "361 Eleos SE",       baseKm: 254.7, baseDate: "2026-05-07", gearId: "g30916375", primary: true },
    { id: "g30916414", name: "XTEP 260X 2.0",      baseKm: 78.0,  baseDate: "2026-05-07", gearId: "g30916414", primary: false },
    { id: "g_nb",      name: "NB SC TRAINER V3",   baseKm: 88.7,  baseDate: "2026-05-07", gearId: "", primary: false },
    { id: "g_saucony", name: "Saucony Guide17",     baseKm: 85.1,  baseDate: "2026-05-07", gearId: "", primary: false },
    { id: "g_qd",      name: "QIAODAN TG 1.0",     baseKm: 28.2,  baseDate: "2026-05-07", gearId: "", primary: false },
  ],
};

export function getManualShoes(athleteId: string): ManualShoe[] | null {
  return MANUAL_SHOES[athleteId] ?? null;
}
