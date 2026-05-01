import { useState } from "react";
import { Brain, Plus, CheckCircle2, Circle, ExternalLink, Trash2, Wrench } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { progressToStatus } from "@/lib/okr-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface AutomationTask {
  id: string;
  name: string;
  completed: boolean;
  tool?: string;
  status?: "automated" | "manual" | "in_progress";
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  automated: { label: "Automatizada", color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20" },
  manual: { label: "Manual", color: "bg-muted text-muted-foreground border-border" },
  in_progress: { label: "En Progreso", color: "bg-warning/10 text-warning border-warning/20" },
};

interface AIMindsetSectionProps {
  tasks: AutomationTask[];
  onAddTask: (name: string, tool?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask?: (id: string, updates: Partial<AutomationTask>) => void;
  targetPct?: number;
}

export function AIMindsetSection({ tasks, onAddTask, onToggleTask, onDeleteTask, onUpdateTask, targetPct = 80 }: AIMindsetSectionProps) {
  const [showTaskList, setShowTaskList] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskTool, setNewTaskTool] = useState("");

  const completed = tasks.filter(t => t.completed || t.status === "automated").length;
  const total = tasks.length;
  const progressRaw = total > 0 ? (completed / total) * 100 : 0;
  const progressToTarget = Math.min(100, (progressRaw / targetPct) * 100);
  const status = progressToStatus(progressToTarget);

  const handleAdd = () => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;
    onAddTask(trimmed, newTaskTool.trim() || undefined);
    setNewTaskName("");
    setNewTaskTool("");
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">AI Mindset</h3>
              <p className="text-[10px] text-muted-foreground">Automatización de Tareas · Meta {targetPct}%</p>
            </div>
          </div>
          <StatusBadge status={status} compact />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {completed}/{total} tareas automatizadas ({Math.round(progressRaw)}%)
            </span>
            <span className="font-semibold text-foreground">{Math.round(progressToTarget)}% del objetivo</span>
          </div>
          <ProgressBar value={progressToTarget} status={status} size="md" />
        </div>

        <button
          onClick={() => setShowTaskList(true)}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium bg-transparent border-none cursor-pointer p-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver / gestionar tareas automatizadas
        </button>
      </div>

      {/* Traceability dialog */}
      <Dialog open={showTaskList} onOpenChange={setShowTaskList}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" />
              Trazabilidad de Automatización AI
            </DialogTitle>
          </DialogHeader>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_110px_32px] gap-2 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
            <span>Tarea</span>
            <span>Herramienta IA</span>
            <span>Estado</span>
            <span />
          </div>

          <div className="space-y-1 max-h-[400px] overflow-auto">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay tareas registradas aún. Agrega tu primera tarea automatizada.
              </p>
            )}
            {tasks.map(task => {
              const taskStatus = task.status || (task.completed ? "automated" : "manual");
              const statusCfg = STATUS_LABELS[taskStatus];
              return (
                <div
                  key={task.id}
                  className="grid grid-cols-[1fr_120px_110px_32px] gap-2 items-center px-3 py-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="bg-transparent border-none cursor-pointer p-0 text-foreground shrink-0"
                    >
                      {task.completed || taskStatus === "automated"
                        ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                        : <Circle className="h-4 w-4 text-muted-foreground" />
                      }
                    </button>
                    <span className={`text-sm truncate ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wrench className="h-3 w-3 shrink-0" />
                    <span className="truncate">{task.tool || "—"}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] justify-center ${statusCfg.color}`}>
                    {statusCfg.label}
                  </Badge>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer p-1 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add new task */}
          <div className="flex gap-2 mt-2">
            <Input
              value={newTaskName}
              onChange={e => setNewTaskName(e.target.value)}
              placeholder="Nombre de la tarea..."
              className="text-sm flex-1"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <Input
              value={newTaskTool}
              onChange={e => setNewTaskTool(e.target.value)}
              placeholder="Herramienta IA..."
              className="text-sm w-[130px]"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={!newTaskName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>

          <DialogFooter className="mt-2">
            <div className="text-xs text-muted-foreground">
              Progreso: {completed}/{total} completadas · {Math.round(progressRaw)}% automatizado · Meta: {targetPct}%
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
