import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Star, Save, Send, CheckCircle2, TrendingUp, AlertTriangle, Percent, Bot, Rocket, Target } from "lucide-react";
import type { PersonalKR } from "@/types/okr";
import { calcWeightedProgress } from "@/lib/okr-utils";
import { mockData } from "@/data/mockData";
import { formatKR } from "@/lib/text-utils";

export type KRRating = "cumplido" | "parcial" | "no_cumplido";

export interface EvaluationData {
  personName: string;
  overallRating: number;
  krRatings: Record<string, KRRating>;
  krCompliance: Record<string, number>;
  aiMindsetScore: number;
  projectDeliveryScore: number;
  comment: string;
}

const krRatingConfig: Record<KRRating, { label: string; color: string; icon: React.ElementType }> = {
  cumplido: { label: "Cumplido", color: "bg-success-bg text-success-foreground", icon: CheckCircle2 },
  parcial: { label: "Parcial", color: "bg-warning-bg text-warning-foreground", icon: TrendingUp },
  no_cumplido: { label: "No cumplido", color: "bg-danger-bg text-danger-foreground", icon: AlertTriangle },
};

function buildKrToCompanyOkr(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const co of mockData) {
    for (const ao of co.areaOkrs) {
      for (const kr of ao.krs) {
        map[kr.id] = co.name;
      }
    }
  }
  return map;
}

const krToCompanyOkr = buildKrToCompanyOkr();

function ScoreBar({ value }: { value: number }) {
  const color = value >= 50 ? "bg-primary" : "bg-warning";
  return (
    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface EvaluationPanelProps {
  personName: string;
  krs: PersonalKR[];
  existingEvaluation?: EvaluationData;
  onSave: (data: EvaluationData) => void;
}

export function EvaluationPanel({ personName, krs, existingEvaluation, onSave }: EvaluationPanelProps) {
  const [overallRating, setOverallRating] = useState(existingEvaluation?.overallRating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [krRatings, setKrRatings] = useState<Record<string, KRRating>>(existingEvaluation?.krRatings ?? {});
  const [krCompliance, setKrCompliance] = useState<Record<string, number>>(existingEvaluation?.krCompliance ?? {});
  const [aiMindsetScore, setAiMindsetScore] = useState(existingEvaluation?.aiMindsetScore ?? 0);
  const [projectDeliveryScore, setProjectDeliveryScore] = useState(existingEvaluation?.projectDeliveryScore ?? 0);
  const [comment, setComment] = useState(existingEvaluation?.comment ?? "");

  const overallProgress = calcWeightedProgress(krs);
  const canSave = overallRating > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ personName, overallRating, krRatings, krCompliance, aiMindsetScore, projectDeliveryScore, comment });
  };

  // Group KRs by company objective
  const groupedKrs: { coName: string; krs: PersonalKR[] }[] = [];
  for (const kr of krs) {
    const coName = krToCompanyOkr[kr.id] || "Otros";
    const existing = groupedKrs.find(g => g.coName === coName);
    if (existing) existing.krs.push(kr);
    else groupedKrs.push({ coName, krs: [kr] });
  }

  const activeRating = hoverRating || overallRating;

  return (
    <div className="space-y-10">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Bia Performance Review</h2>
        <p className="text-sm text-muted-foreground mt-1">{personName}</p>
      </div>

      {/* Holistic Performance Panel — live data */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Score del Líder (Bia Native)
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-muted/40 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">Cumplimiento de KRs</span>
            </div>
            <div className="space-y-1.5">
              <span className="text-2xl font-bold text-foreground">{Math.round(overallProgress)}%</span>
              <ScoreBar value={overallProgress} />
            </div>
            <p className="text-[10px] text-muted-foreground">Ponderado sobre {krs.length} KRs</p>
          </div>

          <div className="rounded-xl bg-muted/40 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">Adopción AI-Mindset</span>
            </div>
            <div className="space-y-1.5">
              <span className="text-2xl font-bold text-foreground">{aiMindsetScore}%</span>
              <ScoreBar value={aiMindsetScore} />
            </div>
            <p className="text-[10px] text-muted-foreground">Cursos, adopción y uso activo</p>
          </div>

          <div className="rounded-xl bg-muted/40 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Rocket className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">Entrega de Proyectos</span>
            </div>
            <div className="space-y-1.5">
              <span className="text-2xl font-bold text-foreground">{projectDeliveryScore}%</span>
              <ScoreBar value={projectDeliveryScore} />
            </div>
            <p className="text-[10px] text-muted-foreground">Proyectos de impacto entregados</p>
          </div>
        </div>
      </div>

      {/* KR-level ratings grouped by company objective */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Evaluación por KR
        </p>
        <div className="space-y-8">
          {groupedKrs.map((group) => (
            <div key={group.coName}>
              <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/8 px-2.5 py-1 rounded mb-3 uppercase tracking-wider">
                {group.coName}
              </span>
              <div className="space-y-4 border-l-2 border-border/50 ml-1 pl-5">
                {group.krs.map(kr => {
                  const currentRating = krRatings[kr.id];
                  return (
                    <div key={kr.id} className="space-y-2">
                      <p className="kr-title text-foreground normal-case" style={{ textTransform: "none" }}>{formatKR(kr.name)}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex gap-1.5 flex-wrap flex-1">
                          {(Object.entries(krRatingConfig) as [KRRating, typeof krRatingConfig[KRRating]][]).map(([key, config]) => {
                            const Icon = config.icon;
                            const isSelected = currentRating === key;
                            return (
                              <button
                                key={key}
                                onClick={() => setKrRatings(prev => ({ ...prev, [kr.id]: key }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                                  isSelected
                                    ? `${config.color} border-transparent`
                                    : "bg-transparent border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30"
                                }`}
                              >
                                <Icon className="h-3 w-3" />
                                {config.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={krCompliance[kr.id] ?? ""}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value)));
                              setKrCompliance(prev => ({ ...prev, [kr.id]: val }));
                            }}
                            placeholder="0"
                            className="w-16 h-8 text-center text-xs font-semibold border-border/60"
                          />
                          <Percent className="h-3.5 w-3.5 text-muted-foreground/60" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluación Bia Native — sliders bound to cards */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-5">
          Evaluación Bia Native
        </p>
        <div className="space-y-6">
          {/* AI-Mindset Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Adopción AI-Mindset</span>
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums">{aiMindsetScore}%</span>
            </div>
            <Slider
              value={[aiMindsetScore]}
              onValueChange={([v]) => setAiMindsetScore(v)}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_.relative>div]:bg-primary"
            />
            <p className="text-[10px] text-muted-foreground">Cursos completados, uso activo de herramientas y mindset de automatización</p>
          </div>

          {/* Project Delivery Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Entrega de Proyectos de Impacto</span>
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums">{projectDeliveryScore}%</span>
            </div>
            <Slider
              value={[projectDeliveryScore]}
              onValueChange={([v]) => setProjectDeliveryScore(v)}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_.relative>div]:bg-primary"
            />
            <p className="text-[10px] text-muted-foreground">Avance promedio de los proyectos estratégicos asignados fuera de KRs estándar</p>
          </div>
        </div>
      </div>

      {/* Star Rating */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Calificación General
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setOverallRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110 bg-transparent border-none cursor-pointer"
            >
              <Star className={`h-8 w-8 transition-all duration-150 ${
                n <= activeRating
                  ? "text-primary fill-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]"
                  : "text-border/60"
              }`} />
            </button>
          ))}
          {overallRating > 0 && (
            <span className="text-lg font-bold text-foreground ml-3">{overallRating}/5</span>
          )}
        </div>
      </div>

      {/* Comments */}
      <div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Escribe tus logros, oportunidades de mejora y alertas aquí..."
          className="min-h-[120px] resize-none bg-transparent border-0 border-b-2 border-border/40 rounded-none text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary/40 px-0"
          maxLength={1000}
        />
        <p className="text-[10px] text-muted-foreground text-right mt-1.5">{comment.length}/1000</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pb-8">
        <span className="text-[11px] text-muted-foreground">
          {!canSave && "Asigna una calificación para continuar"}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
              canSave
                ? "bg-card border-border text-foreground hover:bg-muted/60"
                : "bg-secondary border-transparent text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Save className="h-4 w-4" />
            Guardar Evaluación
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
              canSave
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Send className="h-4 w-4" />
            Publicar Resultados
          </button>
        </div>
      </div>
    </div>
  );
}
