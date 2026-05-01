import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { CategoryScore } from "@/lib/enpsData";

interface CategoryAnalysisProps {
  motivacionCategories: CategoryScore[];
  mejorasCategories: CategoryScore[];
  onCategoryClick?: (type: "valoras" | "mejoras", category: string) => void;
}

const COLORS = [
  "hsl(250, 84%, 55%)",
  "hsl(250, 84%, 65%)",
  "hsl(250, 84%, 72%)",
  "hsl(250, 60%, 78%)",
  "hsl(233, 16%, 70%)",
  "hsl(233, 16%, 80%)",
];

function CategoryChart({
  data,
  title,
  onBarClick,
}: {
  data: CategoryScore[];
  title: string;
  onBarClick?: (category: string) => void;
}) {
  const chartData = data.map((d) => ({
    name: d.category.length > 22 ? d.category.substring(0, 20) + "…" : d.category,
    fullName: d.category,
    value: d.percentage,
    count: d.count,
    avgScore: d.avgScore,
  }));

  return (
    <div className="card-metric animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 20 }}
            onClick={(state) => {
              if (state?.activePayload?.[0]?.payload?.fullName && onBarClick) {
                onBarClick(state.activePayload[0].payload.fullName);
              }
            }}
            style={{ cursor: onBarClick ? "pointer" : undefined }}
          >
            <XAxis type="number" tickFormatter={(v) => `${v}%`} fontSize={11} stroke="hsl(233, 16%, 49%)" />
            <YAxis type="category" dataKey="name" width={140} fontSize={11} stroke="hsl(233, 16%, 49%)" tick={{ fill: "hsl(233, 14%, 25%)" }} />
            <Tooltip
              formatter={(value: number, _name: string, props: any) => [`${value}% (${props.payload.count} resp, score ${props.payload.avgScore})`, props.payload.fullName]}
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(233, 12%, 84%)", fontSize: "12px" }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} className="cursor-pointer" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryAnalysis({ motivacionCategories, mejorasCategories, onCategoryClick }: CategoryAnalysisProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CategoryChart
        data={motivacionCategories}
        title="¿Qué es lo que más valoras?"
        onBarClick={onCategoryClick ? (cat) => onCategoryClick("valoras", cat) : undefined}
      />
      <CategoryChart
        data={mejorasCategories}
        title="Áreas de Mejora"
        onBarClick={onCategoryClick ? (cat) => onCategoryClick("mejoras", cat) : undefined}
      />
    </div>
  );
}