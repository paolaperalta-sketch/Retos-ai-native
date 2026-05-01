import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { CLOSING_MONTHS, CLOSING_MONTH_LABELS } from "@/lib/kr-mapper";

/** "Todos" sentinel for the period selector. */
export const PERIOD_ALL = "Todos";

/** Lista plana de los periodos disponibles (Todos + 4 meses Q2 2026). */
export const ALL_PERIODS = [
  PERIOD_ALL,
  ...CLOSING_MONTHS.map(m => `${CLOSING_MONTH_LABELS[m]} 2026`),
];

interface PeriodSelectorProps {
  value: string;
  onChange: (v: string) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[170px] h-9 text-xs font-medium">
          <SelectValue placeholder="Selecciona mes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PERIOD_ALL} className="text-xs">Todos los meses</SelectItem>
          {CLOSING_MONTHS.map((m) => {
            const v = `${CLOSING_MONTH_LABELS[m]} 2026`;
            return (
              <SelectItem key={v} value={v} className="text-xs">
                {CLOSING_MONTH_LABELS[m]}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
