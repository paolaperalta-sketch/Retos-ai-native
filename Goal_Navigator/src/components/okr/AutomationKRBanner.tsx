import { useMemo, useState } from "react";
import { Sparkles, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useOperationalTasks } from "@/hooks/useOperationalTasks";
import { taskHasEvidence } from "@/hooks/useTeamAutomation";
import { AutomationTasksChecklist } from "@/components/automation/AutomationTasksChecklist";

/**
 * Inline KR-card that visualizes the automation OKR ("Automatizar 80% de tareas")
 * as a percentage progress block inside the collaborator's KR list.
 * Replaces the separate "Automatización" page section.
 */
export function AutomationKRBanner() {
  const { tasks, period, loading } = useOperationalTasks();
  const [open, setOpen] = useState(false);

  const { totalTasks, validAuto, sinEvidencia, percent, goal } = useMemo(() => {
    const total = tasks.length;
    const automatizadasList = tasks.filter((t) => t.estado === "automatizada");
    const validList = automatizadasList.filter(taskHasEvidence);
    const valid = validList.length;
    return {
      totalTasks: total,
      validAuto: valid,
      sinEvidencia: automatizadasList.length - valid,
      percent: total ? Math.round((valid / total) * 100) : 0,
      goal: period?.meta_porcentaje ?? 80,
    };
  }, [tasks, period]);

  if (loading || totalTasks === 0) return null;

  const onTrack = percent >= goal;
  const barColor = onTrack ? "bg-emerald-500" : percent >= goal / 2 ? "bg-amber-500" : "bg-rose-500";
  const textColor = onTrack ? "text-emerald-600 dark:text-emerald-400" : percent >= goal / 2 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/10 transition-colors text-left">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider">KR · Automatización</p>
              <p className="text-sm font-bold text-foreground truncate">
                Automatizar el {goal}% de mis tareas operativas
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[260px]">
                  <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
                <span className={`text-sm font-bold tabular-nums ${textColor}`}>{percent}%</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {validAuto}/{totalTasks} con evidencia
                </span>
                {sinEvidencia > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    {sinEvidencia} sin evidencia
                  </span>
                )}
              </div>
            </div>
            {open
              ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border/20 bg-background/40">
            <AutomationTasksChecklist />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
