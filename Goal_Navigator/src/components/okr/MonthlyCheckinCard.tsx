import { useState, useEffect, useMemo } from "react";
import { Lock, Clock, ArrowUpDown, MessageSquare, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { MonthlyCheckin, StatusRating, FlowStatus } from "@/hooks/useMonthlyCheckins";
import { formatKR } from "@/lib/text-utils";

interface MonthlyCheckinCardProps {
  krId: string;
  krName: string;
  krTarget?: number;
  krCurrent?: number;
  krBaseline?: number;
  pillarName?: string;
  checkin: MonthlyCheckin | null;
  canEdit: boolean;
  onSaveDraft: (krId: string, percent: number, rating: StatusRating, comment: string) => void;
  animationDelay?: number;
}

const RATINGS: { key: StatusRating; label: string; emoji: string; selectedBg: string; selectedText: string }[] = [
  { key: "cumplido", label: "Cumplido", emoji: "✅", selectedBg: "bg-green-50 dark:bg-green-950/30", selectedText: "text-green-600 dark:text-green-400" },
  { key: "parcial", label: "Parcial", emoji: "⚠️", selectedBg: "bg-yellow-50 dark:bg-yellow-950/30", selectedText: "text-yellow-600 dark:text-yellow-400" },
  { key: "no_cumplido", label: "No cumplido", emoji: "❌", selectedBg: "bg-pink-50 dark:bg-pink-950/30", selectedText: "text-pink-500 dark:text-pink-400" },
];

const FLOW_LABELS: Record<FlowStatus, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "text-muted-foreground" },
  submitted: { label: "Enviado", color: "text-amber-600 dark:text-amber-400" },
  approved: { label: "Aprobado", color: "text-emerald-600 dark:text-emerald-400" },
  adjusted: { label: "Ajustado", color: "text-indigo-600 dark:text-indigo-400" },
};

export function MonthlyCheckinCard({
  krId, krName, krTarget, krCurrent, krBaseline, pillarName, checkin, canEdit, onSaveDraft, animationDelay = 0,
}: MonthlyCheckinCardProps) {
  const hasExistingCheckin = !!checkin;
  const [resultValue, setResultValue] = useState<string>(
    hasExistingCheckin ? String(checkin.progress_percent) : ""
  );
  const [rating, setRating] = useState<StatusRating | null>(
    hasExistingCheckin ? (checkin.status_rating as StatusRating) : null
  );
  const [comment, setComment] = useState(checkin?.collaborator_comment ?? "");
  const [dirty, setDirty] = useState(false);

  const flowStatus = checkin?.flow_status as FlowStatus ?? "draft";
  const isLocked = flowStatus !== "draft";

  const numericResult = resultValue === "" ? null : Number(resultValue);
  const autoPercent = useMemo(() => {
    if (numericResult === null) return 0;
    const base = krBaseline ?? 0;
    const target = krTarget ?? 100;
    if (target === base) return 0;
    return Math.round(Math.min(100, Math.max(0, ((numericResult - base) / (target - base)) * 100)));
  }, [numericResult, krBaseline, krTarget]);

  const isTouched = rating !== null && resultValue !== "";

  useEffect(() => {
    if (checkin) {
      setResultValue(String(checkin.progress_percent));
      setRating(checkin.status_rating as StatusRating);
      setComment(checkin.collaborator_comment ?? "");
    } else {
      setResultValue("");
      setRating(null);
      setComment("");
    }
    setDirty(false);
  }, [checkin?.id, checkin?.flow_status]);

  const handleChange = (field: "result" | "rating" | "comment", value: any) => {
    setDirty(true);
    if (field === "result") setResultValue(value);
    if (field === "rating") setRating(value);
    if (field === "comment") setComment(value);
  };

  const handleBlurSave = () => {
    if (dirty && canEdit && !isLocked && rating && resultValue !== "") {
      onSaveDraft(krId, autoPercent, rating, comment);
      setDirty(false);
    }
  };

  const displayPercent = isLocked && checkin?.leader_adjusted_percent != null
    ? checkin.leader_adjusted_percent
    : autoPercent;

  const flowCfg = FLOW_LABELS[flowStatus];

  const barPercent = isTouched ? Math.min(displayPercent, 100) : 0;

  return (
    <div
      className="py-4 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Row 1: Pillar tag + KR title + flow status */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {pillarName && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70 shrink-0">
                {pillarName}
              </span>
            )}
            {isLocked && (
              <span className={`text-[10px] font-medium ${flowCfg.color} flex items-center gap-0.5 shrink-0`}>
                <Lock className="h-2.5 w-2.5" />
                {flowCfg.label}
              </span>
            )}
          </div>
          <p className="kr-title text-foreground mt-0.5">{formatKR(krName)}</p>
        </div>
        {isTouched && (
          <span className={`text-lg font-bold tabular-nums shrink-0 ${
            displayPercent >= 80 ? "text-emerald-600" : displayPercent >= 50 ? "text-amber-600" : "text-rose-600"
          }`}>
            {displayPercent}%
          </span>
        )}
      </div>

      {/* Row 2: Base · Meta · Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <span className="kr-meta-label whitespace-nowrap">
          Base <strong className="text-foreground">{krBaseline ?? 0}</strong>
        </span>
        <span className="kr-meta-label whitespace-nowrap">
          Meta <strong className="text-foreground">{krTarget ?? 100}</strong>
        </span>
        <div className="flex-1 h-1 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>

      {/* Row 3: Status pill toggle + result input */}
      <div className="flex items-center gap-3">
        {/* Segmented pill */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden h-8">
          {RATINGS.map(r => {
            const isActive = isLocked && checkin?.leader_adjusted_rating
              ? checkin.leader_adjusted_rating === r.key
              : rating === r.key;

            return (
              <button
                key={r.key}
                onClick={() => !isLocked && handleChange("rating", r.key)}
                disabled={isLocked}
                className={`px-3 text-[11px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap ${
                  isActive
                    ? `${r.selectedBg} ${r.selectedText}`
                    : "text-muted-foreground hover:bg-muted/30"
                } ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"} border-r border-border/30 last:border-r-0`}
              >
                <span className="text-xs">{r.emoji}</span>
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Inline result input */}
        <input
          type="number"
          min={0}
          value={isLocked && checkin?.leader_adjusted_percent != null ? checkin.leader_adjusted_percent : resultValue}
          onChange={e => handleChange("result", e.target.value)}
          onBlur={handleBlurSave}
          disabled={isLocked}
          placeholder="—"
          className="w-16 h-8 text-sm font-semibold text-center rounded-lg border border-border/50 bg-transparent focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed tabular-nums"
        />
      </div>

      {/* Row 4: Expandable comment (only when rating selected) */}
      {rating !== null && (
        <div className="mt-3 animate-fade-in">
          {isLocked ? (
            checkin?.collaborator_comment && (
              <p className="text-xs text-muted-foreground leading-relaxed">{checkin.collaborator_comment}</p>
            )
          ) : (
            <Textarea
              value={comment}
              onChange={e => handleChange("comment", e.target.value)}
              onBlur={handleBlurSave}
              placeholder="Comentario (opcional)..."
              rows={1}
              className="text-xs resize-none rounded-lg border-border/30 bg-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all min-h-[32px] py-1.5 px-3"
            />
          )}
        </div>
      )}

      {/* Leader feedback */}
      {checkin?.leader_feedback && (
        <div className="mt-2 flex items-start gap-1.5">
          <MessageSquare className="h-3 w-3 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{checkin.leader_feedback}</p>
        </div>
      )}

      {/* Status indicators */}
      {flowStatus === "adjusted" && checkin?.leader_adjusted_percent != null && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-2">
          <ArrowUpDown className="h-3 w-3" />
          Ajustado: {checkin.progress_percent}% → {checkin.leader_adjusted_percent}%
        </p>
      )}
      {flowStatus === "submitted" && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-2">
          <Clock className="h-3 w-3" />
          Esperando aprobación
        </p>
      )}
      {flowStatus === "approved" && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-2">
          <CheckCircle2 className="h-3 w-3" />
          Aprobado
        </p>
      )}
    </div>
  );
}
