import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock } from "lucide-react";

interface DashboardFiltersProps {
  years: string[];
  selectedYear: string;
  onYearChange: (v: string) => void;
  periodsForYear: string[];
  areas: string[];
  availableAreas: string[];
  availableSubareas: string[];
  selectedPeriod: string;
  selectedArea: string;
  selectedSubarea: string;
  onPeriodChange: (v: string) => void;
  onAreaChange: (v: string) => void;
  onSubareaChange: (v: string) => void;
  allowedAreas?: string[] | null;
  showPeriod?: boolean;
  showArea?: boolean;
  showSubarea?: boolean;
}

export function DashboardFilters({
  years,
  selectedYear,
  onYearChange,
  periodsForYear,
  availableAreas,
  availableSubareas,
  selectedPeriod,
  selectedArea,
  selectedSubarea,
  onPeriodChange,
  onAreaChange,
  onSubareaChange,
  allowedAreas,
  showPeriod = true,
  showArea = true,
  showSubarea = true,
}: DashboardFiltersProps) {
  const isSingleAreaLocked = allowedAreas && allowedAreas.length === 1;
  const isMultiAreaRestricted = allowedAreas && allowedAreas.length > 1;
  const displayAreas = isMultiAreaRestricted
    ? availableAreas.filter((a) => allowedAreas.includes(a))
    : availableAreas;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Año</span>
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[100px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showPeriod && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Período</span>
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {periodsForYear.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {showArea && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Área</span>
          {isSingleAreaLocked ? (
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-muted text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              {allowedAreas[0]}
            </div>
          ) : (
            <Select value={selectedArea} onValueChange={onAreaChange}>
              <SelectTrigger className="w-[200px] bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!isMultiAreaRestricted && <SelectItem value="all">Todas las áreas</SelectItem>}
                {displayAreas.filter(Boolean).map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      {showSubarea && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Subárea</span>
          <Select value={selectedSubarea} onValueChange={onSubareaChange}>
            <SelectTrigger className="w-[200px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las subáreas</SelectItem>
              {availableSubareas.filter(Boolean).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}