import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, Clock, MessageSquare, ShieldCheck, ArrowUpDown,
  Send, Lock, Award, TrendingUp, AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StrategicCascadeBreadcrumb } from "./StrategicCascadeBreadcrumb";
import { formatKR } from "@/lib/text-utils";

export type AccountabilityStatus = "pending" | "submitted" | "approved" | "adjusted";

export interface AccountabilityData {
  suggestedScore: number;
  selfComment: string;
  status: AccountabilityStatus;
  progressValue?: number;
  leaderScore?: number;
  leaderComment?: string;
}

interface AccountabilityPanelProps {
  krId: string;
  krName: string;
  data: AccountabilityData | null;
  canSubmit: boolean;
  canReview: boolean;
  onSubmit: (krId: string, score: number, comment: string, progressValue?: number) => void;
  onApprove: (krId: string) => void;
  onAdjust: (krId: string, score: number, comment: string) => void;
  /** If true, renders inline card instead of badge+dialog */
  inline?: boolean;
  /** Cascade context for strategic breadcrumb */
  cascadeCompany?: string;
  cascadeArea?: string;
  /** Leader name to show when locked */
  leaderName?: string;
  /** KR target for auto-suggest score */
  krTarget?: number;
  /** KR current value for auto-suggest score */
  krCurrent?: number;
}

const STATUS_CONFIG: Record<AccountabilityStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending: { label: "Pendiente", icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50" },
  submitted: { label: "Enviado al Líder", icon: Send, color: "text-warning", bg: "bg-warning/5" },
  approved: { label: "Aprobado", icon: CheckCircle2, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/5" },
  adjusted: { label: "Ajustado por Líder", icon: ArrowUpDown, color: "text-primary", bg: "bg-primary/5" },
};

const SCORE_LABELS: Record<string, string> = {
  "0": "Sin avance",
  "0.1": "Mínimo",
  "0.2": "Bajo",
  "0.3": "Insuficiente",
  "0.4": "Parcial",
  "0.5": "Medio",
  "0.6": "Aceptable",
  "0.7": "Bueno",
  "0.8": "Notable",
  "0.9": "Excelente",
  "1": "Excepcional",
};

function getScoreColor(score: number): string {
  if (score >= 0.8) return "text-[hsl(var(--success))]";
  if (score >= 0.5) return "text-warning";
  return "text-[hsl(var(--danger))]";
}

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div className={`${sizeClasses} rounded-lg bg-card border border-border flex items-center justify-center font-bold ${getScoreColor(score)} shadow-sm`}>
      {score.toFixed(1)}
    </div>
  );
}

export function AccountabilityPanel({
  krId, krName, data, canSubmit, canReview, onSubmit, onApprove, onAdjust, inline = false,
  cascadeCompany, cascadeArea, leaderName, krTarget, krCurrent,
}: AccountabilityPanelProps) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(data?.suggestedScore ?? 0.5);
  const [comment, setComment] = useState(data?.selfComment ?? "");
  const [progressValue, setProgressValue] = useState(data?.progressValue ?? 0);
  const [leaderScore, setLeaderScore] = useState(data?.leaderScore ?? data?.suggestedScore ?? 0.5);
  const [leaderComment, setLeaderComment] = useState(data?.leaderComment ?? "");
  const [showAdjust, setShowAdjust] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const status = data?.status ?? "pending";
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const isLocked = status === "submitted" || status === "approved" || status === "adjusted";
  const isClosed = status === "approved" || status === "adjusted";

  // Reset state when data changes
  useEffect(() => {
    setScore(data?.suggestedScore ?? 0.5);
    setComment(data?.selfComment ?? "");
    setProgressValue(data?.progressValue ?? 0);
    setLeaderScore(data?.leaderScore ?? data?.suggestedScore ?? 0.5);
    setLeaderComment(data?.leaderComment ?? "");
    setShowAdjust(false);
  }, [data?.status, data?.suggestedScore]);

  // Auto-suggest score when progress changes (only in pending state)
  const autoSuggestScore = useCallback((pv: number) => {
    if (status !== "pending") return;
    const suggested = Math.round((pv / 100) * 10) / 10;
    setScore(Math.min(1, Math.max(0, suggested)));
  }, [status]);

  const handleProgressChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setProgressValue(clamped);
    autoSuggestScore(clamped);
  };

  const handleSubmitSelf = async () => {
    if (!comment.trim() || comment.trim().length < 10 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(krId, score, comment.trim(), progressValue);
      setJustSubmitted(true);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = () => {
    onApprove(krId);
    setOpen(false);
  };

  const handleAdjust = () => {
    if (!leaderComment.trim()) return;
    onAdjust(krId, leaderScore, leaderComment.trim());
    setOpen(false);
    setShowAdjust(false);
  };

  // ── Inline card for Collaborator view ──
  if (inline && canSubmit) {
    return (
      <div className={`rounded-xl border transition-all ${isClosed ? "border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/3" : isLocked ? "border-warning/20 bg-warning/3" : "border-border bg-card"}`}>
        {/* Status header */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${isClosed ? "border-[hsl(var(--success))]/10" : "border-border/40"}`}>
          <div className="flex items-center gap-2">
            <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
            <span className={`text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>
          {isLocked && <Lock className="h-3 w-3 text-muted-foreground/50" />}
          {isClosed && data && (
            <div className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">{(data.leaderScore ?? data.suggestedScore).toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Cascade breadcrumb */}
          {cascadeCompany && cascadeArea && status === "pending" && (
            <div className="mb-3">
              <StrategicCascadeBreadcrumb companyOkr={cascadeCompany} areaOkr={cascadeArea} krName={formatKR(krName)} />
            </div>
          )}

          {/* ── Pending: Show submission form ── */}
          {status === "pending" && (
            <div className="space-y-4">
              {/* Progress input */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Avance Real del Período
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-[120px]">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={progressValue}
                      onChange={e => handleProgressChange(Number(e.target.value))}
                      className="pr-8 text-sm font-semibold h-9"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all"
                      style={{ width: `${Math.min(100, progressValue)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Score selector */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Autocalificación
                </label>
                <div className="flex items-center gap-3">
                  <ScoreBadge score={score} />
                  <div className="flex-1">
                    <Slider
                      value={[score]}
                      onValueChange={([v]) => setScore(v)}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>0.0</span>
                      <span className={`font-medium ${getScoreColor(score)}`}>{SCORE_LABELS[score.toFixed(1)] || ""}</span>
                      <span>1.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Autocrítica */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Autocrítica <span className="text-[hsl(var(--danger))]">*</span>
                </label>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Justifica tu resultado: logros, obstáculos y aprendizajes (mín. 10 caracteres)..."
                  rows={3}
                  className="text-sm resize-none"
                />
                {comment.length > 0 && comment.length < 10 && (
                  <p className="text-[10px] text-[hsl(var(--danger))] mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Mínimo 10 caracteres
                  </p>
                )}
              </div>

              <Button
                onClick={handleSubmitSelf}
                disabled={!comment.trim() || comment.trim().length < 10 || submitting}
                className="w-full gap-2"
              >
                {submitting ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar al Líder
                  </>
                )}
              </Button>
              {justSubmitted && (
                <div className="rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                  <p className="text-xs font-medium text-[hsl(var(--success))]">Autocalificación cargada</p>
                </div>
              )}
            </div>
          )}

          {/* ── Submitted: Locked view ── */}
          {status === "submitted" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Avance</p>
                  <p className="text-lg font-bold text-foreground">{data?.progressValue ?? 0}%</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mi Nota</p>
                  <p className="text-lg font-bold text-foreground">{data?.suggestedScore?.toFixed(1)}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/20 p-3 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mi Autocrítica</p>
                <p className="text-xs text-foreground leading-relaxed">{data?.selfComment}</p>
              </div>
              <p className="text-[10px] text-center text-muted-foreground italic flex items-center justify-center gap-1.5">
                <Clock className="h-3 w-3" />
                ⏳ Esperando aprobación de {leaderName || "tu líder"}...
              </p>
            </div>
          )}

          {/* ── Approved / Adjusted: Final result ── */}
          {isClosed && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Avance</p>
                  <p className="text-sm font-bold text-foreground">{data?.progressValue ?? 0}%</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Mi Nota</p>
                  <p className="text-sm font-bold text-foreground">{data?.suggestedScore?.toFixed(1)}</p>
                </div>
                <div className="rounded-lg bg-primary/8 p-2.5 text-center border border-primary/15">
                  <p className="text-[9px] text-primary uppercase tracking-wider mb-0.5 font-semibold">Final</p>
                  <p className={`text-sm font-bold ${getScoreColor(data?.leaderScore ?? data?.suggestedScore ?? 0)}`}>
                    {(data?.leaderScore ?? data?.suggestedScore)?.toFixed(1)}
                  </p>
                </div>
              </div>
              {data?.leaderComment && (
                <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                  <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-1">Feedback del Líder</p>
                  <p className="text-xs text-foreground leading-relaxed">{data.leaderComment}</p>
                </div>
              )}
              {status === "adjusted" && (
                <p className="text-[10px] text-center text-muted-foreground">
                  Tu líder ajustó la nota de {data?.suggestedScore?.toFixed(1)} → {data?.leaderScore?.toFixed(1)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Inline card for Leader review ──
  if (inline && canReview && data && status === "submitted") {
    return (
      <div className="rounded-xl border border-warning/20 bg-warning/3 transition-all">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-warning/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-warning" />
            <span className="text-[11px] font-semibold text-warning">Pendiente de Aprobación</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Comparative view */}
          <div className="rounded-lg bg-muted/20 p-4 border border-border/30 space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              El colaborador reportó:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Avance:</span>
                <span className="text-sm font-bold text-foreground">{data.progressValue ?? 0}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Nota:</span>
                <ScoreBadge score={data.suggestedScore} size="sm" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Autocrítica:</p>
              <p className="text-xs text-foreground leading-relaxed bg-background/50 rounded-lg p-2.5 border border-border/20">
                {data.selfComment}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleApprove} variant="outline" className="gap-2 border-[hsl(var(--success))]/30 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/5">
              <CheckCircle2 className="h-4 w-4" />
              Aprobar ({data.suggestedScore.toFixed(1)})
            </Button>
            <Button onClick={() => setShowAdjust(!showAdjust)} variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Ajustar
            </Button>
          </div>

          {/* Adjust form */}
          {showAdjust && (
            <div className="rounded-lg border border-primary/15 bg-primary/3 p-4 space-y-3 animate-fade-in">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Nueva Puntuación
                </label>
                <div className="flex items-center gap-3">
                  <ScoreBadge score={leaderScore} />
                  <div className="flex-1">
                    <Slider
                      value={[leaderScore]}
                      onValueChange={([v]) => setLeaderScore(v)}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>0.0</span>
                      <span className={`font-medium ${getScoreColor(leaderScore)}`}>{SCORE_LABELS[leaderScore.toFixed(1)] || ""}</span>
                      <span>1.0</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Feedback Obligatorio <span className="text-[hsl(var(--danger))]">*</span>
                </label>
                <Textarea
                  value={leaderComment}
                  onChange={e => setLeaderComment(e.target.value)}
                  placeholder="Explica por qué ajustas la nota..."
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <Button onClick={handleAdjust} disabled={!leaderComment.trim()} className="w-full gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Ajustar y Cerrar ({leaderScore.toFixed(1)})
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Badge trigger (compact, for tables/rows) ──
  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(true)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border-none cursor-pointer transition-all hover:scale-105 ${cfg.bg} ${cfg.color}`}
            >
              <Icon className="h-3 w-3" />
              {cfg.label}
              {isClosed && data && (
                <span className="ml-1 font-bold">{(data.leaderScore ?? data.suggestedScore).toFixed(1)}</span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {status === "pending" && canSubmit ? "Calificar resultado" : "Ver detalle"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Cierre de Resultado
            </DialogTitle>
          </DialogHeader>

          <div className="kr-title text-muted-foreground mb-3 bg-muted/30 rounded-lg p-2.5">{formatKR(krName)}</div>

          {/* Collaborator submission in dialog */}
          {status === "pending" && canSubmit && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Avance Real
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative max-w-[100px]">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={progressValue}
                      onChange={e => setProgressValue(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="pr-7 text-sm font-semibold h-9"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all" style={{ width: `${progressValue}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Puntuación: <span className={`font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</span>
                </label>
                <Slider value={[score]} onValueChange={([v]) => setScore(v)} min={0} max={1} step={0.1} />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>0.0</span>
                  <span className={`font-medium ${getScoreColor(score)}`}>{SCORE_LABELS[score.toFixed(1)] || ""}</span>
                  <span>1.0</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Autocrítica / Justificación <span className="text-[hsl(var(--danger))]">*</span>
                </label>
                <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Describe resultados, obstáculos y aprendizajes..." rows={4} className="text-sm" />
              </div>
              <Button onClick={handleSubmitSelf} disabled={!comment.trim() || comment.trim().length < 10} className="w-full gap-2">
                <Send className="h-4 w-4" />
                Enviar al Líder
              </Button>
            </div>
          )}

          {/* Read-only after submission */}
          {status !== "pending" && !canReview && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground">Avance</p>
                  <p className="text-lg font-bold">{data?.progressValue ?? 0}%</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground">Mi Nota</p>
                  <p className="text-lg font-bold">{data?.suggestedScore?.toFixed(1)}</p>
                </div>
              </div>
              <div className="text-xs bg-muted/30 rounded-lg p-3">{data?.selfComment}</div>
              {isClosed && (
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Puntuación final</span>
                    <Badge className="font-bold bg-primary text-primary-foreground">
                      {(data?.leaderScore ?? data?.suggestedScore)?.toFixed(1)}
                    </Badge>
                  </div>
                  {data?.leaderComment && (
                    <div className="text-xs bg-primary/5 rounded-lg p-3 mt-2 border border-primary/10">
                      <span className="font-semibold text-primary">Feedback del líder:</span> {data.leaderComment}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Leader review in dialog */}
          {status === "submitted" && canReview && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/20 p-3 border border-border/30 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Colaborador reportó:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-xs"><span className="text-muted-foreground">Avance:</span> <span className="font-bold">{data?.progressValue ?? 0}%</span></div>
                  <div className="text-xs"><span className="text-muted-foreground">Nota:</span> <span className="font-bold">{data?.suggestedScore?.toFixed(1)}</span></div>
                </div>
                <p className="text-xs text-foreground bg-background/50 rounded p-2">{data?.selfComment}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleApprove} variant="outline" className="gap-1.5 border-[hsl(var(--success))]/30 text-[hsl(var(--success))]">
                  <CheckCircle2 className="h-4 w-4" />
                  Aprobar ({data?.suggestedScore?.toFixed(1)})
                </Button>
                <Button onClick={() => setShowAdjust(!showAdjust)} variant="outline" className="gap-1.5">
                  <ArrowUpDown className="h-4 w-4" />
                  Ajustar
                </Button>
              </div>
              {showAdjust && (
                <div className="space-y-3 border-t border-border pt-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Nueva puntuación: <span className="text-primary font-bold">{leaderScore.toFixed(1)}</span>
                    </label>
                    <Slider value={[leaderScore]} onValueChange={([v]) => setLeaderScore(v)} min={0} max={1} step={0.1} />
                  </div>
                  <Textarea value={leaderComment} onChange={e => setLeaderComment(e.target.value)} placeholder="Feedback obligatorio..." rows={3} className="text-sm" />
                  <Button onClick={handleAdjust} disabled={!leaderComment.trim()} className="w-full gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Ajustar y Cerrar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
