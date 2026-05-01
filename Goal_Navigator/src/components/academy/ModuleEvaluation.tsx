import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { EvalQuestion } from "@/data/academyData";

interface Props {
  questions: EvalQuestion[];
  onPass: () => void;
}

export default function ModuleEvaluation({ questions, onPass }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? answers.reduce((s, a, i) => s + (a === questions[i].correctIndex ? 1 : 0), 0)
    : 0;
  const passed = score === questions.length;

  const handleSubmit = () => {
    if (answers.some(a => a === null)) return;
    setSubmitted(true);
    if (answers.every((a, i) => a === questions[i].correctIndex)) onPass();
  };

  const handleRetry = () => {
    setAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Validar Conocimiento</p>

      {questions.map((q, qi) => {
        const selected = answers[qi];
        return (
          <div key={qi} className="space-y-1.5">
            <p className="text-[13px] font-semibold text-foreground">{qi + 1}. {q.question}</p>
            <div className="space-y-1">
              {q.options.map((opt, oi) => {
                const isSelected = selected === oi;
                const isCorrect = submitted && oi === q.correctIndex;
                const isWrong = submitted && isSelected && oi !== q.correctIndex;

                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => {
                      const next = [...answers];
                      next[qi] = oi;
                      setAnswers(next);
                    }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-[13px] border transition-colors cursor-pointer ${
                      isCorrect
                        ? "border-border text-foreground"
                        : isWrong
                          ? "border-destructive bg-destructive/5 text-destructive"
                          : isSelected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted/30 text-foreground"
                    }`}
                    style={isCorrect ? { borderColor: "hsl(var(--success))", backgroundColor: "hsl(var(--success-bg))", color: "hsl(var(--success-foreground))" } : undefined}
                  >
                    {submitted && isCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--success))" }} />}
                    {submitted && isWrong && <XCircle className="h-3.5 w-3.5 shrink-0" />}
                    {!submitted && (
                      <div className={`h-3.5 w-3.5 rounded-full border shrink-0 transition-colors ${
                        isSelected ? "border-primary" : "border-border"
                      }`}
                        style={isSelected ? { backgroundColor: "hsl(var(--primary))" } : undefined}
                      />
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={answers.some(a => a === null)}
          className={`px-5 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors ${
            answers.some(a => a === null)
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          Validar Conocimiento
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${passed ? "" : "text-destructive"}`}
            style={passed ? { color: "hsl(var(--success))" } : undefined}>
            {passed ? "¡Aprobado!" : `${score}/${questions.length} correctas`}
          </span>
          {!passed && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-secondary text-foreground border-none cursor-pointer hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reintentar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
