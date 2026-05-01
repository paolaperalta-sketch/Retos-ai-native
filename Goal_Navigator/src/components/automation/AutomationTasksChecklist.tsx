import { useMemo, useState } from "react";
import { Plus, Sparkles, Clock, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOperationalTasks } from "@/hooks/useOperationalTasks";
import { taskHasEvidence } from "@/hooks/useTeamAutomation";
import {
  FRECUENCIAS,
  minutosAhorradosMes,
  totalHorasAhorradas,
  type OperationalTask,
} from "@/lib/automation-utils";
import { TaskEvidenceDialog } from "./TaskEvidenceDialog";

type Filtro = "todas" | "pendientes" | "automatizadas";

/**
 * Smart checklist for the collaborator's own automation tasks.
 * Lightweight: no OKR header (rendered by parent banner), no team tabs,
 * no leader features. Strictly scoped to the authenticated user via the hook.
 */
export function AutomationTasksChecklist() {
  const { tasks, period, loading, toggleAutomatizada, createTask } = useOperationalTasks();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [creating, setCreating] = useState(false);
  const [evidenceTask, setEvidenceTask] = useState<OperationalTask | null>(null);
  const [completingTask, setCompletingTask] = useState<OperationalTask | null>(null);

  const filtered = useMemo(() => {
    if (filtro === "pendientes") return tasks.filter((t) => t.estado !== "automatizada");
    if (filtro === "automatizadas") return tasks.filter((t) => t.estado === "automatizada");
    return tasks;
  }, [tasks, filtro]);

  const meta = period?.meta_porcentaje ?? 80;
  const validAutoList = tasks.filter((t) => t.estado === "automatizada" && taskHasEvidence(t));
  const auto = tasks.filter((t) => t.estado === "automatizada").length;
  const validAuto = validAutoList.length;
  const sinEvidencia = auto - validAuto;
  const pct = tasks.length ? Math.round((validAuto / tasks.length) * 100) : 0;
  // Eficiencia generada: prefer self-reported h/week; fallback to estimated h/month from frequency
  const horasSemana = validAutoList.reduce(
    (acc, t) => acc + (t.horas_ahorradas_semana ?? minutosAhorradosMes(t) / 60 / 4),
    0,
  );
  const horasMes = horasSemana * 4;
  const faltantesParaMeta = Math.max(0, Math.ceil((meta * tasks.length) / 100) - validAuto);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando tus tareas…
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-4">
      {/* Stats compactas + meta */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Con evidencia" value={`${validAuto}/${tasks.length}`} sub={sinEvidencia ? `${sinEvidencia} sin evidencia` : "todas válidas"} icon={CheckCircle2} />
        <Stat label="Eficiencia" value={`${horasSemana.toFixed(1)}h`} sub="ahorradas/sem" icon={Clock} />
        <Stat
          label="Faltan"
          value={faltantesParaMeta === 0 ? "🎯" : String(faltantesParaMeta)}
          sub={faltantesParaMeta === 0 ? "meta lograda" : `para ${meta}%`}
          icon={Sparkles}
        />
      </div>

      {/* Filtros + nueva tarea */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {(["todas", "pendientes", "automatizadas"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filtro === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {f === "todas" ? "Todas" : f === "pendientes" ? "Pendientes" : "Automatizadas"}
              <span className="ml-1.5 opacity-70 tabular-nums">
                {f === "todas"
                  ? tasks.length
                  : f === "pendientes"
                  ? tasks.filter((t) => t.estado !== "automatizada").length
                  : auto}
              </span>
            </button>
          ))}
        </div>
        <NewTaskDialog open={creating} onOpenChange={setCreating} onCreate={createTask} />
      </div>

      {/* Smart checklist */}
      <ul className="divide-y divide-border/40 rounded-lg border border-border/40 bg-background/60 overflow-hidden">
        {filtered.map((t) => (
          <ChecklistItem
            key={t.id}
            task={t}
            onToggle={() => {
              const isDone = t.estado === "automatizada";
              const ready = taskHasEvidence(t);
              // Si está marcando como completada y le falta evidencia/horas →
              // abrir el diálogo en modo "completing" para capturar todo a la vez.
              if (!isDone && !ready) {
                setCompletingTask(t);
                return;
              }
              toggleAutomatizada(t);
            }}
            onOpenEvidence={() => setEvidenceTask(t)}
          />
        ))}
        {filtered.length === 0 && (
          <li className="py-10 text-center text-sm text-muted-foreground">
            {tasks.length === 0
              ? "Aún no tienes tareas mapeadas. Crea la primera arriba."
              : "No hay tareas en este filtro."}
          </li>
        )}
      </ul>
      <TaskEvidenceDialog task={evidenceTask} onClose={() => setEvidenceTask(null)} />
      <TaskEvidenceDialog
        task={completingTask}
        completing
        onClose={() => setCompletingTask(null)}
      />
    </div>
  );
}

/* ──────────────── Item ──────────────── */
function ChecklistItem({
  task,
  onToggle,
  onOpenEvidence,
}: {
  task: OperationalTask;
  onToggle: () => void;
  onOpenEvidence: () => void;
}) {
  const done = task.estado === "automatizada";
  const hasEv = taskHasEvidence(task);
  const ahorroMes = (minutosAhorradosMes(task) / 60).toFixed(1);

  return (
    <li className="flex items-stretch">
      <button
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? "Marcar como pendiente" : "Marcar como automatizada"}
        className={`flex-1 text-left flex items-start gap-3 px-4 py-3.5 min-h-[56px] hover:bg-muted/30 active:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset ${
          done ? "bg-emerald-50/40 dark:bg-emerald-950/10" : ""
        }`}
      >
        <span
          className={`mt-0.5 h-6 w-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
            done
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-muted-foreground/40 hover:border-primary"
          }`}
        >
          {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5 opacity-0" />}
        </span>

        <span className="flex-1 min-w-0">
          <span className={`block text-sm font-medium leading-snug ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {task.descripcion}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-normal h-4 px-1.5">{task.frecuencia}</Badge>
            <span className="tabular-nums">{task.tiempo_minutos} min</span>
            <span>·</span>
            <span className="tabular-nums">{ahorroMes}h/mes</span>
            {done && !hasEv && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">⚠ falta evidencia</span>
            )}
            {hasEv && task.herramienta_usada && (
              <>
                <span>·</span>
                <span className="font-mono text-foreground/70">{task.herramienta_usada}</span>
              </>
            )}
          </span>
        </span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onOpenEvidence(); }}
        className="px-3 text-[11px] font-medium text-primary hover:bg-primary/5 border-l border-border/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label="Editar evidencia"
      >
        Evidencia
      </button>
    </li>
  );
}

/* ──────────────── Stat chip ──────────────── */
function Stat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
        {value}
        {sub && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{sub}</span>}
      </p>
    </div>
  );
}

/* ──────────────── New task dialog ──────────────── */
function NewTaskDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (i: { descripcion: string; frecuencia: string; tiempo_minutos: number }) => Promise<void>;
}) {
  const [desc, setDesc] = useState("");
  const [freq, setFreq] = useState("Semanal");
  const [min, setMin] = useState("15");
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nueva tarea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarea operativa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Frecuencia</label>
              <Select value={freq} onValueChange={setFreq}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRECUENCIAS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tiempo (min)</label>
              <Input type="number" value={min} onChange={(e) => setMin(e.target.value)} />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!desc.trim() || saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onCreate({ descripcion: desc, frecuencia: freq, tiempo_minutos: parseInt(min) || 0 });
                setDesc("");
                setMin("15");
                onOpenChange(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
