import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CHECKIN_QUESTIONS } from "@/lib/probation-utils";
import { toast } from "@/hooks/use-toast";
import { ClipboardCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface CheckinFormProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
  evaluationType: "checkin" | "final";
  onSubmitted: () => void;
}

const RATING_OPTIONS = ["Sí, completamente", "Parcialmente", "No"];

export function CheckinForm({ open, onClose, targetUserId, targetName, evaluationType, onSubmitted }: CheckinFormProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [passedProbation, setPassedProbation] = useState<boolean | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const isFinal = evaluationType === "final";
  const allAnswered = CHECKIN_QUESTIONS.every((_, i) => answers[i]);
  const canSubmit = allAnswered && (!isFinal || passedProbation !== null);

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSaving(true);

    const { error } = await supabase.from("probation_evaluations").upsert({
      user_id: targetUserId,
      evaluator_id: user.id,
      evaluation_type: evaluationType,
      responses: answers,
      passed_probation: isFinal ? passedProbation : null,
      notes: notes.trim() || null,
      submitted_at: new Date().toISOString(),
    }, { onConflict: "user_id,evaluation_type" });

    setSaving(false);

    if (error) {
      toast({ title: "Error al guardar evaluación", variant: "destructive" });
      return;
    }

    toast({
      title: isFinal
        ? (passedProbation ? "¡Periodo de prueba superado! 🎉" : "Evaluación registrada")
        : "Check-in de Adaptación completado ✅",
    });

    onSubmitted();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {isFinal ? "Evaluación Final de Periodo de Prueba" : "Check-in de Adaptación (Mes 1)"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Evaluando a <strong>{targetName}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {CHECKIN_QUESTIONS.map((q, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-foreground mb-2">{i + 1}. {q}</p>
              <div className="flex gap-2">
                {RATING_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAnswers(prev => ({ ...prev, [i]: opt }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      answers[i] === opt
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {isFinal && (
            <div className="rounded-xl border-2 border-warning/50 bg-warning-bg/30 p-4">
              <p className="text-sm font-semibold text-foreground mb-3">
                ¿Supera el periodo de prueba?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPassedProbation(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                    passedProbation === true
                      ? "bg-success text-primary-foreground border-success"
                      : "bg-card text-foreground border-border hover:border-success/50"
                  }`}
                >
                  ✅ SÍ
                </button>
                <button
                  onClick={() => setPassedProbation(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                    passedProbation === false
                      ? "bg-danger text-primary-foreground border-danger"
                      : "bg-card text-foreground border-border hover:border-danger/50"
                  }`}
                >
                  ❌ NO
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground">Observaciones</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Comentarios adicionales..."
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-none cursor-pointer disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Enviar Evaluación"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
