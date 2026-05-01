import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { X } from "lucide-react";

interface SalaryChartProps {
  data: { name: string; value: number }[];
  areaBreakdown?: Record<string, Record<string, number>>;
  onSliceClick?: (answer: string) => void;
  breakdownLabel?: string;
}

const COLORS: Record<string, string> = {
  "Si.": "hsl(152, 60%, 45%)",
  "Parcialmente.": "hsl(40, 90%, 55%)",
  "No.": "hsl(0, 70%, 55%)",
};

const LABELS: Record<string, string> = {
  "Si.": "Sí",
  "Parcialmente.": "Parcialmente",
  "No.": "No",
};

export function SalaryChart({ data, areaBreakdown, onSliceClick, breakdownLabel = "área" }: SalaryChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleClick = (answer: string) => {
    setSelectedAnswer((prev) => (prev === answer ? null : answer));
    onSliceClick?.(answer);
  };

  const breakdown = selectedAnswer && areaBreakdown?.[selectedAnswer]
    ? Object.entries(areaBreakdown[selectedAnswer])
        .sort((a, b) => b[1] - a[1])
    : null;

  const breakdownTotal = breakdown?.reduce((s, [, v]) => s + v, 0) || 0;

  return (
    <div className="card-metric animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">¿Mi remuneración es acorde a mi experiencia, formación académica y responsabilidades?</h3>
      <div className="flex items-center gap-6">
        <div className="h-[180px] w-[180px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                onClick={(_, idx) => handleClick(data[idx].name)}
                style={{ cursor: "pointer" }}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] || "hsl(233, 16%, 70%)"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                  LABELS[name] || name,
                ]}
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(233, 12%, 84%)", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {data.map((d) => (
            <button
              key={d.name}
              onClick={() => handleClick(d.name)}
              className={`flex items-center gap-2 text-sm transition-opacity ${
                selectedAnswer && selectedAnswer !== d.name ? "opacity-40" : "hover:opacity-80"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[d.name] || "hsl(233, 16%, 70%)" }}
              />
              <span className="text-foreground font-medium">{LABELS[d.name] || d.name}</span>
              <span className="text-muted-foreground">
                {d.value} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </button>
          ))}
        </div>
      </div>

      {breakdown && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">
              Respondieron "{LABELS[selectedAnswer!]}" por {breakdownLabel}
            </p>
            <button
              onClick={() => setSelectedAnswer(null)}
              className="p-1 rounded hover:bg-secondary text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {breakdown.map(([area, count]) => (
              <div key={area} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground truncate">{area}</span>
                    <span className="text-muted-foreground ml-2 flex-shrink-0">
                      {count} ({Math.round((count / breakdownTotal) * 100)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / breakdownTotal) * 100}%`,
                        backgroundColor: COLORS[selectedAnswer!] || "hsl(233, 16%, 70%)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}