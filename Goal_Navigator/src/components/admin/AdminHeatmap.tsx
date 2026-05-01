import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import type { AreaStats } from "./AdminDashboard";

const STATUS_CONFIG = {
  on_track: { label: "On Track", color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50", icon: CheckCircle2 },
  at_risk: { label: "At Risk", color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50", icon: Clock },
  off_track: { label: "Off Track", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50", icon: AlertTriangle },
};

interface AdminHeatmapProps {
  areaStats: AreaStats[];
  onSelectArea: (area: string) => void;
}

export function AdminHeatmap({ areaStats, onSelectArea }: AdminHeatmapProps) {
  return (
    <TooltipProvider>
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Heatmap Organizacional
          </CardTitle>
          <p className="text-xs text-muted-foreground">Haz clic en un área para ver sus líderes y equipos</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="grid grid-cols-[1fr_80px_100px_120px_80px_32px] gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Área</span>
              <span className="text-center">Personas</span>
              <span className="text-center">Avance</span>
              <span className="text-center">Distribución</span>
              <span className="text-center">Estado</span>
              <span />
            </div>

            {areaStats.map((area) => {
              const cfg = STATUS_CONFIG[area.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.off_track;
              const Icon = cfg.icon;
              return (
                <button
                  key={area.area}
                  onClick={() => onSelectArea(area.area)}
                  className={`grid grid-cols-[1fr_80px_100px_120px_80px_32px] gap-2 items-center px-3 py-3 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer bg-transparent text-left w-full ${cfg.bgLight}/30`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{area.area}</p>
                    <p className="text-[11px] text-muted-foreground">{area.krCount} KRs • {area.leaders.length} líderes</p>
                  </div>
                  <p className="text-sm font-medium text-center text-foreground">{area.totalPeople}</p>
                  <div className="flex items-center gap-2 justify-center">
                    <Progress value={area.avgProgress} className="h-2 w-16" />
                    <span className="text-xs font-bold text-foreground">{area.avgProgress}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="flex items-center gap-0.5 text-[11px] text-emerald-600 font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {area.onTrack}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>On Track</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="flex items-center gap-0.5 text-[11px] text-amber-600 font-medium">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          {area.atRisk}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>At Risk</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="flex items-center gap-0.5 text-[11px] text-red-600 font-medium">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          {area.offTrack}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Off Track</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bgLight} ${cfg.textColor}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
