import { RATING_SCALE } from "@/lib/review-utils";
import { cn } from "@/lib/utils";

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function RatingScale({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {RATING_SCALE.map((r) => {
        const selected = value === r.value;
        return (
          <button
            key={r.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(r.value)}
            className={cn(
              "text-left rounded-lg border p-3 transition-all",
              "hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed",
              selected
                ? "border-primary bg-primary/8"
                : "border-border/60 bg-background",
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "h-6 w-6 rounded-full grid place-items-center text-[11px] font-bold",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}
              >
                {r.value}
              </span>
              <span className="text-xs font-semibold text-foreground">{r.label}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">{r.description}</p>
          </button>
        );
      })}
    </div>
  );
}
