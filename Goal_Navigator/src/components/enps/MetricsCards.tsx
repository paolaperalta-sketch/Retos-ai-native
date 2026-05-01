import { TrendingUp, TrendingDown, Minus, Users, ThumbsUp, Meh, ThumbsDown, Heart, Star, Clock } from "lucide-react";
import type { MetricsSummary } from "@/lib/enpsData";

interface MetricsCardsProps {
  current: MetricsSummary;
  previous: MetricsSummary | null;
  isOverview?: boolean;
}

function Delta({ current, previous, suffix = "" }: { current: number; previous: number | null; suffix?: string }) {
  if (previous === null) return <span className="text-xs text-muted-foreground">Sin período anterior</span>;
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff === 0) return <span className="text-xs text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" /> Sin cambio</span>;
  const isPositive = diff > 0;
  return (
    <span className={`text-xs flex items-center gap-1 ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{diff}{suffix} vs anterior
    </span>
  );
}

export function MetricsCards({ current, previous, isOverview = false }: MetricsCardsProps) {
  const cards = [
    {
      label: "eNPS Score",
      value: current.enpsScore,
      icon: <Star className="h-5 w-5 text-primary" />,
      delta: <Delta current={current.enpsScore} previous={previous?.enpsScore ?? null} />,
      highlight: true,
    },
    ...(!isOverview ? [{
      label: "Respuestas",
      value: current.totalResponses,
      icon: <Users className="h-5 w-5 text-[hsl(var(--info))]" />,
      delta: <Delta current={current.totalResponses} previous={previous?.totalResponses ?? null} />,
    }] : []),
    {
      label: "Motivación",
      value: `${current.avgMotivation}/10`,
      icon: <Heart className="h-5 w-5 text-destructive" />,
      delta: <Delta current={current.avgMotivation} previous={previous?.avgMotivation ?? null} />,
    },
    {
      label: "Antigüedad Prom.",
      value: current.avgTenure >= 12
        ? `${+(current.avgTenure / 12).toFixed(1)} años`
        : `${current.avgTenure} meses`,
      icon: <Clock className="h-5 w-5 text-primary" />,
      delta: (() => {
        if (previous === null) return <span className="text-xs text-muted-foreground">Sin período anterior</span>;
        const diff = Math.round((current.avgTenure - previous.avgTenure) * 10) / 10;
        if (diff === 0) return <span className="text-xs text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" /> Sin cambio</span>;
        const isPositive = diff > 0;
        return (
          <span className={`text-xs flex items-center gap-1 ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? "+" : ""}{diff >= 12 ? `${+(diff / 12).toFixed(1)} años` : `${diff} meses`} vs anterior
          </span>
        );
      })(),
    },
  ];

  const trafficLight = [
    { label: "Promotores", pct: current.promotersPct, value: current.promotersPct, color: "bg-[hsl(var(--promoter))]", textColor: "text-[hsl(var(--promoter))]", icon: <ThumbsUp className="h-4 w-4" /> },
    { label: "Pasivos", pct: current.passivesPct, value: current.passivesPct, color: "bg-[hsl(var(--passive))]", textColor: "text-[hsl(var(--passive))]", icon: <Meh className="h-4 w-4" /> },
    { label: "Detractores", pct: current.detractorsPct, value: current.detractorsPct, color: "bg-[hsl(var(--detractor))]", textColor: "text-[hsl(var(--detractor))]", icon: <ThumbsDown className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="people-metrics-grid">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`card-metric animate-fade-in ${card.highlight ? "border-primary/30 bg-primary/5" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{card.value}</div>
            {card.delta}
          </div>
        ))}
      </div>

      <div className="card-metric animate-fade-in p-4">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 block">Distribución</span>
        <div className="flex items-center gap-1 h-5 rounded-full overflow-hidden mb-3">
          {trafficLight.map((seg) => (
            <div key={seg.label} className={`${seg.color} h-full transition-all`} style={{ width: `${seg.value}%` }} />
          ))}
        </div>
        <div className="flex items-center justify-between">
          {trafficLight.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5">
              <span className={seg.textColor}>{seg.icon}</span>
              <span className="text-sm font-semibold text-foreground">{seg.value}%</span>
              <span className="text-xs text-muted-foreground">{seg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}