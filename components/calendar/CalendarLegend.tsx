import { RUN_TYPE_BG } from "@/lib/constants";
import type { RunType } from "@/lib/types";

const ITEMS: { type: RunType; label: string }[] = [
  { type: "Easy", label: "Easy" },
  { type: "Tempo", label: "Tempo" },
  { type: "Interval", label: "Interval" },
  { type: "Long Run", label: "Long Run" },
  { type: "Rest", label: "Rest" },
];

export default function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
      {ITEMS.map(({ type, label }) => (
        <span key={type} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${RUN_TYPE_BG[type]}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
