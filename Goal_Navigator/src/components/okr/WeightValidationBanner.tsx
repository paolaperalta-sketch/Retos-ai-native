import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

interface WeightValidationBannerProps {
  weightSum: number;
  krCount: number;
}

export function WeightValidationBanner({ weightSum, krCount }: WeightValidationBannerProps) {
  if (krCount === 0) return null;

  if (weightSum === 100) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-5 py-4 animate-fade-in">
        <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Los pesos suman <strong>100%</strong> — configuración válida
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 px-5 py-4 animate-fade-in">
      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
          El peso total actual es {weightSum}%
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          Debe sumar 100% para que la evaluación sea válida
        </p>
      </div>
      <button className="shrink-0 text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 flex items-center gap-1 transition-colors">
        Distribuir pesos <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
