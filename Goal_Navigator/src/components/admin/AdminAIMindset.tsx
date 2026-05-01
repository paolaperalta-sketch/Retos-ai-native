import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";

interface AdminAIMindsetProps {
  aiMindsetGlobal: number;
}

export function AdminAIMindset({ aiMindsetGlobal }: AdminAIMindsetProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Consolidado AI Mindset
        </CardTitle>
        <p className="text-xs text-muted-foreground">Progreso global hacia la automatización del 80%</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted/30" />
              <circle
                cx="50" cy="50" r="42"
                fill="none" strokeWidth="8"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={`${(aiMindsetGlobal / 100) * 264} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground">{aiMindsetGlobal}%</span>
              <span className="text-[9px] text-muted-foreground">de 80%</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-foreground">
              La empresa ha automatizado el <span className="font-bold text-primary">{aiMindsetGlobal}%</span> de
              las tareas registradas. La meta organizacional es alcanzar el <span className="font-bold">80%</span>.
            </p>
            <div className="flex items-center gap-2">
              <Progress value={(aiMindsetGlobal / 80) * 100} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground font-medium">
                {Math.round((aiMindsetGlobal / 80) * 100)}% de la meta
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
