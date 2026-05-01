import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, Save, Send, Sparkles } from "lucide-react";
import { RatingScale } from "./RatingScale";
import { useReviewCatalog } from "@/hooks/useReviewCatalog";
import type { EvaluatorRole, ProfileType, ReviewItem } from "@/lib/review-utils";
import { EVALUATOR_ROLE_LABEL } from "@/lib/review-utils";

interface ItemAnswer {
  score: number | null;
  evidence: string;
}

interface Props {
  evaluatedName: string;
  profileType: ProfileType;
  evaluatorRole: EvaluatorRole;
  initial?: Record<string, ItemAnswer>;
  onSave: (
    answers: Record<string, ItemAnswer>,
    submit: boolean,
  ) => Promise<void> | void;
}

export function ReviewForm({
  evaluatedName,
  profileType,
  evaluatorRole,
  initial,
  onSave,
}: Props) {
  const { dimensions, items, loading } = useReviewCatalog();
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const visibleItems = useMemo<ReviewItem[]>(() => {
    return items.filter((i) => i.applies_to === "both" || i.applies_to === profileType);
  }, [items, profileType]);

  const dimensionsWithItems = useMemo(() => {
    return dimensions
      .filter((d) => d.applies_to === "both" || d.applies_to === profileType)
      .map((d) => ({
        ...d,
        items: visibleItems.filter((i) => i.dimension_id === d.id),
      }))
      .filter((d) => d.items.length > 0);
  }, [dimensions, visibleItems, profileType]);

  const update = (itemId: string, patch: Partial<ItemAnswer>) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: { score: null, evidence: "", ...prev[itemId], ...patch },
    }));
  };

  const validate = (forSubmit: boolean): string[] => {
    const errs: string[] = [];
    for (const item of visibleItems) {
      const a = answers[item.id];
      if (forSubmit && item.is_scored && (!a || a.score == null)) {
        errs.push(`Falta calificar: ${item.code}`);
        continue;
      }
      if (a?.score === 4 && (!a.evidence || a.evidence.trim().length < 10)) {
        errs.push(`Evidencia obligatoria (≥10 caracteres) en ${item.code}`);
      }
      if (forSubmit && !item.is_scored) {
        // Fueguito requiere texto aunque no tenga peso
        if (!a?.evidence || a.evidence.trim().length < 5) {
          errs.push(`Comentario obligatorio en ${item.code}`);
        }
      }
    }
    return errs;
  };

  const handleSave = async (submit: boolean) => {
    const errs = validate(submit);
    setErrors(errs);
    if (errs.length > 0) return;
    setSaving(true);
    try {
      await onSave(answers, submit);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Cargando cuestionario…</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Evaluación 360° · {EVALUATOR_ROLE_LABEL[evaluatorRole]}
          </p>
          <h2 className="text-xl font-bold text-foreground mt-1">{evaluatedName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Perfil: {profileType === "leader" ? "Líder" : "Contribuidor Individual"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Escala 1–4 · Evidencia obligatoria en nivel 4
        </div>
      </header>

      {dimensionsWithItems.map((d) => {
        const dWeight = profileType === "leader" ? d.weight_leader : d.weight_individual;
        return (
          <section key={d.id} className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
              <div>
                <h3 className="text-sm font-bold text-foreground">{d.name}</h3>
                {d.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{d.description}</p>
                )}
              </div>
              {dWeight > 0 && (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Peso {Math.round(dWeight * 100)}%
                </span>
              )}
            </div>
            <div className="space-y-5">
              {d.items.map((item) => {
                const a = answers[item.id] ?? { score: null, evidence: "" };
                const needsEvidence = a.score === 4 || !item.is_scored;
                return (
                  <div key={item.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0 mt-0.5">
                        {item.code}
                      </span>
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {item.question}
                      </p>
                    </div>
                    {item.is_scored && (
                      <RatingScale
                        value={a.score}
                        onChange={(v) => update(item.id, { score: v })}
                      />
                    )}
                    {needsEvidence && (
                      <div>
                        <label className="text-[11px] font-semibold text-foreground block mb-1.5">
                          {a.score === 4 ? "Evidencia (obligatoria para nivel Referente)" : "Comentario obligatorio"}
                        </label>
                        <Textarea
                          value={a.evidence}
                          onChange={(e) => update(item.id, { evidence: e.target.value })}
                          placeholder="Describe el comportamiento observado con un ejemplo concreto…"
                          className="min-h-[72px] text-sm"
                          maxLength={500}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {errors.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger-bg/40 p-3 space-y-1">
          <div className="flex items-center gap-2 text-danger-foreground font-semibold text-xs">
            <AlertCircle className="h-3.5 w-3.5" />
            Faltan campos por completar
          </div>
          <ul className="list-disc pl-5 text-[11px] text-danger-foreground/90">
            {errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
            {errors.length > 8 && <li>…y {errors.length - 8} más</li>}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Guardar borrador
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving}>
          <Send className="h-4 w-4 mr-2" />
          Enviar evaluación
        </Button>
      </div>
    </div>
  );
}
