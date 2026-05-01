import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import type { QuizQuestion } from "@/data/onboardingData";

interface Props {
  title: string;
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  attempts: number[];
  bestScore: number;
  passed: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface ShuffledQ {
  original: QuizQuestion;
  shuffledOptions: string[];
  correctShuffledIndices: number[];
}

function shuffleQuiz(questions: QuizQuestion[]): ShuffledQ[] {
  return shuffle(questions).map(q => {
    if (q.type === "text" || q.type === "truefalse") {
      return { original: q, shuffledOptions: q.options, correctShuffledIndices: Array.isArray(q.correctIndex) ? q.correctIndex : [q.correctIndex] };
    }
    const indexed = q.options.map((o, i) => ({ text: o, origIdx: i }));
    const shuffled = shuffle(indexed);
    const correctOrigIndices = Array.isArray(q.correctIndex) ? q.correctIndex : [q.correctIndex];
    const correctNew = shuffled.reduce<number[]>((acc, item, newIdx) => {
      if (correctOrigIndices.includes(item.origIdx)) acc.push(newIdx);
      return acc;
    }, []);
    return { original: q, shuffledOptions: shuffled.map(s => s.text), correctShuffledIndices: correctNew };
  });
}

export function QuizEngine({ title, questions, onComplete, attempts, bestScore, passed }: Props) {
  const [shuffled, setShuffled] = useState(() => shuffleQuiz(questions));
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[] | string>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const q = shuffled[current];
  const total = shuffled.length;

  const handleSelect = useCallback((idx: number) => {
    if (q.original.type === "multi") {
      setAnswers(prev => {
        const curr = (prev[current] as number[]) || [];
        const next = curr.includes(idx) ? curr.filter(i => i !== idx) : [...curr, idx];
        return { ...prev, [current]: next };
      });
    } else {
      setAnswers(prev => ({ ...prev, [current]: [idx] }));
    }
  }, [current, q]);

  const handleTextAnswer = useCallback((text: string) => {
    setAnswers(prev => ({ ...prev, [current]: text }));
  }, [current]);

  const handleSubmit = useCallback(() => {
    let correct = 0;
    shuffled.forEach((sq, i) => {
      const ans = answers[i];
      if (sq.original.type === "text") {
        const textAns = (ans as string || "").trim().toLowerCase();
        if (sq.original.correctTextAnswers?.some(ca => textAns === ca.toLowerCase())) correct++;
      } else {
        const selected = (ans as number[]) || [];
        const correctSet = new Set(sq.correctShuffledIndices);
        if (selected.length === correctSet.size && selected.every(s => correctSet.has(s))) correct++;
      }
    });
    const pct = Math.round((correct / total) * 100);
    setScore(pct);
    setShowResult(true);
    onComplete(pct);
  }, [shuffled, answers, total, onComplete]);

  const handleRetry = useCallback(() => {
    setShuffled(shuffleQuiz(questions));
    setCurrent(0);
    setAnswers({});
    setShowResult(false);
    setScore(0);
  }, [questions]);

  const currentAnswer = answers[current];
  const selectedIndices = Array.isArray(currentAnswer) ? currentAnswer : [];

  if (showResult) {
    const passingScore = 70;
    const didPass = score >= passingScore;
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center py-8">
        <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center ${
          didPass ? "bg-emerald-500/20" : "bg-destructive/20"
        }`}>
          {didPass ? <CheckCircle2 className="h-8 w-8 text-emerald-500" /> : <XCircle className="h-8 w-8 text-destructive" />}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{didPass ? "¡Evaluación superada! ⚡" : "Sigue intentando"}</h2>
        <p className="text-3xl font-bold text-primary">{score}%</p>
        {!didPass && (
          <p className="text-sm text-muted-foreground">
            Necesitas mínimo 70% para continuar. ¡Tú puedes, vuelve a intentarlo!
          </p>
        )}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Intentos realizados: {attempts.length}</p>
          {bestScore > 0 && <p>Tu mejor puntaje hasta ahora: {bestScore}%</p>}
        </div>
        {!didPass && (
          <button onClick={handleRetry} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
            <RefreshCw className="h-4 w-4" /> Reintentar {title}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">Pregunta {current + 1} de {total}</p>
        <div className="w-full bg-muted rounded-full h-1.5 mt-3">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((current + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-card p-6 space-y-4">
        <p className="text-sm font-semibold text-foreground leading-relaxed">{q.original.question}</p>
        {q.original.type === "multi" && (
          <p className="text-xs text-primary font-medium">Selecciona las 2 correctas</p>
        )}

        {q.original.type === "text" ? (
          <input
            type="text"
            value={(currentAnswer as string) || ""}
            onChange={e => handleTextAnswer(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        ) : (
          <div className="space-y-2">
            {q.shuffledOptions.map((opt, idx) => {
              const isSelected = selectedIndices.includes(idx);
              const isMulti = q.original.type === "multi";
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground font-medium"
                      : "border-border/50 bg-background text-foreground hover:border-border"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-${isMulti ? "sm" : "full"} border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          disabled={current === 0}
          onClick={() => setCurrent(c => c - 1)}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Anterior
        </button>
        {current < total - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Finalizar Evaluación
          </button>
        )}
      </div>
    </div>
  );
}
