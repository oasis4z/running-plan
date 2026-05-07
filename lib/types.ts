export type RunType = "Easy" | "Tempo" | "Interval" | "Long Run" | "Rest" | "Fartlek";

export interface FartlekStructure {
  fastMin: number;
  fastPace?: string;
  slowMin: number;
  slowPace?: string;
  sets: number;
}

export interface TrainingPlan {
  date: string;
  description: string;
  runType: RunType;
  distanceKm?: number;
  durationMin?: number;
  targetPace?: string;
  notes?: string;
  fartlek?: FartlekStructure;
  updatedAt: string;
}

export interface Athlete {
  id: string;          // stable ID (never changes)
  slug: string;        // URL slug (admin can rename)
  name: string;        // short display name
  displayName?: string;
  createdAt: string;
}

export interface RaceInfo {
  name: string;
  date: string;        // "YYYY-MM-DD"
  distance?: string;   // e.g. "Full Marathon", "10K"
}

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;       // unix seconds
  athleteId: number;
  athleteName?: string;
}

export interface StravaActivity {
  id: number;
  date: string;            // "YYYY-MM-DD" (local)
  distanceKm: number;
  durationMin: number;     // moving time
  paceSecPerKm: number;
  type: string;            // "Run", "TrailRun", etc.
  name: string;
  url: string;
  avgHr?: number;          // bpm
  maxHr?: number;          // bpm
  elevationGain?: number;  // meters
  sufferScore?: number;    // Strava relative effort
  mapPolyline?: string;   // Google Encoded Polyline from Strava map.summary_polyline
  calories?: number;      // kcal (derived from kilojoules)
  gearId?: string;        // Strava gear ID (shoe/bike)
}

export interface StravaLap {
  lapIndex: number;
  distanceKm: number;
  movingTimeSec: number;
  paceSecPerKm: number;
  avgHr?: number;
}
