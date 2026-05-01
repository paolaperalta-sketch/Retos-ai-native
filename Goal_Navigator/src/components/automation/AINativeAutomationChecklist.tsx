import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Clock,
  Send,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useOperationalTasks } from "@/hooks/useOperationalTasks";
import {
  calcAutomationPercent,
  type OperationalTask,
  type ValidationStatus,
} from "@/lib/automation-utils";
import { toast } from "sonner";

interface Props {
  /** Called every time the validated % changes — used to push to the KR check-in */
  onPercentChange?: (percent: number, validated: number, total: number) => void;
  /** Hide the percent header (when the parent KR already shows it) */
  compactHeader?: boolean;
}

/**
 * Checklist colaborador para el KR1 AI Native — "80% de tareas operativas automatizadas".
 * Las tareas vienen del mapeo cargado por admin. El colaborador NO puede crear ni eliminar.
 *
 * Flujo:
 *  1. Marca una tarea → se abre el dialog con las 3 preguntas obligatorias
 *  2. Al guardar → estado pasa a "pendiente validación líder"
 *  3. El líder valida o rechaza desde /equipo
 *  4. Solo las VALIDADAS cuentan al % del KR
 */
export function AINativeAutomationChecklist({
  onPercentChange,
  compactHeader = false,
}: Props) {
  const { tasks, loading, updateTask } = useOperationalTasks();
  const [dialogTask, setDialogTask] = useState<OperationalTask | null>(null);
  const [open, setOpen] = useState(true);

  const stats = useMemo(() => calcAutomationPercent(tasks), [tasks]);

  // Push the validated % up to the parent (KR check-in)
  useEffect(() => {
    if (loading) return;
    onPercentChange?.(stats.percent, stats.validated, stats.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.percent, stats.validated, stats.total, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando tus tareas…
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
        <p className="text-sm font-medium text-foreground">Aún no tienes tareas registradas.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Contacta a tu líder para que cargue tu mapeo de tareas operativas.
        </p>
      </div>
    );
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-lg border border-border/40 bg-background/60 overflow-hidden">
          {!compactHeader && (
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-2 text-left">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Automatización de tareas
                  </span>
                  <Badge variant="outline" className="text-[10px] h-5 px-2 font-medium">
                    {stats.validated}/{stats.total} automatizadas
                  </Badge>
                  {stats.pending > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 px-2 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    >
                      {stats.pending} pend. líder
                    </Badge>
                  )}
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
          )}

          <CollapsibleContent>
            <ul className="divide-y divide-border/40">
              {tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onMark={() => setDialogTask(t)}
                  onUnmark={async () => {
                    if (t.validation_status === "validada") {
                      toast.error("Esta tarea ya fue validada por tu líder. No puedes desmarcarla.");
                      return;
                    }
                    await updateTask(t.id, {
                      estado: "pendiente",
                      validation_status: "no_aplica",
                      submitted_at: null,
                    });
                    toast.success("Tarea desmarcada");
                  }}
                  onEdit={() => setDialogTask(t)}
                />
              ))}
            </ul>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <AutomationEvidenceDialog
        task={dialogTask}
        onClose={() => setDialogTask(null)}
      />
    </>
  );
}

/* ────────────────── Row ────────────────── */
function TaskRow({
  task,
  onMark,
  onUnmark,
  onEdit,
}: {
  task: OperationalTask;
  onMark: () => void;
  onUnmark: () => void;
  onEdit: () => void;
}) {
  const status = task.validation_status;
  const isValidated = status === "validada";
  const isPending = status === "pendiente";
  const isRejected = status === "rechazada";
  const isMarked = isValidated || isPending || isRejected;

  return (
    <li className="px-4 py-3 flex items-start gap-3">
      <button
        onClick={isMarked && !isRejected ? onUnmark : onMark}
        aria-pressed={isMarked}
        aria-label={isMarked ? "Desmarcar tarea" : "Marcar como automatizada"}
        disabled={isValidated}
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
          isValidated
            ? "bg-emerald-500 border-emerald-500 text-white cursor-not-allowed"
            : isPending
            ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300"
            : isRejected
            ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300"
            : "border-muted-foreground/40 hover:border-primary"
        }`}
      >
        {isValidated ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : isPending ? (
          <Clock className="h-3 w-3" />
        ) : isRejected ? (
          <AlertTriangle className="h-3 w-3" />
        ) : (
          <Circle className="h-3 w-3 opacity-0" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            isValidated ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {task.descripcion}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-normal">
            {task.frecuencia}
          </Badge>
          <span className="tabular-nums">{task.tiempo_minutos} min</span>

          {isValidated && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Validada por líder
            </span>
          )}
          {isPending && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Pendiente validación del líder
            </span>
          )}
          {isRejected && task.leader_comment && (
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              Rechazada — revisa el comentario
            </span>
          )}
        </div>

        {isRejected && task.leader_comment && (
          <div className="mt-2 rounded-md bg-rose-500/5 border border-rose-500/20 px-2.5 py-1.5">
            <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Comentario del líder
            </p>
            <p className="text-xs text-foreground/80 mt-0.5">{task.leader_comment}</p>
          </div>
        )}
      </div>

      {(isPending || isRejected) && !isValidated && (
        <button
          onClick={onEdit}
          className="text-[11px] text-primary hover:underline shrink-0 flex items-center gap-1"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      )}
    </li>
  );
}

/* ────────────────── Dialog with the 3 mandatory questions ────────────────── */
function AutomationEvidenceDialog({
  task,
  onClose,
}: {
  task: OperationalTask | null;
  onClose: () => void;
}) {
  const { updateTask } = useOperationalTasks();
  const [proceso, setProceso] = useState("");
  const [baseline, setBaseline] = useState("");
  const [resultado, setResultado] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setProceso(task.proceso_automatizado ?? "");
      setBaseline(task.baseline_descripcion ?? "");
      setResultado(task.resultado_descripcion ?? "");
    }
  }, [task?.id]);

  if (!task) return null;

  const canSubmit =
    proceso.trim().length >= 10 &&
    baseline.trim().length >= 3 &&
    resultado.trim().length >= 3;

  const wasRejected = task.validation_status === "rechazada";

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await updateTask(task.id, {
        estado: "automatizada",
        validation_status: "pendiente" as ValidationStatus,
        proceso_automatizado: proceso.trim(),
        baseline_descripcion: baseline.trim(),
        resultado_descripcion: resultado.trim(),
        fecha_automatizada: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        // Clear previous rejection
        leader_comment: null,
        rejected_at: null,
      });
      toast.success(
        wasRejected
          ? "Tarea reenviada al líder para validación"
          : "Tarea enviada — pendiente validación de tu líder",
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {wasRejected ? "Corregir y reenviar" : "Marcar como automatizada"}
          </DialogTitle>
          <DialogDescription className="text-xs">{task.descripcion}</DialogDescription>
        </DialogHeader>

        {wasRejected && task.leader_comment && (
          <div className="rounded-md bg-rose-500/5 border border-rose-500/20 px-3 py-2">
            <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-1">
              Tu líder rechazó esta tarea
            </p>
            <p className="text-xs text-foreground/80">{task.leader_comment}</p>
          </div>
        )}

        <div className="space-y-3 mt-2">
          <Field
            label="¿Cuál es el proceso que automatizaste?"
            required
            hint="Describe brevemente la lógica, herramienta y alcance"
          >
            <Textarea
              value={proceso}
              onChange={(e) => setProceso(e.target.value)}
              rows={3}
              placeholder="Ej. Workflow en n8n que toma los pedidos del CRM y los clasifica automáticamente con GPT…"
              className="text-sm"
            />
            <CharCount value={proceso} min={10} />
          </Field>

          <Field
            label="¿Cuál era el tiempo o costo antes de la automatización?"
            required
            hint="Baseline medible — horas/semana, días, costo, errores"
          >
            <Textarea
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              rows={2}
              placeholder="Ej. 4 horas/semana clasificando manualmente, con 15% de errores"
              className="text-sm"
            />
          </Field>

          <Field
            label="¿Cuál es el resultado medido después?"
            required
            hint="Métrica medida — debe ser comparable con el baseline"
          >
            <Textarea
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              rows={2}
              placeholder="Ej. 15 minutos/semana de revisión, errores < 2%"
              className="text-sm"
            />
          </Field>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground flex-1">
              {canSubmit
                ? "Tu líder recibirá una notificación para validar"
                : "Las 3 respuestas son obligatorias"}
            </p>
            <Button onClick={handleSubmit} disabled={!canSubmit || saving} className="gap-2 shrink-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {wasRejected ? "Reenviar" : "Enviar a validación"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-[hsl(var(--danger))]">*</span>}
      </label>
      {hint && <p className="text-[10px] text-muted-foreground mb-1">{hint}</p>}
      {children}
    </div>
  );
}

function CharCount({ value, min }: { value: string; min: number }) {
  const len = value.trim().length;
  if (len === 0) return null;
  if (len >= min) return null;
  return (
    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
      Mínimo {min} caracteres ({len}/{min})
    </p>
  );
}
