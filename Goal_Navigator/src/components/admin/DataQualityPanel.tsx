import { useState, useMemo } from "react";
import { PageTitle } from "@/components/PageTitle";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, Play, Download, AlertTriangle, XCircle, CheckCircle2, Search, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PERIOD_LABEL = "Mayo 2025";

type RowStatus = "ok" | "partial" | "missing";

interface QARow {
  user_id: string;
  full_name: string;
  email: string;
  area: string | null;
  okrs: number;
  krs: number;
  tasks: number;
  okrsWithoutKrs: number;
  krsWithoutTasks: number;
  issues: string[];
  status: RowStatus;
}

export function DataQualityPanel() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<QARow[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | RowStatus>("all");

  const runValidation = async () => {
    setLoading(true);
    try {
      // Fetch employees (everyone with a profile counts as an employee here)
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, area")
        .order("full_name", { ascending: true });
      if (pErr) throw pErr;

      const userIds = (profiles ?? []).map((p) => p.user_id);
      if (userIds.length === 0) {
        setRows([]);
        setLastRun(new Date());
        return;
      }

      // Pull individual OKRs for these users
      const { data: okrs, error: oErr } = await supabase
        .from("okr_individual")
        .select("id, user_id")
        .in("user_id", userIds);
      if (oErr) throw oErr;

      // Pull KRs (filter by user_id — covers both linked & owned)
      const { data: krs, error: kErr } = await supabase
        .from("key_results")
        .select("id, user_id, okr_id")
        .in("user_id", userIds);
      if (kErr) throw kErr;

      // Pull operational tasks
      const { data: tasks, error: tErr } = await supabase
        .from("operational_tasks")
        .select("id, user_id")
        .in("user_id", userIds);
      if (tErr) throw tErr;

      // Index by user
      const okrsByUser = new Map<string, { id: string }[]>();
      okrs?.forEach((o) => {
        const arr = okrsByUser.get(o.user_id) ?? [];
        arr.push({ id: o.id });
        okrsByUser.set(o.user_id, arr);
      });

      const krsByUser = new Map<string, { id: string; okr_id: string | null }[]>();
      krs?.forEach((k) => {
        if (!k.user_id) return;
        const arr = krsByUser.get(k.user_id) ?? [];
        arr.push({ id: k.id, okr_id: k.okr_id });
        krsByUser.set(k.user_id, arr);
      });

      const tasksByUser = new Map<string, number>();
      tasks?.forEach((t) => {
        if (!t.user_id) return;
        tasksByUser.set(t.user_id, (tasksByUser.get(t.user_id) ?? 0) + 1);
      });

      const out: QARow[] = (profiles ?? []).map((p) => {
        const userOkrs = okrsByUser.get(p.user_id) ?? [];
        const userKrs = krsByUser.get(p.user_id) ?? [];
        const userTasks = tasksByUser.get(p.user_id) ?? 0;

        const issues: string[] = [];
        let okrsWithoutKrs = 0;
        let krsWithoutTasks = 0;

        if (userOkrs.length === 0) {
          issues.push("Sin OKRs asignados");
        } else {
          // OKRs without KRs (KR.okr_id IS NULL doesn't link — must match)
          const okrIdsWithKr = new Set(userKrs.filter((k) => k.okr_id).map((k) => k.okr_id));
          okrsWithoutKrs = userOkrs.filter((o) => !okrIdsWithKr.has(o.id)).length;
          if (okrsWithoutKrs > 0) issues.push(`${okrsWithoutKrs} OKR sin KRs vinculados`);
        }

        if (userKrs.length > 0 && userTasks === 0) {
          issues.push("KR sin tareas asignadas");
          krsWithoutTasks = userKrs.length;
        }

        let status: RowStatus = "ok";
        if (userOkrs.length === 0 && userKrs.length === 0) status = "missing";
        else if (issues.length > 0) status = "partial";

        return {
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          area: p.area,
          okrs: userOkrs.length,
          krs: userKrs.length,
          tasks: userTasks,
          okrsWithoutKrs,
          krsWithoutTasks,
          issues,
          status,
        };
      });

      // Sort: missing → partial → ok, then by name
      const order: Record<RowStatus, number> = { missing: 0, partial: 1, ok: 2 };
      out.sort((a, b) => order[a.status] - order[b.status] || a.full_name.localeCompare(b.full_name));

      setRows(out);
      setLastRun(new Date());
      toast({ title: "Validación completada", description: `${out.length} empleados analizados` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message ?? "No se pudo ejecutar la validación", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const ok = rows.filter((r) => r.status === "ok").length;
    const partial = rows.filter((r) => r.status === "partial").length;
    const missing = rows.filter((r) => r.status === "missing").length;
    return { ok, partial, missing, total: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.full_name.toLowerCase().includes(q) &&
          !r.email.toLowerCase().includes(q) &&
          !(r.area ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [rows, filter, search]);

  const exportCSV = () => {
    const headers = ["Empleado", "Email", "Área", "OKRs", "KRs", "Tareas", "Issues", "Estado"];
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      const row = [
        `"${r.full_name}"`,
        r.email,
        r.area ?? "",
        r.okrs,
        r.krs,
        r.tasks,
        `"${r.issues.join(" | ")}"`,
        r.status,
      ];
      lines.push(row.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qa-okrs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <PageTitle
          breadcrumb="VALIDACIÓN QA"
          title="Control de Calidad — OKRs y KRs"
          subtitle={
            <>
              Periodo: <span className="font-medium text-foreground">{PERIOD_LABEL}</span>
              {lastRun && (
                <span className="ml-2 text-xs">
                  · Última validación: {lastRun.toLocaleString("es-CO")}
                </span>
              )}
            </>
          }
          controls={
            <>
              {rows.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              )}
              <Button onClick={runValidation} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                {loading ? "Ejecutando..." : "Run Validation"}
              </Button>
            </>
          }
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="Configurados correctamente"
            count={summary.ok}
            total={summary.total}
            tone="ok"
            icon={<CheckCircle2 className="h-5 w-5" />}
            active={filter === "ok"}
            onClick={() => setFilter(filter === "ok" ? "all" : "ok")}
          />
          <SummaryCard
            label="Setup incompleto"
            count={summary.partial}
            total={summary.total}
            tone="partial"
            icon={<AlertTriangle className="h-5 w-5" />}
            active={filter === "partial"}
            onClick={() => setFilter(filter === "partial" ? "all" : "partial")}
          />
          <SummaryCard
            label="Sin OKRs ni KRs"
            count={summary.missing}
            total={summary.total}
            tone="missing"
            icon={<XCircle className="h-5 w-5" />}
            active={filter === "missing"}
            onClick={() => setFilter(filter === "missing" ? "all" : "missing")}
          />
        </div>

        {/* Search */}
        {rows.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o área..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {filter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
                Limpiar filtro
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        <Card className="overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                Haz click en <strong>Run Validation</strong> para analizar la configuración de OKRs y KRs de todos los empleados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold">Empleado</th>
                    <th className="px-4 py-3 font-semibold">Área</th>
                    <th className="px-4 py-3 font-semibold text-center">OKRs</th>
                    <th className="px-4 py-3 font-semibold text-center">KRs</th>
                    <th className="px-4 py-3 font-semibold text-center">Tareas</th>
                    <th className="px-4 py-3 font-semibold">Issues</th>
                    <th className="px-4 py-3 font-semibold text-center">Estado</th>
                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.user_id}
                      className={`border-b border-border last:border-0 ${rowBg(r.status)}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{r.full_name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.area ?? "—"}</td>
                      <td className="px-4 py-3 text-center font-mono">{r.okrs}</td>
                      <td className="px-4 py-3 text-center font-mono">{r.krs}</td>
                      <td className="px-4 py-3 text-center font-mono">{r.tasks}</td>
                      <td className="px-4 py-3">
                        {r.issues.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {r.issues.map((iss, i) => (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-[10px] cursor-help">
                                    {iss}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-xs">{iss}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {r.status !== "ok" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                toast({
                                  title: "Asignar OKR",
                                  description: `Funcionalidad de asignación para ${r.full_name} pendiente de configurar.`,
                                })
                              }
                            >
                              Asignar OKR
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/equipo?person=${encodeURIComponent(r.email)}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Ver perfil
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        Sin resultados con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </TooltipProvider>
  );
}

function rowBg(s: RowStatus) {
  if (s === "ok") return "bg-emerald-50/40 dark:bg-emerald-500/5 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10";
  if (s === "partial") return "bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50/80 dark:hover:bg-amber-500/10";
  return "bg-red-50/60 dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/15";
}

function StatusPill({ status }: { status: RowStatus }) {
  if (status === "ok")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-xs font-medium">
        <CheckCircle2 className="h-3 w-3" /> OK
      </span>
    );
  if (status === "partial")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-medium">
        <AlertTriangle className="h-3 w-3" /> Parcial
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-400 px-2 py-0.5 text-xs font-medium">
      <XCircle className="h-3 w-3" /> Sin configurar
    </span>
  );
}

function SummaryCard({
  label,
  count,
  total,
  tone,
  icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  total: number;
  tone: RowStatus;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  const tones: Record<RowStatus, string> = {
    ok: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
    partial: "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400",
    missing: "border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-400",
  };
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-lg border-2 transition-all ${tones[tone]} ${
        active ? "ring-2 ring-offset-2 ring-offset-background ring-current scale-[1.01]" : "opacity-90 hover:opacity-100"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{count}</span>
        <span className="text-sm opacity-70">/ {total}</span>
      </div>
      <div className="text-xs opacity-70 mt-1">{pct}% del total</div>
    </button>
  );
}
