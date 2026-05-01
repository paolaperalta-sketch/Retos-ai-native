import { useMemo, useState } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line } from "recharts";
import { BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ENPSRecord } from "@/lib/enpsData";
import { getAreas, calculateMetrics } from "@/lib/enpsData";

interface NpsMotivationChartProps {
  data: ENPSRecord[];
  allowedAreas?: string[] | null;
  selectedArea?: string;
  selectedSubarea?: string;
}

interface Row {
  label: string;
  nps: number;
  motivation: number | null;
  hasChildren: boolean;
}

function buildRows(records: ENPSRecord[], groupKey: "area" | "subarea", labels: string[], data: ENPSRecord[]): Row[] {
  return labels
    .map((label) => {
      const subset = records.filter((r) => r[groupKey] === label);
      if (subset.length === 0) return null;
      const m = calculateMetrics(subset);
      const motivRecs = subset.filter((r) => r.motivationScore !== null);
      const motivation =
        motivRecs.length > 0
          ? Math.round(
              (motivRecs.reduce((s, r) => s + (r.motivationScore ?? 0), 0) / motivRecs.length) * 10
            ) / 10
          : null;

      // Only meaningful for area-level rows
      const hasChildren =
        groupKey === "area"
          ? new Set(
              data
                .filter((r) => r.area === label && r.subarea && r.subarea.trim() !== "")
                .map((r) => r.subarea)
            ).size > 1
          : false;

      return { label, nps: m.enpsScore, motivation, hasChildren };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.nps ?? -Infinity) - (a!.nps ?? -Infinity)) as Row[];
}

export function NpsMotivationChart({ data, allowedAreas, selectedArea, selectedSubarea }: NpsMotivationChartProps) {
  const [manualDrillArea, setManualDrillArea] = useState<string | null>(null);

  // Filter-driven drill: if user selected a specific area (and no subarea), show subareas
  const filterDrillArea =
    selectedArea && selectedArea !== "all" && (!selectedSubarea || selectedSubarea === "all")
      ? selectedArea
      : null;

  const drillArea = filterDrillArea ?? manualDrillArea;
  const isFilterDriven = !!filterDrillArea;

  const chartRows = useMemo(() => {
    if (drillArea) {
      const records = data.filter((r) => r.area === drillArea);
      const subareas = Array.from(
        new Set(records.map((r) => r.subarea).filter((s) => s && s.trim() !== ""))
      ).sort();
      return buildRows(records, "subarea", subareas, data);
    }
    let areas = getAreas(data);
    if (allowedAreas) areas = areas.filter((a) => allowedAreas.includes(a));
    return buildRows(data, "area", areas, data);
  }, [data, allowedAreas, drillArea]);

  if (chartRows.length === 0) {
    return null;
  }

  const handleBarClick = (payload: any) => {
    if (drillArea) return;
    const row = payload?.activePayload?.[0]?.payload as Row | undefined;
    if (row?.hasChildren) setManualDrillArea(row.label);
  };

  return (
    <div className="card-metric animate-fade-in">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {drillArea ? `NPS vs Motivación · ${drillArea}` : "NPS vs Motivación por Área"}
          </h3>
        </div>
        {drillArea && !isFilterDriven && (
          <Button variant="outline" size="sm" onClick={() => setManualDrillArea(null)} className="gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a vista general
          </Button>
        )}
      </div>
      {!drillArea && (
        <p className="text-xs text-muted-foreground mb-2">
          Haz clic en una barra para ver el desglose por subárea.
        </p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartRows}
          margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
          onClick={handleBarClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            yAxisId="nps"
            orientation="left"
            domain={[-100, 100]}
            tick={{ fill: "hsl(var(--primary))", fontSize: 12 }}
            label={{ value: "eNPS", angle: -90, position: "insideLeft", fill: "hsl(var(--primary))", fontSize: 12 }}
          />
          <YAxis
            yAxisId="motivation"
            orientation="right"
            domain={[0, 10]}
            tick={{ fill: "hsl(var(--accent-foreground))", fontSize: 12 }}
            label={{ value: "Motivación", angle: 90, position: "insideRight", fill: "hsl(var(--accent-foreground))", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number, name: string) => [
              value,
              name === "motivation" ? "Motivación" : "eNPS",
            ]}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          <Legend
            formatter={(value) => (value === "motivation" ? "Motivación" : "eNPS")}
            wrapperStyle={{ fontSize: 13 }}
          />
          <Bar
            yAxisId="nps"
            dataKey="nps"
            fill="hsl(var(--primary) / 0.55)"
            radius={[4, 4, 0, 0]}
            barSize={40}
            cursor={drillArea ? "default" : "pointer"}
          />
          <Line
            yAxisId="motivation"
            type="monotone"
            dataKey="motivation"
            stroke="hsl(var(--promoter))"
            strokeWidth={2.5}
            dot={{ fill: "hsl(var(--promoter))", r: 4, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
