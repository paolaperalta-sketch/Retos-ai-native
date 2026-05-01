import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { Shield, Search, MessageSquare, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight } from "lucide-react";
import type { ENPSRecord } from "@/lib/enpsData";

interface LeadershipAnalysisProps {
  filtered: ENPSRecord[];
  companyData: ENPSRecord[];
  previousFiltered: ENPSRecord[] | null;
  selectedArea: string;
  selectedSubarea: string;
}

const BEHAVIOR_KEYS: { key: keyof ENPSRecord; label: string; short: string }[] = [
  { key: "liderClaroObjetivos", label: "Claridad en Objetivos", short: "Claridad en Objetivos" },
  { key: "liderComunicaPrioridades", label: "Comunica Prioridades", short: "Comunica Prioridades" },
  { key: "liderDaFeedback", label: "Brinda Feedback", short: "Brinda Feedback" },
  { key: "liderIncentivaColaboracion", label: "Incentiva Colaboración", short: "Incentiva Colaboración" },
  { key: "liderDaHerramientas", label: "Brinda Herramientas", short: "Brinda Herramientas" },
  { key: "liderReferenteCultura", label: "Referente de Cultura", short: "Referente de Cultura" },
];

const COLORS = { "Si.": "#22c55e", "Parcialmente.": "#eab308", "No.": "#ef4444" };

function avgField(records: ENPSRecord[], field: "enpsScore" | "motivationScore" | "managerNPS"): number {
  const valid = records.filter(r => r[field] !== null);
  if (valid.length === 0) return 0;
  return +(valid.reduce((s, r) => s + (r[field] as number), 0) / valid.length).toFixed(1);
}

function managerNPSScore(records: ENPSRecord[]): number {
  const valid = records.filter(r => r.managerNPS !== null);
  if (valid.length === 0) return 0;
  const promoters = valid.filter(r => r.managerNPS! >= 9).length;
  const detractors = valid.filter(r => r.managerNPS! <= 6).length;
  return Math.round((promoters / valid.length) * 100 - (detractors / valid.length) * 100);
}

function behaviorBreakdown(records: ENPSRecord[], key: keyof ENPSRecord) {
  let si = 0, parcial = 0, no = 0, total = 0;
  for (const r of records) {
    const val = r[key] as string;
    if (!val) continue;
    total++;
    if (val === "Si.") si++;
    else if (val === "Parcialmente.") parcial++;
    else if (val === "No.") no++;
  }
  if (total === 0) return { si: 0, parcial: 0, no: 0 };
  return {
    si: Math.round((si / total) * 100),
    parcial: Math.round((parcial / total) * 100),
    no: Math.round((no / total) * 100),
  };
}

export function LeadershipAnalysis({ filtered, companyData, previousFiltered, selectedArea, selectedSubarea }: LeadershipAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showComments, setShowComments] = useState(false);
  const isFiltered = selectedArea !== "all" || selectedSubarea !== "all";
  const filterLabel = selectedSubarea !== "all" ? selectedSubarea : selectedArea !== "all" ? selectedArea : "Bia";

  // KPI
  const avgMgrScore = avgField(filtered, "managerNPS");
  const prevAvgMgrScore = previousFiltered ? avgField(previousFiltered, "managerNPS") : null;
  const avgMgrDelta = prevAvgMgrScore !== null ? +(avgMgrScore - prevAvgMgrScore).toFixed(1) : null;

  // Stacked bar data
  const behaviorData = useMemo(() => {
    return BEHAVIOR_KEYS.map(({ key, label, short }) => {
      const b = behaviorBreakdown(filtered, key);
      return { name: short, fullName: label, ...b };
    });
  }, [filtered]);

  // Leadership comments
  const leadershipComments = useMemo(() => {
    return filtered
      .filter(r => r.liderazgoTexto && r.liderazgoTexto !== "Sin comentarios")
      .map(r => ({
        text: r.liderazgoTexto,
        area: r.area,
        subarea: r.subarea,
        managerNPS: r.managerNPS,
        periodo: r.periodo,
      }));
  }, [filtered]);

  const filteredComments = useMemo(() => {
    if (!searchTerm) return leadershipComments;
    const lower = searchTerm.toLowerCase();
    return leadershipComments.filter(c => c.text.toLowerCase().includes(lower));
  }, [leadershipComments, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Análisis de Liderazgo</h2>
          <p className="text-xs text-muted-foreground">Radiografía de conductas de líderes · {filterLabel}</p>
        </div>
      </div>

      {/* KPI Card — only avg score */}
      <div className="rounded-xl border border-border bg-card p-5 max-w-xs">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Score Promedio Líder</p>
        <div className="text-3xl font-bold text-foreground mb-1">{avgMgrScore}<span className="text-sm text-muted-foreground">/10</span></div>
        {avgMgrDelta !== null ? (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${avgMgrDelta > 0 ? "text-green-500" : avgMgrDelta < 0 ? "text-red-500" : "text-muted-foreground"}`}>
            {avgMgrDelta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : avgMgrDelta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {avgMgrDelta > 0 ? "+" : ""}{avgMgrDelta} vs anterior
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin período anterior</span>
        )}
      </div>

      {/* Collapsible: Stacked Horizontal Bar */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Radiografía de Conductas</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={behaviorData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              formatter={(value: number, name: string) => [`${value}%`, name]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="si" stackId="a" name="Sí" fill={COLORS["Si."]} radius={[0, 0, 0, 0]} />
            <Bar dataKey="parcial" stackId="a" name="Parcialmente" fill={COLORS["Parcialmente."]} />
            <Bar dataKey="no" stackId="a" name="No" fill={COLORS["No."]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Collapsible: Leadership Comments */}
      <div className="card-metric animate-fade-in rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setShowComments(!showComments)}
          className="w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer text-left hover:bg-muted/30 transition-colors"
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            El "Sentir" del Equipo sobre Liderazgo ({leadershipComments.length})
          </h3>
          {showComments ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showComments && (
          <div className="px-5 pb-5 animate-fade-in">
            <div className="flex justify-end mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar palabras clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground w-56 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredComments.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {searchTerm ? "No se encontraron comentarios con esa búsqueda." : "No hay comentarios de liderazgo en este filtro."}
                </div>
              ) : (
                filteredComments.map((comment, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border/50 animate-fade-in">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{comment.area}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{comment.subarea}</span>
                      {comment.managerNPS !== null && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          comment.managerNPS >= 9 ? "badge-promoter" :
                          comment.managerNPS >= 7 ? "badge-passive" :
                          "badge-detractor"
                        }`}>
                          {comment.managerNPS}/10
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">{comment.area} · {comment.periodo}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
