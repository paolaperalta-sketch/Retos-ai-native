import { useState, useEffect, useCallback, useRef } from "react";
import { Coffee } from "lucide-react";

interface Props {
  label: string;
  onComplete: () => void;
}

export function BreakCard({ label, onComplete }: Props) {
  const [remaining, setRemaining] = useState(20 * 60); // 20 min
  const [skipped, setSkipped] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const done = remaining === 0 || skipped;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const handleSkip = useCallback(() => {
    if (showConfirm) {
      setSkipped(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setShowConfirm(true);
    }
  }, [showConfirm]);

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-6 text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Coffee className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{label}</h3>
      </div>
      
      {!done && (
        <>
          <div className="text-3xl font-mono font-bold text-primary">{timeStr}</div>
          <p className="text-xs text-muted-foreground">Tómate 20 minutos antes de continuar</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSkip}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? "¿Seguro? Confirmar" : "Saltar descanso"}
            </button>
          </div>
        </>
      )}

      {done && (
        <button
          onClick={onComplete}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Continuar ⚡
        </button>
      )}
    </div>
  );
}
