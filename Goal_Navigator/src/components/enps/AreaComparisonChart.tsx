import { useMemo, useState } from "react";
import { Table, TrendingUp, TrendingDown, Minus, ArrowUpDown } from "lucide-react";
import type { ENPSRecord } from "@/lib/enpsData";
import { getAreas, calculateMetrics, getPeriods } from "@/lib/enpsData";

interface AreaComparisonChartProps {
  data: ENPSRecord[];
  allowedAreas?: string[] | null;
}

type SortKey = "area" | "trend" | string;

function extractYear(periodo: string): string {
  const match = periodo.match(/\d{4}/);
  return match ? match[0] : "";
}

export function AreaComparisonChart({ data, allowedAreas }: AreaComparisonChartProps) {
  const [sortKey, setSortKey] = useState<SortKey>("__last");
  const [sortAsc, setSortAsc] = useState(false);

  const periods = useMemo(() => getPeriods(data), [data]);

  const yearGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of periods) {
      const year = extractYear(p);
      if (!year) continue;
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [periods]);

  const tableData = useMemo(() => {
    let areas = getAreas(data);
    if (allowedAreas) areas = areas.filter((a) => allowedAreas.includes(a));

    return areas.map((area) => {
      const scores: Record<string, number | null> = {};
      let trend: number | null = null;

      for (const p of periods) {
        const records = data.filter((r) => r.area === area && r.periodo === p);
        scores[p] = records.length === 0 ? null : calculateMetrics(records).enpsScore;
      }

      const values = periods.map((p) => scores[p]).filter((v): v is number => v !== null);
      if (values.length >= 2) {
        trend = Math.round((values[values.length - 1] - values[values.length - 2]) * 10) / 10;
      }

      return { area, scores, trend };
    });
  }, [data, allowedAreas, periods]);

  const sorted = useMemo(() => {
    const key = sortKey === "__last" ? periods[periods.length - 1] : sortKey;
    return [...tableData].sort((a, b) => {
      if (key === "area") {
        return sortAsc ? a.area.localeCompare(b.area) : b.area.localeCompare(a.area);
      }
      const va = key === "trend" ? a.trend : a.scores[key] ?? null;
      const vb = key === "trend" ? b.trend : b.scores[key] ?? null;
      const na = va ?? -Infinity;
      const nb = vb ?? -Infinity;
      return sortAsc ? na - nb : nb - na;
    });
  }, [tableData, sortKey, sortAsc, periods]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  if (tableData.length === 0) return null;

  const lastPeriod = periods[periods.length - 1];

  return (
    <div className="card-metric animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Table className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Comparativa eNPS por Área</h3>
      </div>
      <div className="overflow-auto max-h-[420px] rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr className="border-b border-border">
              <th rowSpan={2} className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("area")}>
                <span className="flex items-center gap-1">Área <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              {yearGroups.map(([year, ps]) => (
                <th key={year} colSpan={ps.length} className="text-center px-2 py-2 font-semibold text-foreground border-l border-border">
                  {year}
                </th>
              ))}
              <th rowSpan={2} className="text-center px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors border-l border-border" onClick={() => handleSort("trend")}>
                <span className="flex items-center justify-center gap-1">Δ <ArrowUpDown className="h-3 w-3" /></span>
              </th>
            </tr>
            <tr className="border-b border-border">
              {yearGroups.map(([year, ps]) =>
                ps.map((p, idx) => (
                  <th
                    key={p}
                    className={`text-center px-3 py-2 font-medium cursor-pointer hover:text-foreground transition-colors ${
                      p === lastPeriod ? "text-foreground" : "text-muted-foreground"
                    } ${idx === 0 ? "border-l border-border" : ""}`}
                    onClick={() => handleSort(p)}
                  >
                    <span className="flex items-center justify-center gap-1">
                      {p.replace(/\s*\d{4}/, "")} <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.area} className={`border-t border-border transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{row.area}</td>
                {yearGroups.map(([year, ps]) =>
                  ps.map((p, idx) => {
                    const val = row.scores[p] ?? null;
                    return (
                      <td
                        key={p}
                        className={`text-center px-3 py-3 tabular-nums ${
                          p === lastPeriod ? "font-semibold text-foreground" : "text-muted-foreground"
                        } ${idx === 0 ? "border-l border-border" : ""}`}
                      >
                        {val !== null ? val : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    );
                  })
                )}
                <td className="text-center px-4 py-3 border-l border-border">
                  <TrendBadge value={row.trend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground/40">—</span>;

  const isPositive = value > 0;
  const isNeutral = value === 0;
  const colorClass = isNeutral
    ? "text-muted-foreground bg-muted"
    : isPositive
    ? "text-[hsl(var(--promoter))] bg-[hsl(var(--promoter)/0.1)]"
    : "text-[hsl(var(--detractor))] bg-[hsl(var(--detractor)/0.1)]";
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {isPositive ? "+" : ""}{value}
    </span>
  );
}