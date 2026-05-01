import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Dna } from "lucide-react";
import type { ValoresRecord } from "@/lib/valoresData";
import { filterValores, getValoresCounts } from "@/lib/valoresData";

interface ValoresChartProps {
  data: ValoresRecord[];
  selectedArea: string;
  selectedSubarea: string;
  allowedAreas?: string[] | null;
}

const EXCLUDED_CATEGORY = "Otro / No especificado";

const OFFICIAL_VALUES = [
  "Problem Solver & Problem Seeker",
  "A Team Player",
  "Adaptability",
  "User Centric",
  "Self Management",
];

export function ValoresChart({ data, selectedArea, selectedSubarea, allowedAreas }: ValoresChartProps) {
  const filtered = useMemo(() => filterValores(data, selectedArea, selectedSubarea, allowedAreas), [data, selectedArea, selectedSubarea, allowedAreas]);
  const allCounts = useMemo(() => getValoresCounts(filtered), [filtered]);

  const total = useMemo(() => allCounts.reduce((s, d) => s + d.value, 0), [allCounts]);
  const excludedCount = useMemo(() => allCounts.find((d) => d.name === EXCLUDED_CATEGORY)?.value || 0, [allCounts]);
  const excludedPct = total > 0 ? Math.round((excludedCount / total) * 100) : 0;

  const radarData = useMemo(() => {
    const countMap = Object.fromEntries(allCounts.map((d) => [d.name, d.value]));
    return OFFICIAL_VALUES.map((name) => ({ name, value: countMap[name] || 0 }));
  }, [allCounts]);

  if (allCounts.length === 0) return null;

  return (
    <div className="card-metric animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Dna className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">ADN Bia · Valores</h3>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={radarData} outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
          />
          <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number) => [
              `${value} (${total - excludedCount > 0 ? Math.round((value / (total - excludedCount)) * 100) : 0}%)`,
              "Respuestas",
            ]}
          />
          <Radar
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2">
        Nota: El {excludedPct}% de los colaboradores se identificó con un valor distinto o no especificó un valor oficial de la compañía.
      </p>
    </div>
  );
}