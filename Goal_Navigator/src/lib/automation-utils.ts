// Utilities for the "Automatización de Tareas" OKR module

export const FRECUENCIA_MULT: Record<string, number> = {
  Diaria: 22,
  Semanal: 4,
  Quincenal: 2,
  Mensual: 1,
  Eventual: 0.5,
};

export const FRECUENCIAS = ["Diaria", "Semanal", "Quincenal", "Mensual", "Eventual"] as const;

export type Estado = "pendiente" | "en_progreso" | "automatizada";

/**
 * Estado del flujo de validación AI Native:
 * - no_aplica: no marcada por el colaborador
 * - pendiente: marcada por el colaborador, esperando validación del líder
 * - validada: aprobada por el líder — cuenta para el % del KR
 * - rechazada: el líder la devolvió con un comentario
 */
export type ValidationStatus = "no_aplica" | "pendiente" | "validada" | "rechazada";

export interface OperationalTask {
  id: string;
  user_id: string | null;
  assigned_email: string | null;
  okr_period_id: string;
  descripcion: string;
  frecuencia: string;
  tiempo_minutos: number;
  estado: Estado;
  fecha_automatizada: string | null;
  herramienta_usada: string | null;
  evidencia_url: string | null;
  horas_ahorradas_semana: number | null;
  origen: string;
  created_at: string;
  updated_at: string;
  // Validación AI Native
  proceso_automatizado: string | null;
  baseline_descripcion: string | null;
  resultado_descripcion: string | null;
  validation_status: ValidationStatus;
  leader_id: string | null;
  leader_comment: string | null;
  validated_at: string | null;
  rejected_at: string | null;
  submitted_at: string | null;
}

/** Detecta el KR de AI Native — "80% tareas operativas automatizadas" */
export function isAutomationKR(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return /tareas\s+operativas/.test(n) && /automatiz/.test(n);
}

/** Cálculo oficial del % del KR — solo cuentan tareas VALIDADAS por líder */
export function calcAutomationPercent(tasks: OperationalTask[]): {
  total: number;
  validated: number;
  pending: number;
  rejected: number;
  percent: number;
} {
  const total = tasks.length;
  const validated = tasks.filter((t) => t.validation_status === "validada").length;
  const pending = tasks.filter((t) => t.validation_status === "pendiente").length;
  const rejected = tasks.filter((t) => t.validation_status === "rechazada").length;
  const percent = total ? Math.round((validated / total) * 100) : 0;
  return { total, validated, pending, rejected, percent };
}

export interface OkrPeriod {
  id: string;
  nombre: string;
  descripcion: string | null;
  meta_porcentaje: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_user_id: string;
  is_leader_comment: boolean;
  comentario: string;
  created_at: string;
}

export function minutosAhorradosMes(t: Pick<OperationalTask, "tiempo_minutos" | "frecuencia">) {
  const m = FRECUENCIA_MULT[t.frecuencia] ?? 0.5;
  return (t.tiempo_minutos || 0) * m;
}

export function totalHorasAhorradas(tasks: OperationalTask[]) {
  const min = tasks
    .filter((t) => t.estado === "automatizada")
    .reduce((acc, t) => acc + minutosAhorradosMes(t), 0);
  return min / 60;
}

export function porcentajeAvance(tasks: OperationalTask[]) {
  if (!tasks.length) return 0;
  const auto = tasks.filter((t) => t.estado === "automatizada").length;
  return (auto / tasks.length) * 100;
}

export function diasRestantes(fechaFin: string) {
  const end = new Date(fechaFin + "T23:59:59");
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export type EstadoSemaforo = "cumpliendo" | "en_camino" | "en_riesgo";

export function estadoSemaforo(
  pctActual: number,
  meta: number,
  fechaInicio: string,
  fechaFin: string,
): EstadoSemaforo {
  const start = new Date(fechaInicio).getTime();
  const end = new Date(fechaFin).getTime();
  const now = Date.now();
  const totalDays = Math.max(1, (end - start) / 86400000);
  const elapsed = Math.max(0, Math.min(totalDays, (now - start) / 86400000));
  const expected = (elapsed / totalDays) * meta;
  const gap = expected - pctActual;
  if (gap <= 0) return "cumpliendo";
  if (gap <= meta * 0.2) return "en_camino";
  return "en_riesgo";
}

export const semaforoConfig: Record<
  EstadoSemaforo,
  { label: string; bg: string; text: string; dot: string }
> = {
  cumpliendo: {
    label: "Cumpliendo",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  en_camino: {
    label: "En camino",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  en_riesgo: {
    label: "En riesgo",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
};

export const estadoConfig: Record<Estado, { label: string; bg: string; text: string }> = {
  pendiente: {
    label: "Pendiente",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
  en_progreso: {
    label: "En progreso",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  automatizada: {
    label: "Automatizada",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
  },
};
