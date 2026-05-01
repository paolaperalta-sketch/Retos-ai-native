// Motor de cálculo y tipos para Evaluación 360° de Desempeño

export type ProfileType = "individual" | "leader";
export type EvaluatorRole = "self" | "leader" | "team" | "stakeholder";
export type AppliesTo = "both" | "individual" | "leader";

export type Classification =
  | "Top Talent"
  | "Solid Performer"
  | "Inconsistent Performer"
  | "Low Performer";

export const RATING_SCALE = [
  { value: 1, label: "No se observa", description: "El comportamiento no es visible en el trabajo diario." },
  { value: 2, label: "En desarrollo", description: "Se evidencia de forma inconsistente o parcial." },
  { value: 3, label: "Cumple", description: "Se demuestra de forma consistente y esperada." },
  { value: 4, label: "Referente", description: "Supera el estándar y es un modelo para otros." },
] as const;

export const EVALUATOR_ROLE_LABEL: Record<EvaluatorRole, string> = {
  self: "Auto",
  leader: "Líder",
  team: "Equipo",
  stakeholder: "Stakeholder",
};

export interface Dimension {
  id: string;
  code: string;
  name: string;
  description: string | null;
  weight_individual: number;
  weight_leader: number;
  applies_to: AppliesTo;
  sort_order: number;
}

export interface ReviewItem {
  id: string;
  dimension_id: string;
  code: string;
  question: string;
  applies_to: AppliesTo;
  is_scored: boolean;
  sort_order: number;
}

export interface WeightRow {
  profile_type: ProfileType;
  dimension_code: string;
  evaluator_role: EvaluatorRole;
  weight: number;
}

export interface ResponseRow {
  item_id: string;
  score: number | null;
  evidence: string | null;
  evaluator_role: EvaluatorRole;
}

export function classify(score: number): Classification {
  if (score >= 3.5) return "Top Talent";
  if (score >= 2.5) return "Solid Performer";
  if (score >= 1.5) return "Inconsistent Performer";
  return "Low Performer";
}

export function classificationEmoji(c: Classification): string {
  switch (c) {
    case "Top Talent": return "🌟";
    case "Solid Performer": return "✅";
    case "Inconsistent Performer": return "⚠️";
    case "Low Performer": return "🛑";
  }
}

export function classificationColor(c: Classification): string {
  switch (c) {
    case "Top Talent":
      return "bg-success-bg text-success-foreground border-success/30";
    case "Solid Performer":
      return "bg-primary/10 text-primary border-primary/30";
    case "Inconsistent Performer":
      return "bg-warning-bg text-warning-foreground border-warning/30";
    case "Low Performer":
      return "bg-danger-bg text-danger-foreground border-danger/30";
  }
}

export function classificationDescription(c: Classification): string {
  switch (c) {
    case "Top Talent":
      return "Referente de excelencia e impacto organizacional.";
    case "Solid Performer":
      return "Cumplimiento consistente de lo esperado.";
    case "Inconsistent Performer":
      return "Desempeño parcial o inconsistente.";
    case "Low Performer":
      return "Desempeño por debajo del estándar.";
  }
}

export const EVALUATOR_COLOR: Record<EvaluatorRole, string> = {
  self: "hsl(var(--primary))",
  leader: "hsl(217 91% 60%)",
  team: "hsl(160 84% 39%)",
  stakeholder: "hsl(38 92% 50%)",
};

export interface DimensionScore {
  dimensionCode: string;
  dimensionName: string;
  weight: number;
  score: number;
  byEvaluator: { role: EvaluatorRole; avg: number; weight: number; count: number }[];
}

/**
 * Calcula el score final ponderado a partir de respuestas, items, dimensiones y matriz de pesos.
 * 1) Promedia respuestas por evaluador dentro de cada dimensión (solo items con is_scored).
 * 2) Pondera promedios por la matriz weights[profile][dim][role].
 * 3) Pondera dimensiones por su peso global → score 1.00–4.00.
 */
export function computeFinalScore(params: {
  profileType: ProfileType;
  dimensions: Dimension[];
  items: ReviewItem[];
  weights: WeightRow[];
  responses: ResponseRow[];
}): { totalScore: number; classification: Classification; dimensionScores: DimensionScore[] } {
  const { profileType, dimensions, items, weights, responses } = params;

  const itemsById = new Map(items.map((i) => [i.id, i]));
  const dimWeight = (d: Dimension) =>
    profileType === "leader" ? d.weight_leader : d.weight_individual;

  const visibleDims = dimensions.filter(
    (d) => dimWeight(d) > 0 && (d.applies_to === "both" || d.applies_to === profileType),
  );

  const dimensionScores: DimensionScore[] = [];
  let totalWeighted = 0;
  let totalWeightUsed = 0;

  for (const d of visibleDims) {
    // group responses by evaluator role for this dimension
    const dimItems = items.filter((i) => i.dimension_id === d.id && i.is_scored);
    const dimItemIds = new Set(dimItems.map((i) => i.id));

    const byRole = new Map<EvaluatorRole, number[]>();
    for (const r of responses) {
      if (!dimItemIds.has(r.item_id)) continue;
      if (r.score == null) continue;
      const item = itemsById.get(r.item_id);
      if (!item || !item.is_scored) continue;
      const list = byRole.get(r.evaluator_role) ?? [];
      list.push(r.score);
      byRole.set(r.evaluator_role, list);
    }

    const dimWeights = weights.filter(
      (w) => w.profile_type === profileType && w.dimension_code === d.code,
    );

    const byEvaluator: DimensionScore["byEvaluator"] = [];
    let dimNumer = 0;
    let dimDenom = 0;
    for (const w of dimWeights) {
      const scores = byRole.get(w.evaluator_role) ?? [];
      if (scores.length === 0) continue;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      byEvaluator.push({ role: w.evaluator_role, avg, weight: w.weight, count: scores.length });
      dimNumer += avg * w.weight;
      dimDenom += w.weight;
    }

    const dimScore = dimDenom > 0 ? dimNumer / dimDenom : 0;
    const dw = dimWeight(d);
    dimensionScores.push({
      dimensionCode: d.code,
      dimensionName: d.name,
      weight: dw,
      score: dimScore,
      byEvaluator,
    });
    if (dimScore > 0) {
      totalWeighted += dimScore * dw;
      totalWeightUsed += dw;
    }
  }

  const totalScore = totalWeightUsed > 0 ? totalWeighted / totalWeightUsed : 0;
  return {
    totalScore: Math.round(totalScore * 100) / 100,
    classification: classify(totalScore),
    dimensionScores,
  };
}
