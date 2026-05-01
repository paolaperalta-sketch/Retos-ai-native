import { useState } from "react";
import {
  CheckCircle2, AlertTriangle, XCircle, ArrowUpDown,
  ShieldCheck, MessageSquare, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { MonthlyCheckin, StatusRating } from "@/hooks/useMonthlyCheckins";
import { formatKR } from "@/lib/text-utils";

interface LeaderCheckinReviewProps {
  krId: string;
  krName: string;
  checkin: MonthlyCheckin;
  onApprove: (krId: string) => void;
  onAdjust: (krId: string, percent: number, rating: StatusRating, feedback: string) => void;
}

const RATING_CONFIG: Record<StatusRating, { label: string; icon: typeof CheckCircle2; colorClass: string; bgClass: string; borderClass: string }> = {
  cumplido: { label: "Cumplido", icon: CheckCircle2, colorClass: "text-[hsl(var(--success))]", bgClass: "bg-[hsl(var(--success))]/10", borderClass: "border-[hsl(var(--success))]/40" },
  parcial: { label: "Parcial", icon: AlertTriangle, colorClass: "text-warning", bgClass: "bg-warning/10", borderClass: "border-warning/40" },
  no_cumplido: { label: "No cumplido", icon: XCircle, colorClass: "text-[hsl(var(--danger))]", bgClass: "bg-[hsl(var(--danger))]/10", borderClass: "border-[hsl(var(--danger))]/40" },
};

export function LeaderCheckinReview({ krId, krName, checkin, onApprove, onAdjust }: LeaderCheckinReviewProps) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjPercent, setAdjPercent] = useState(checkin.progress_percent);
  const [adjRating, setAdjRating] = useState<StatusRating>(checkin.status_rating as StatusRating);
  const [feedback, setFeedback] = useState("");

  const flowStatus = checkin.flow_status;
  const isClosed = flowStatus === "approved" || flowStatus === "adjusted";
  const ratingCfg = RATING_CONFIG[checkin.status_rating as StatusRating] ?? RATING_CONFIG.parcial;
  const RatingIcon = ratingCfg.icon;

  if (isClosed) {
    const finalRating = (checkin.leader_adjusted_rating as StatusRating) || (checkin.status_rating as StatusRating);
    const finalCfg = RATING_CONFIG[finalRating] ?? RATING_CONFIG.parcial;
    const FinalIcon = finalCfg.icon;
    return (
      <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="kr-title text-foreground">{formatKR(krName)}</p>
          <span className={`text-[10px] font-semibold ${flowStatus === "approved" ? "text-[hsl(var(--success))]" : "text-primary"}`}>
            {flowStatus === "approved" ? "✓ Aprobado" : "↕ Ajustado"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${finalCfg.bgClass} ${finalCfg.borderClass} border`}>
            <FinalIcon className={`h-3.5 w-3.5 ${finalCfg.colorClass}`} />
            <span className={`text-xs font-semibold ${finalCfg.colorClass}`}>{finalCfg.label}</span>
          </div>
          <span className="text-sm font-bold text-foreground">
            {checkin.leader_adjusted_percent ?? checkin.progress_percent}%
          </span>
        </div>
        {checkin.leader_feedback && (
          <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-1">Feedback</p>
            <p className="text-xs text-foreground">{checkin.leader_feedback}</p>
          </div>
        )}
      </div>
    );
  }

  if (flowStatus !== "submitted") return null;

  return (
    <div className="rounded-xl border border-warning/20 bg-warning/3 transition-all">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-warning/10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-warning" />
          <span className="text-[11px] font-semibold text-warning">Pendiente de Aprobación</span>
        </div>
        <p className="kr-title text-foreground truncate max-w-[200px]">{formatKR(krName)}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* What the collaborator reported */}
        <div className="rounded-lg bg-muted/20 p-4 border border-border/30 space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            El colaborador reportó:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <RatingIcon className={`h-4 w-4 ${ratingCfg.colorClass}`} />
              <span className={`text-xs font-semibold ${ratingCfg.colorClass}`}>{ratingCfg.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avance:</span>
              <span className="text-sm font-bold text-foreground">{checkin.progress_percent}%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Justificación:</p>
            <p className="text-xs text-foreground leading-relaxed bg-background/50 rounded-lg p-2.5 border border-border/20">
              {checkin.collaborator_comment}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => onApprove(krId)}
            variant="outline"
            className="gap-2 border-[hsl(var(--success))]/30 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/5"
          >
            <CheckCircle2 className="h-4 w-4" />
            Aprobar
          </Button>
          <Button
            onClick={() => setShowAdjust(!showAdjust)}
            variant="outline"
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Ajustar
          </Button>
        </div>

        {/* Adjust form */}
        {showAdjust && (
          <div className="rounded-lg border border-primary/15 bg-primary/3 p-4 space-y-3 animate-fade-in">
            {/* Rating buttons */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Estado Ajustado
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(RATING_CONFIG) as [StatusRating, typeof RATING_CONFIG["cumplido"]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setAdjRating(key)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        adjRating === key
                          ? `${cfg.bgClass} ${cfg.borderClass} ${cfg.colorClass}`
                          : "bg-transparent border-border/40 text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Adjusted percent */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Porcentaje Ajustado
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-24">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={adjPercent}
                    onChange={e => setAdjPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="pr-7 text-sm font-semibold h-9"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Feedback Obligatorio <span className="text-[hsl(var(--danger))]">*</span>
              </label>
              <Textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Explica por qué ajustas este resultado..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <Button
              onClick={() => {
                if (!feedback.trim()) return;
                onAdjust(krId, adjPercent, adjRating, feedback.trim());
                setShowAdjust(false);
              }}
              disabled={!feedback.trim()}
              className="w-full gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Guardar Ajuste
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
