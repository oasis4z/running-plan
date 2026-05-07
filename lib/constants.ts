import type { RunType } from "./types";

export const RUN_TYPES: RunType[] = ["Easy", "Tempo", "Interval", "Fartlek", "Long Run", "Rest"];

export const RUN_TYPE_BG: Record<RunType, string> = {
  Easy: "bg-green-500",
  Tempo: "bg-orange-500",
  Interval: "bg-red-500",
  Fartlek: "bg-indigo-500",
  "Long Run": "bg-blue-500",
  Rest: "bg-gray-400",
};

export const RUN_TYPE_TEXT: Record<RunType, string> = {
  Easy: "text-green-700",
  Tempo: "text-orange-700",
  Interval: "text-red-700",
  Fartlek: "text-indigo-700",
  "Long Run": "text-blue-700",
  Rest: "text-gray-600",
};

export const RUN_TYPE_LIGHT_BG: Record<RunType, string> = {
  Easy: "bg-green-50 border-green-200",
  Tempo: "bg-orange-50 border-orange-200",
  Interval: "bg-red-50 border-red-200",
  Fartlek: "bg-indigo-50 border-indigo-200",
  "Long Run": "bg-blue-50 border-blue-200",
  Rest: "bg-gray-50 border-gray-200",
};

// Cell background — stronger colors by difficulty
export const RUN_TYPE_CELL_BG: Record<RunType, string> = {
  Rest:       "bg-gray-100 border-gray-300",
  Easy:       "bg-emerald-200 border-emerald-400",
  "Long Run": "bg-blue-200 border-blue-400",
  Tempo:      "bg-orange-200 border-orange-400",
  Interval:   "bg-red-300 border-red-500",
  Fartlek:    "bg-indigo-200 border-indigo-400",
};

export const RUN_TYPE_CELL_TEXT: Record<RunType, string> = {
  Rest:       "text-gray-600",
  Easy:       "text-emerald-900",
  "Long Run": "text-blue-900",
  Tempo:      "text-orange-900",
  Interval:   "text-red-900",
  Fartlek:    "text-indigo-900",
};

export const RUN_TYPE_LABEL_BG: Record<RunType, string> = {
  Rest:       "bg-gray-500",
  Easy:       "bg-emerald-600",
  "Long Run": "bg-blue-600",
  Tempo:      "bg-orange-600",
  Interval:   "bg-red-600",
  Fartlek:    "bg-indigo-600",
};

export const RUN_TYPE_ABBR: Record<RunType, string> = {
  Easy: "Easy",
  Tempo: "Tempo",
  Interval: "Interval",
  Fartlek: "Fartlek",
  "Long Run": "Long",
  Rest: "Rest",
};
