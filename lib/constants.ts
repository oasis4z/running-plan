import type { RunType } from "./types";

export const RUN_TYPES: RunType[] = ["Easy", "Tempo", "Interval", "Long Run", "Rest"];

export const RUN_TYPE_BG: Record<RunType, string> = {
  Easy: "bg-green-500",
  Tempo: "bg-orange-500",
  Interval: "bg-red-500",
  "Long Run": "bg-blue-500",
  Rest: "bg-gray-400",
};

export const RUN_TYPE_TEXT: Record<RunType, string> = {
  Easy: "text-green-700",
  Tempo: "text-orange-700",
  Interval: "text-red-700",
  "Long Run": "text-blue-700",
  Rest: "text-gray-600",
};

export const RUN_TYPE_LIGHT_BG: Record<RunType, string> = {
  Easy: "bg-green-50 border-green-200",
  Tempo: "bg-orange-50 border-orange-200",
  Interval: "bg-red-50 border-red-200",
  "Long Run": "bg-blue-50 border-blue-200",
  Rest: "bg-gray-50 border-gray-200",
};

export const RUN_TYPE_ABBR: Record<RunType, string> = {
  Easy: "Easy",
  Tempo: "Tempo",
  Interval: "Interval",
  "Long Run": "Long",
  Rest: "Rest",
};
