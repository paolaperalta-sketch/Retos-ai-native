import { useEffect, useState } from "react";
import { Clock, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOperationalTasks } from "@/hooks/useOperationalTasks";
import type { OperationalTask } from "@/lib/automation-utils";
import { toast } from "sonner";

interface Props {
  task: OperationalTask | null;
  /** Anchor element id to position against. If absent, popover renders centered via prop. */
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const schema = z.coerce
  .number({ invalid_type_error: "Debe ser un número" })
  .min(0, "No puede ser negativo")
  .max(168, "Máximo 168h/semana");

/**
 * Lightweight inline popover triggered when a collaborator marks a task as
 * automated. Asks ONE thing: "How many hours/week do you save now?".
 * That number powers the team efficiency KPI for leaders.
 */
export function TimeSavingsPopover({ task, open, onOpenChange }: Props) {
  const { updateTask } = useOperationalTasks();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && task) {
      setValue(task.horas_ahorradas_semana?.toString() ?? "");
      setError(null);
    }
  }, [open, task?.id]);

  if (!task) return null;

  const handleSave = async () => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      await updateTask(task.id, {
        horas_ahorradas_semana: parsed.data,
      } as Partial<OperationalTask>);
      toast.success(`✨ +${parsed.data}h/semana suman a la eficiencia del equipo`);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span className="sr-only">anchor</span>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4"
        side="top"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">¡Tarea automatizada! 🎉</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                ¿Cuántas horas a la semana ahorras ahora con esta automatización?
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="number"
                step="0.25"
                min="0"
                max="168"
                inputMode="decimal"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                placeholder="Ej. 2.5"
                autoFocus
                className="pl-8 h-9 text-sm"
                aria-label="Horas ahorradas por semana"
                aria-invalid={!!error}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-medium">
                h/sem
              </span>
            </div>
            {error && <p className="text-[10px] text-destructive">{error}</p>}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => onOpenChange(false)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              Más tarde
            </button>
            <Button onClick={handleSave} disabled={saving || !value} size="sm" className="h-8 text-xs gap-1.5">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Guardar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
