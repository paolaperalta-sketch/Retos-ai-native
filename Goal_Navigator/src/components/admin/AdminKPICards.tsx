import { Users, TrendingUp, Target, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AdminKPICardsProps {
  totalPeople: number;
  globalAvgProgress: number;
  totalKRs: number;
  aiMindsetGlobal: number;
}

export function AdminKPICards({ totalPeople, globalAvgProgress, totalKRs, aiMindsetGlobal }: AdminKPICardsProps) {
  return (
    <div className="people-metrics-grid">
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Equipo Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalPeople}</p>
          <p className="text-[11px] text-muted-foreground">colaboradores activos</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Avance Global</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{globalAvgProgress}%</p>
          <Progress value={globalAvgProgress} className="h-1.5 mt-1" />
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">KRs Activos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalKRs}</p>
          <p className="text-[11px] text-muted-foreground">resultados clave</p>
        </CardContent>
      </Card>
      <Card className="border-border/50 border-primary/20">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">AI Mindset</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{aiMindsetGlobal}%</p>
          <div className="flex items-center gap-1 mt-1">
            <Progress value={aiMindsetGlobal} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground">meta 80%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
