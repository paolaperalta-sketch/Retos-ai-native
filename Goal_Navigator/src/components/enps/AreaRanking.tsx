import { Trophy } from "lucide-react";
import type { ENPSRecord } from "@/lib/enpsData";
import { calculateMetrics } from "@/lib/enpsData";

interface AreaRankingProps {
  data: ENPSRecord[];
  selectedPeriod: string;
  selectedArea: string;
}

interface AreaRankData {
  area: string;
  enps: number;
  promotersPct: number;
  detractorsPct: number;
  responses: number;
  avgMotivation: number;
}

function getMedalColor(rank: number): string {
  if (rank === 0) return "text-[hsl(40,96%,50%)]";
  if (rank === 1) return "text-muted-foreground";
  if (rank === 2) return "text-[hsl(25,60%,45%)]";
  return "text-muted-foreground";
}

function getEnpsBadge(enps: number) {
  if (enps >= 50) return "badge-promoter";
  if (enps >= 0) return "badge-passive";
  return "badge-detractor";
}

export function AreaRanking({ data, selectedPeriod, selectedArea }: AreaRankingProps) {
  if (selectedArea !== "all" || selectedPeriod === "all") return null;

  const periodData = data.filter((r) => r.periodo === selectedPeriod);
  const areas = [...new Set(periodData.map((r) => r.area).filter(Boolean))].sort();

  const rankings: AreaRankData[] = areas
    .map((area) => {
      const areaRecords = periodData.filter((r) => r.area === area);
      const metrics = calculateMetrics(areaRecords);
      return {
        area,
        enps: metrics.enpsScore,
        promotersPct: metrics.promotersPct,
        detractorsPct: metrics.detractorsPct,
        responses: metrics.totalResponses,
        avgMotivation: metrics.avgMotivation,
      };
    })
    .sort((a, b) => b.enps - a.enps);

  if (rankings.length === 0) return null;

  return (
    <div className="card-metric animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-[hsl(40,96%,50%)]" />
        <h3 className="text-lg font-semibold text-foreground">Ranking por Área — {selectedPeriod}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">#</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">Área</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">eNPS</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Promotores</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Detractores</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Motivación</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Respuestas</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={r.area} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-2.5 px-2">
                  <span className={`font-bold ${getMedalColor(i)}`}>
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </span>
                </td>
                <td className="py-2.5 px-2 font-medium text-foreground">{r.area}</td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`${getEnpsBadge(r.enps)} inline-block min-w-[3rem]`}>{r.enps}</span>
                </td>
                <td className="py-2.5 px-2 text-center text-[hsl(var(--promoter))]">{r.promotersPct}%</td>
                <td className="py-2.5 px-2 text-center text-[hsl(var(--detractor))]">{r.detractorsPct}%</td>
                <td className="py-2.5 px-2 text-center text-foreground">{r.avgMotivation}/10</td>
                <td className="py-2.5 px-2 text-center text-muted-foreground">{r.responses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}