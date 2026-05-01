import { useMemo, useState } from "react";
import {
  ChevronDown, ChevronRight, Clock, Users, Target, AlertTriangle,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTeamAutomation, type TeamMemberSummary } from "@/hooks/useTeamAutomation";
import { estadoSemaforo, semaforoConfig } from "@/lib/automation-utils";
import { TeamMemberAutomationTaskCard } from "./TeamMemberAutomationPanel";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export function TeamAutomationView() {
  const { period, members, loading } = useTeamAutomation();
  const [search, setSearch] = useState("");
  const [subareaFilter, setSubareaFilter] = useState<string>("all");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const subareas = useMemo(
    () => Array.from(new Set(members.map((m) => m.subarea).filter(Boolean))) as string[],
    [members],
  );

  const filtered = useMemo(() => {
    return members
      .filter((m) => (search ? m.full_name.toLowerCase().includes(search.toLowerCase()) : true))
      .filter((m) => (subareaFilter === "all" ? true : m.subarea === subareaFilter))
      .filter((m) => {
        if (estadoFilter === "all" || !period) return true;
        const sem = estadoSemaforo(m.pct, period.meta_porcentaje, period.fecha_inicio, period.fecha_fin);
        return sem === estadoFilter;
      })
      .sort((a, b) => b.pct - a.pct);
  }, [members, search, subareaFilter, estadoFilter, period]);

  const totals = useMemo(() => {
    const total = members.reduce((a, m) => a + m.total, 0);
    const validAuto = members.reduce((a, m) => a + m.validAutomatizadas, 0);
    const sinEv = members.reduce((a, m) => a + m.sinEvidencia, 0);
    const horas = members.reduce((a, m) => a + m.horasAhorradas, 0);
    const enRiesgo = period
      ? members.filter(
          (m) =>
            estadoSemaforo(m.pct, period.meta_porcentaje, period.fecha_inicio, period.fecha_fin) ===
            "en_riesgo",
        ).length
      : 0;
    return { total, validAuto, sinEv, horas, enRiesgo, avgPct: total ? (validAuto / total) * 100 : 0 };
  }, [members, period]);

  const burnup = useMemo(() => {
    if (!period || !members.length) return [];
    const allTasks = members.flatMap((m) => m.tasks);
    const start = new Date(period.fecha_inicio).getTime();
    const end = new Date(period.fecha_fin).getTime();
    const totalDays = Math.ceil((end - start) / 86400000) + 1;
    const data: any[] = [];
    const meta = (allTasks.length * (period.meta_porcentaje / 100));
    for (let i = 0; i < totalDays; i++) {
      const day = new Date(start + i * 86400000);
      const automatizadasHasta = allTasks.filter(
        (t) =>
          t.estado === "automatizada" &&
          t.fecha_automatizada &&
          new Date(t.fecha_automatizada).getTime() <= day.getTime() + 86400000,
      ).length;
      const ideal = (i / (totalDays - 1)) * meta;
      const isFuture = day.getTime() > Date.now();
      data.push({
        day: day.toLocaleDateString("es", { day: "2-digit", month: "short" }),
        Real: isFuture ? null : automatizadasHasta,
        Ideal: Number(ideal.toFixed(1)),
      });
    }
    return data;
  }, [period, members]);

  const toggle = (email: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Cargando equipo...</div>;
  if (!period) return <div className="text-sm text-muted-foreground py-8 text-center">Sin periodo activo.</div>;
  if (!members.length) {
    return (
      <Card className="p-8 text-center bg-muted/20 border-dashed">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No tienes personas con tareas asignadas para mostrar.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="people-metrics-grid">
        <KpiCard icon={Target} label="Avance promedio" value={`${totals.avgPct.toFixed(0)}%`} sub={`Meta ${period.meta_porcentaje}%`} />
        <KpiCard icon={CheckCircle2} label="Tareas válidas" value={`${totals.validAuto}/${totals.total}`} sub="con evidencia" />
        <KpiCard icon={AlertCircle} label="Sin evidencia" value={String(totals.sinEv)} sub="bloquean progreso" accent={totals.sinEv > 0} />
        <KpiCard icon={AlertTriangle} label="En riesgo" value={String(totals.enRiesgo)} sub={`de ${members.length}`} accent={totals.enRiesgo > 0} />
      </div>

      {/* Burnup */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Avance del equipo</h3>
          <span className="text-xs text-muted-foreground">Real vs ideal hacia la meta</span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={burnup}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Ideal" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="Real" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar persona..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56"
        />
        <Select value={subareaFilter} onValueChange={setSubareaFilter}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las subáreas</SelectItem>
            {subareas.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="cumpliendo">Cumpliendo</SelectItem>
            <SelectItem value="en_camino">En camino</SelectItem>
            <SelectItem value="en_riesgo">En riesgo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista expandible por persona */}
      <div className="space-y-2">
        {filtered.map((m) => (
          <MemberAccordion
            key={m.email}
            member={m}
            meta={period.meta_porcentaje}
            isOpen={expanded.has(m.email)}
            onToggle={() => toggle(m.email)}
            sem={estadoSemaforo(m.pct, period.meta_porcentaje, period.fecha_inicio, period.fecha_fin)}
          />
        ))}
        {!filtered.length && (
          <div className="p-6 text-center text-sm text-muted-foreground">Sin resultados.</div>
        )}
      </div>
    </div>
  );
}

/* ──────────────── Member accordion ──────────────── */
function MemberAccordion({
  member,
  meta,
  isOpen,
  onToggle,
  sem,
}: {
  member: TeamMemberSummary;
  meta: number;
  isOpen: boolean;
  onToggle: () => void;
  sem: keyof typeof semaforoConfig;
}) {
  const cfg = semaforoConfig[sem];
  const initials = member.full_name.split(" ").slice(0, 2).map((p) => p[0]).join("");
  const pctTowardsGoal = Math.min(100, (member.pct / meta) * 100);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors text-left">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-semibold text-foreground truncate">{member.full_name}</p>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${cfg.bg} ${cfg.text}`}>
                  <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
                {member.subarea && <span className="text-[10px] text-muted-foreground">{member.subarea}</span>}
                {member.sinEvidencia > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    {member.sinEvidencia} sin evidencia
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Progress value={pctTowardsGoal} className="h-1.5 flex-1 max-w-md" />
                <span className="text-xs tabular-nums font-semibold text-foreground w-12 text-right">
                  {member.pct.toFixed(0)}%
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground whitespace-nowrap">
                  {member.validAutomatizadas}/{member.total} · {member.horasAhorradas.toFixed(0)}h/mes
                </span>
              </div>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border/40 bg-muted/5 p-4 space-y-3">
            {member.tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Esta persona no tiene tareas asignadas.
              </p>
            ) : (
              member.tasks.map((t) => (
                <TeamMemberAutomationTaskCard key={t.id} task={t} />
              ))
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }: any) {
  return (
    <Card className={`p-4 ${accent ? "border-amber-500/40 bg-amber-500/5" : ""}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`h-4 w-4 ${accent ? "text-amber-500" : "text-muted-foreground"}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </Card>
  );
}
