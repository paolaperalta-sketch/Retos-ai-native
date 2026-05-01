import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AREAS } from "@/types/okr";
import { Filter } from "lucide-react";

interface FilterNavBarProps {
  selectedArea: string;
  onAreaChange: (area: string) => void;
  selectedPerson?: string;
  onPersonChange?: (person: string) => void;
  people?: { name: string }[];
  /** Optional period selector */
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const PERIODS = ["Enero 2026", "Febrero 2026", "Marzo 2026", "Abril 2026"];

export function FilterNavBar({
  selectedArea, onAreaChange,
  selectedPerson, onPersonChange, people,
  selectedPeriod, onPeriodChange,
}: FilterNavBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-medium">Filtros</span>
      </div>

      <Select value={selectedArea} onValueChange={onAreaChange}>
        <SelectTrigger className="w-44 h-9 text-xs">
          <SelectValue placeholder="Área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las áreas</SelectItem>
          {AREAS.map(a => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {onPersonChange && people && (
        <Select value={selectedPerson ?? "all"} onValueChange={onPersonChange}>
          <SelectTrigger className="w-44 h-9 text-xs">
            <SelectValue placeholder="Persona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las personas</SelectItem>
            {people.map(p => (
              <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {onPeriodChange && (
        <Select value={selectedPeriod ?? PERIODS[PERIODS.length - 1]} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
