import { Award, TrendingUp, Users, Target, Wrench } from "lucide-react";
import {
  classificationColor,
  classificationDescription,
  classificationEmoji,
  EVALUATOR_COLOR,
  EVALUATOR_ROLE_LABEL,
  type DimensionScore,
  type Classification,
  type ProfileType,
} from "@/lib/review-utils";

interface Props {
  evaluatedName: string;
  profileType: ProfileType;
  totalScore: number;
  classification: Classification;
  dimensionScores: DimensionScore[];
  evidences?: { itemCode: string; question: string; evidence: string; evaluator: string }[];
}

const dimIcon = (code: string) => {
  switch (code) {
    case "ai_mindset":
      return TrendingUp;
    case "culture":
      return Users;
    case "leadership":
      return Award;
    case "performance":
      return Target;
    case "competencies":
      return Wrench;
    default:
      return Target;
  }
};

export function ResultBreakdown({
  evaluatedName,
  profileType,
  totalScore,
  classification,
  dimensionScores,
  evidences = [],
}: Props) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Resultado consolidado · 360°
            </p>
            <h2 className="text-2xl font-bold text-foreground mt-1">{evaluatedName}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Perfil: {profileType === "leader" ? "Líder" : "Contribuidor Individual"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-foreground tabular-nums">
              {totalScore.toFixed(2)}
              <span className="text-base text-muted-foreground font-medium ml-1">/4.00</span>
            </div>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${classificationColor(
                classification,
              )}`}
            >
              <span className="text-sm leading-none">{classificationEmoji(classification)}</span>
              {classification}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1.5 max-w-xs">
              {classificationDescription(classification)}
            </p>
          </div>
        </div>
      </div>

      {/* Dimension breakdown */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Desglose por dimensión
        </p>
        <div className="space-y-4">
          {dimensionScores.map((d) => {
            const Icon = dimIcon(d.dimensionCode);
            const pct = (d.score / 4) * 100;
            return (
              <div key={d.dimensionCode} className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{d.dimensionName}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Peso global {Math.round(d.weight * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-foreground tabular-nums">
                      {d.score.toFixed(2)}
                    </div>
                    <p className="text-[10px] text-muted-foreground">/4.00</p>
                  </div>
                </div>
                {/* Score bar */}
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-4">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Gráfico de Aportes — barra apilada por evaluador */}
                {d.byEvaluator.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Aporte por evaluador
                      </p>
                      <p className="text-[10px] text-muted-foreground">% del peso final</p>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden flex bg-muted/50">
                      {d.byEvaluator.map((e) => (
                        <div
                          key={e.role}
                          title={`${EVALUATOR_ROLE_LABEL[e.role]} · nota ${e.avg.toFixed(2)} · peso ${Math.round(e.weight * 100)}%`}
                          style={{ width: `${e.weight * 100}%`, backgroundColor: EVALUATOR_COLOR[e.role] }}
                          className="transition-all hover:opacity-80"
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
                      {d.byEvaluator.map((e) => (
                        <div key={e.role} className="flex items-center gap-1.5 text-[10px]">
                          <span
                            className="h-2 w-2 rounded-sm shrink-0"
                            style={{ backgroundColor: EVALUATOR_COLOR[e.role] }}
                          />
                          <span className="font-semibold text-foreground">
                            {EVALUATOR_ROLE_LABEL[e.role]}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {e.avg.toFixed(2)} · {Math.round(e.weight * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">
                    Sin respuestas registradas
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidences for nivel 4 */}
      {evidences.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Evidencias de nivel Referente (4)
          </p>
          <div className="space-y-3">
            {evidences.map((ev, idx) => (
              <div key={idx} className="rounded-xl border border-success/30 bg-success-bg/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {ev.itemCode}
                  </span>
                  <span className="text-[10px] text-muted-foreground">por {ev.evaluator}</span>
                </div>
                <p className="text-xs font-medium text-foreground mb-1">{ev.question}</p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">"{ev.evidence}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
