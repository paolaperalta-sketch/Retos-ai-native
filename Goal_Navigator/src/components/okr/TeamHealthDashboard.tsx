import { useMemo, useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import {
  Calendar, TrendingUp, TrendingDown, Minus,
  AlertCircle, ClipboardCheck, Clock, Bot, Zap, Bell,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { avatarMap } from "@/data/avatarMap";
import { toast } from "sonner";
import { CLOSING_MONTHS, CLOSING_MONTH_LABELS } from "@/lib/kr-mapper";

const CLOSING_MONTH_VALUES: Record<string, string> = {
  abril: "2026-04",
  mayo: "2026-05",
  junio: "2026-06",
  julio: "2026-07",
};

interface AlertItem {
  name: string;
  reason: "no_checkin" | "zero_progress";
}

interface Props {
  areaName: string;
  periodValue: string;
  onPeriodChange: (value: string) => void;
  avgProgress: number;
  trendDelta?: number;
  totalMembers: number;
  alerts: AlertItem[];
  onAlertClick: (name: string) => void;
  selfAssessSubmitted: number;
  selfAssessTotal: number;
  pendingApprovalCount: number;
  automationAvgPct: number;
  automationGoalPct?: number;
  efficiencyHoursWeek: number;
  efficiencyGoalHours?: number;
  /** Optional team status breakdown */
  zeroProgressCount?: number;
  atRiskCount?: number;
  inProgressCount?: number;
}

// Semantic colors per spec
const SEMANTIC = {
  red: "#E24B4A",
  orange: "#EF9F27",
  green: "#639922",
};

function progressColor(pct: number) {
  if (pct >= 80) return SEMANTIC.green;
  if (pct >= 40) return SEMANTIC.orange;
  return SEMANTIC.red;
}

function TrendBadge({ delta }: { delta?: number }) {
  if (delta === undefined || isNaN(delta)) return null;
  const up = delta > 0;
  const flat = delta === 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const cls = flat
    ? "bg-muted text-muted-foreground"
    : up
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : "bg-rose-500/10 text-rose-700 dark:text-rose-400";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      <Icon className="h-3 w-3" />
      {flat ? "Sin cambio" : `${up ? "+" : ""}${delta.toFixed(1)} pts`}
    </span>
  );
}

function PeriodPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const monthKey = useMemo(() => {
    const entry = Object.entries(CLOSING_MONTH_VALUES).find(([, period]) => period === value);
    return entry?.[0] ?? "mayo";
  }, [value]);

  const label = CLOSING_MONTH_LABELS[monthKey as keyof typeof CLOSING_MONTH_LABELS];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mes de cierre 2026</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {CLOSING_MONTHS.map((m) => {
            const active = m === monthKey;
            return (
              <button
                key={m}
                onClick={() => { onChange(CLOSING_MONTH_VALUES[m]); setOpen(false); }}
                className={`text-xs font-semibold py-2 rounded-md transition-colors cursor-pointer border-none ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground hover:bg-muted"
                }`}
              >
                {CLOSING_MONTH_LABELS[m]}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ──────────────── Hero card (primary metric) ──────────────── */
function HeroCard({
  icon: Icon, value, label, labelCase = "upper", progress, progressBarColor, hint, chip, children,
}: {
  icon: any;
  value: string;
  label: string;
  labelCase?: "upper" | "sentence";
  progress?: number;
  progressBarColor?: string;
  hint?: string;
  chip?: { text: string; color: string; bg: string };
  children?: React.ReactNode;
}) {
  const labelClass = labelCase === "sentence"
    ? "text-[11px] font-semibold text-muted-foreground"
    : "text-[11px] font-normal uppercase tracking-wider text-muted-foreground";
  return (
    <div className="people-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className={labelClass}>{label}</span>
        </div>
        {chip && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: chip.color, background: chip.bg }}
          >
            {chip.text}
          </span>
        )}
      </div>
      <div className="text-[28px] font-medium text-foreground tabular-nums leading-none">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1.5">{hint}</div>}
      {typeof progress === "number" && (
        <div className="mt-3 h-1 rounded-full bg-border/60 overflow-hidden">
          <div
            className="h-full transition-all rounded-full"
            style={{
              width: `${Math.max(0, Math.min(100, progress))}%`,
              background: progressBarColor || progressColor(progress),
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}

/* ──────────────── Compact secondary card ──────────────── */
function SecondaryCard({
  icon: Icon, value, label, progress, progressBarColor, hint,
}: {
  icon: any;
  value: string;
  label: string;
  progress?: number;
  progressBarColor?: string;
  hint?: string;
}) {
  return (
    <div className="people-card">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg font-medium text-foreground tabular-nums leading-none">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      {typeof progress === "number" && (
        <div className="mt-2.5 h-1 rounded-full bg-border/60 overflow-hidden">
          <div
            className="h-full transition-all rounded-full"
            style={{
              width: `${Math.max(0, Math.min(100, progress))}%`,
              background: progressBarColor || progressColor(progress),
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ──────────────── Mini donut for inside Autocalificaciones card ──────────────── */
function MiniDonut({ pct }: { pct: number }) {
  const size = 48;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const dash = (clamped / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={progressColor(clamped)} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 600ms ease, stroke 300ms ease" }}
      />
    </svg>
  );
}

/* ──────────────── Empty donut placeholder ──────────────── */
function EmptyDonut() {
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" className="block shrink-0">
      <circle cx={24} cy={24} r={21.5} fill="none" stroke="hsl(var(--border))" strokeWidth={2} strokeDasharray="3 3" />
    </svg>
  );
}

/* ──────────────── Main component ──────────────── */
export function TeamHealthDashboard({
  areaName,
  periodValue,
  onPeriodChange,
  avgProgress,
  trendDelta,
  totalMembers,
  alerts,
  onAlertClick,
  selfAssessSubmitted,
  selfAssessTotal,
  pendingApprovalCount,
  automationAvgPct,
  automationGoalPct = 40,
  efficiencyHoursWeek,
  efficiencyGoalHours = 5,
  zeroProgressCount,
  atRiskCount,
  inProgressCount,
}: Props) {
  const selfAssessPct = selfAssessTotal > 0 ? (selfAssessSubmitted / selfAssessTotal) * 100 : 0;
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // Group alerts by person (no duplicates)
  const groupedAlerts = useMemo(() => {
    const map = new Map<string, AlertItem["reason"][]>();
    alerts.forEach(a => {
      const list = map.get(a.name) || [];
      if (!list.includes(a.reason)) list.push(a.reason);
      map.set(a.name, list);
    });
    return Array.from(map.entries()).map(([name, reasons]) => ({ name, reasons }));
  }, [alerts]);

  const visibleAlerts = showAllAlerts ? groupedAlerts : groupedAlerts.slice(0, 3);
  const hiddenAlertCount = Math.max(0, groupedAlerts.length - 3);

  // Status pills for inside Autocalificaciones card
  const showDonut = avgProgress > 0;
  const fallbackZero = zeroProgressCount ?? 0;
  const fallbackRisk = atRiskCount ?? 0;
  const fallbackProg = inProgressCount ?? 0;
  const statusPills = [
    { label: "sin iniciar", count: fallbackZero, color: SEMANTIC.red, bg: "rgba(226,75,74,0.10)" },
    { label: "en riesgo", count: fallbackRisk, color: SEMANTIC.orange, bg: "rgba(239,159,39,0.10)" },
    { label: "en progreso", count: fallbackProg, color: SEMANTIC.green, bg: "rgba(99,153,34,0.10)" },
  ].filter(p => p.count > 0);

  // Chips for primary metrics
  const selfAssessChip = selfAssessSubmitted < selfAssessTotal
    ? { text: "Pendiente", color: SEMANTIC.orange, bg: "rgba(239,159,39,0.10)" }
    : { text: "Al día", color: SEMANTIC.green, bg: "rgba(99,153,34,0.10)" };

  const pendingChip = pendingApprovalCount === 0
    ? { text: "Al día", color: SEMANTIC.green, bg: "rgba(99,153,34,0.10)" }
    : { text: "Acción", color: SEMANTIC.orange, bg: "rgba(239,159,39,0.10)" };

  const autoBarColor = progressColor((automationAvgPct / automationGoalPct) * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageTitle
        breadcrumb="MI EQUIPO"
        title={`Avance mensual ${areaName}`}
        subtitle={`Seguimiento de OKRs y automatización · ${totalMembers} ${totalMembers === 1 ? "persona" : "personas"} a cargo`}
        controls={<PeriodPicker value={periodValue} onChange={onPeriodChange} />}
      />

      {/* ─────── ZONA 1 — Alerta accionable (solo si hay) ─────── */}
      {groupedAlerts.length > 0 && (
        <div
          className="rounded-xl p-4 border"
          style={{
            background: "rgba(226,75,74,0.05)",
            borderColor: "rgba(226,75,74,0.20)",
            borderRadius: 12,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: SEMANTIC.red }}>
              <AlertCircle className="h-4 w-4" />
              Requieren atención
            </h3>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: SEMANTIC.red, background: "rgba(226,75,74,0.10)" }}
            >
              {groupedAlerts.length}
            </span>
          </div>

          <ul className="space-y-1.5">
            {visibleAlerts.map((g) => {
              const avatarSrc = avatarMap[g.name];
              const initials = g.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <li
                  key={g.name}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card/60 transition-colors"
                >
                  <button
                    onClick={() => onAlertClick(g.name)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      {avatarSrc && <AvatarImage src={avatarSrc} alt={g.name} />}
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {g.name}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {g.reasons.map(r => {
                          const isCritical = r === "no_checkin";
                          const text = isCritical ? "Sin autocalificación" : "0% avance";
                          return (
                            <span
                              key={r}
                              className="text-[10px] text-muted-foreground"
                            >
                              {text}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.success(`Recordatorio enviado a ${g.name.split(" ")[0]}`);
                    }}
                    className="text-[10px] font-semibold px-2 py-1 rounded-md bg-card hover:bg-muted text-foreground transition-colors cursor-pointer border border-border flex items-center gap-1 shrink-0"
                  >
                    <Bell className="h-3 w-3" />
                    Recordar
                  </button>
                </li>
              );
            })}
          </ul>

          {hiddenAlertCount > 0 && !showAllAlerts && (
            <button
              onClick={() => setShowAllAlerts(true)}
              className="mt-2 text-[11px] font-medium text-foreground hover:text-primary bg-transparent border-none cursor-pointer underline"
            >
              Ver todos ({groupedAlerts.length})
            </button>
          )}
        </div>
      )}

      {/* ─────── ZONA 2 — Cards consolidadas ─────── */}
      <div className="people-metrics-grid">
        {/* Card 1 — Progreso de autocalificaciones (incluye pendientes aprobación + estado equipo) */}
        <HeroCard
          icon={ClipboardCheck}
          value={`${selfAssessSubmitted}/${selfAssessTotal}`}
          label="Autocalificaciones"
          labelCase="sentence"
          progress={selfAssessPct}
          progressBarColor={selfAssessPct >= 80 ? SEMANTIC.green : selfAssessPct >= 40 ? SEMANTIC.orange : SEMANTIC.red}
          hint={`${Math.round(selfAssessPct)}% completadas`}
          chip={selfAssessChip}
        >
          {/* Flujo: enviadas · pendientes aprobación */}
          <div className="mt-3 flex items-center gap-2 text-[11px]">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{selfAssessSubmitted}</span> enviadas
            </span>
            <span className="text-border">·</span>
            {pendingApprovalCount > 0 ? (
              <button
                onClick={() => onAlertClick("")}
                className="bg-transparent border-none p-0 cursor-pointer inline-flex items-center gap-1 text-primary hover:underline"
              >
                <span className="font-semibold tabular-nums">{pendingApprovalCount}</span> pendientes de aprobación
                <span className="text-[10px] font-semibold ml-1">Revisar →</span>
              </button>
            ) : (
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">0</span> pendientes de aprobación
              </span>
            )}
          </div>

          {/* Estado del equipo */}
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-3">
            {showDonut ? <MiniDonut pct={avgProgress} /> : <EmptyDonut />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] text-muted-foreground">Estado del equipo</span>
                <TrendBadge delta={trendDelta} />
              </div>
              {showDonut ? (
                <div className="text-xs font-semibold text-foreground">
                  {Math.round(avgProgress)}% avance promedio
                </div>
              ) : statusPills.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {statusPills.map(p => (
                    <span
                      key={p.label}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: p.bg, color: p.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                      {p.count} {p.label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground">Sin datos este mes</div>
              )}
            </div>
          </div>
        </HeroCard>

        {/* Card 2 — Automatización & eficiencia */}
        <HeroCard
          icon={Bot}
          value={`${Math.round(automationAvgPct)}%`}
          label="Automatización del equipo"
          labelCase="sentence"
          progress={(automationAvgPct / automationGoalPct) * 100}
          progressBarColor={autoBarColor}
          hint={`Objetivo: ${automationGoalPct}%`}
        >
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground tabular-nums">{efficiencyHoursWeek.toFixed(1)}</span> h/sem ahorradas
            </span>
            <span className="text-border">·</span>
            <span>Meta: {efficiencyGoalHours} h/sem</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-border/60 overflow-hidden">
            <div
              className="h-full transition-all rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, (efficiencyHoursWeek / efficiencyGoalHours) * 100))}%`,
                background: progressColor((efficiencyHoursWeek / efficiencyGoalHours) * 100),
              }}
            />
          </div>
        </HeroCard>
      </div>
    </div>
  );
}
