export type RunType = "Easy" | "Tempo" | "Interval" | "Long Run" | "Rest";

export interface TrainingPlan {
  date: string;
  description: string;
  runType: RunType;
  distanceKm?: number;
  targetPace?: string;
  notes?: string;
  updatedAt: string;
}
