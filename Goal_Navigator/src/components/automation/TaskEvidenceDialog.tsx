import { useEffect, useState } from "react";
import { Loader2, Link2, Wrench, Save, Clock, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOperationalTasks } from "@/hooks/useOperationalTasks";
import type { OperationalTask } from "@/lib/automation-utils";
import { toast } from "sonner";

interface Props {
  task: OperationalTask | null;
  onClose: () => void;
  /** When true, the dialog is opened as part of marking the task as automated.
   *  In that mode, saving will also flip estado → "automatizada". */
  completing?: boolean;
}

/**
 * Collaborator-side dialog to document the technical evidence of an automation:
 * tool used + URL + hours saved per week. ALL three fields are needed for the
 * task to count toward the 80% goal AND to feed the team efficiency KPI.
 */
export function TaskEvidenceDialog({ task, onClose, completing = false }: Props) {
  const { updateTask } = useOperationalTasks();
  const [tool, setTool] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [hours, setHours] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTool(task.herramienta_usada ?? "");
      setUrl(task.evidencia_url ?? "");
      setNotes((task as any).descripcion_implementacion ?? "");
      setHours(task.horas_ahorradas_semana?.toString() ?? "");
    }
  }, [task?.id]);

  if (!task) return null;

  const isUrlValid = !url.trim() || /^(https?:\/\/|\/)/i.test(url.trim());
  const hoursNum = parseFloat(hours);
  const isHoursValid = !isNaN(hoursNum) && hoursNum >= 0 && hoursNum <= 168;
  const hasEvidence = !!(tool.trim() || url.trim());
  const canSave = hasEvidence && isHoursValid && isUrlValid;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await updateTask(task.id, {
        herramienta_usada: tool.trim() || null,
        evidencia_url: url.trim() || null,
        horas_ahorradas_semana: hoursNum,
        ...(completing
          ? { estado: "automatizada", fecha_automatizada: new Date().toISOString() }
          : {}),
      } as Partial<OperationalTask>);
      toast.success(
        completing
          ? `🎉 Tarea automatizada · +${hoursNum}h/sem a la eficiencia del equipo`
          : "Evidencia guardada",
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {completing ? "Confirmar automatización" : "Detalle de ejecución"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {completing
              ? "Para marcar como automatizada necesitamos evidencia y el tiempo que ahorras."
              : task.descripcion}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Field label="Herramienta usada" icon={Wrench} hint="n8n, GPT, script Python, Make…">
            <Input value={tool} onChange={(e) => setTool(e.target.value)} placeholder="Ej. n8n + OpenAI" />
          </Field>

          <Field
            label="Link de evidencia"
            icon={Link2}
            hint="Repositorio, script, documento o video que acredite la automatización"
          >
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/... o https://drive.google.com/..."
              className="font-mono text-xs"
            />
            {!isUrlValid && (
              <p className="text-[10px] text-[hsl(var(--danger))] mt-1">
                Debe iniciar con http:// o https://
              </p>
            )}
          </Field>

          <Field
            label="Horas ahorradas por semana"
            icon={Clock}
            hint="¿Cuánto tiempo te libera esta automatización cada semana? Suma a la eficiencia del equipo."
            required
          >
            <div className="relative">
              <Input
                type="number"
                step="0.25"
                min="0"
                max="168"
                inputMode="decimal"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Ej. 2.5"
                className="pr-14"
                aria-invalid={hours !== "" && !isHoursValid}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-medium">
                h/sem
              </span>
            </div>
            {hours !== "" && !isHoursValid && (
              <p className="text-[10px] text-[hsl(var(--danger))] mt-1">
                Debe ser un número entre 0 y 168
              </p>
            )}
          </Field>

          <Field label="Comentarios de implementación" hint="¿Qué hiciste? ¿Qué retos encontraste?">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe la lógica aplicada, edge cases, decisiones técnicas…"
              className="text-sm"
            />
          </Field>

          <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-3">
            <p className="text-[10px] text-muted-foreground flex-1">
              {canSave ? (
                <>✓ Esta tarea contará hacia tu meta y sumará <strong>{hoursNum}h/sem</strong> al equipo</>
              ) : !hasEvidence ? (
                "Necesitas herramienta o link de evidencia"
              ) : !isHoursValid ? (
                "Indica cuántas horas/semana ahorras"
              ) : (
                "Completa los campos requeridos"
              )}
            </p>
            <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2 shrink-0">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : completing ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {completing ? "Confirmar" : "Guardar evidencia"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  icon: Icon,
  hint,
  required,
  children,
}: {
  label: string;
  icon?: any;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
        {required && <span className="text-[hsl(var(--danger))]">*</span>}
      </label>
      {hint && <p className="text-[10px] text-muted-foreground mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}
