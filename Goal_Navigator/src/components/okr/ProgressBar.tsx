import { Status } from "@/types/okr";

interface ProgressBarProps {
  value: number;
  status?: Status;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ProgressBar({ value, status, size = "md", showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const gradient = status === "on_track"
    ? "from-emerald-400 to-emerald-500"
    : status === "at_risk"
    ? "from-amber-400 to-amber-500"
    : status === "off_track"
    ? "from-rose-400 to-rose-500"
    : "from-primary to-primary";

  const height = size === "sm" ? "h-2" : size === "lg" ? "h-3.5" : "h-2.5";

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex-1 rounded-full bg-muted/30 overflow-hidden ${height}`}>
        <div
          className={`${height} rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out relative ${
            clamped >= 100 ? "animate-pulse" : ""
          }`}
          style={{ width: `${clamped}%` }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent" />
        </div>
      </div>
      {showLabel && (
        <span className="text-sm font-bold text-foreground min-w-[3rem] text-right tabular-nums">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
