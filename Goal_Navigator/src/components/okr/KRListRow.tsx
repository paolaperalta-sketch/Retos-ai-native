import { PersonalKR } from "@/types/okr";
import { calcKRProgress } from "@/lib/okr-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";
import { CLOSING_MONTH_BADGE, CLOSING_MONTH_LABELS, type ClosingMonth } from "@/lib/kr-mapper";
import { formatKR } from "@/lib/text-utils";

interface KRListRowProps {
  kr: PersonalKR;
  showOwner?: boolean;
  companyOkrTag?: string;
  showMetricHeader?: boolean;
  canManage?: boolean;
  onEdit?: (kr: PersonalKR) => void;
  onDelete?: (kr: PersonalKR) => void;
}

const STATUS_DOT: Record<string, string> = {
  on_track: "bg-success",
  at_risk: "bg-warning",
  off_track: "bg-danger",
};

export function KRListRow({ kr, showOwner = false, companyOkrTag, showMetricHeader = false, canManage, onEdit, onDelete }: KRListRowProps) {
  const progress = calcKRProgress(kr);
  const clamped = Math.min(100, Math.max(0, progress));
  const barColor = STATUS_DOT[kr.status] || "bg-muted";

  return (
    <>
      {showMetricHeader && (
        <div className="flex items-center gap-4 px-1 pb-1 pt-2">
          <div className="flex-1" />
          <div className="w-28 shrink-0" />
          <div className="flex items-center shrink-0">
            <span className="w-16 text-right kr-meta-label tracking-wide">Base</span>
            <span className="w-16 text-right kr-meta-label tracking-wide">Actual</span>
            <span className="w-16 text-right kr-meta-label tracking-wide">Meta</span>
          </div>
          {canManage && <div className="w-16 shrink-0" />}
        </div>
      )}
      <div
        className="flex items-center gap-4 py-3 border-b border-border/30 last:border-b-0 px-1 transition-colors duration-150 rounded-lg hover:bg-muted/30 group/kr"
      >
        {/* Status dot */}
        <span className={`h-2 w-2 rounded-full shrink-0 ${barColor}`} />

        {/* KR name + tag */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="kr-title text-foreground line-clamp-1 cursor-default normal-case" style={{ textTransform: "none" }}>{formatKR(kr.name)}</span>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-md">
              <p className="kr-title normal-case" style={{ textTransform: "none" }}>{formatKR(kr.name)}</p>
            </TooltipContent>
          </Tooltip>
          {companyOkrTag && (
            <span className="shrink-0 text-[10px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded">
              {companyOkrTag}
            </span>
          )}
          {kr.closingMonth ? (
            <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${CLOSING_MONTH_BADGE[kr.closingMonth as ClosingMonth]}`}>
              {CLOSING_MONTH_LABELS[kr.closingMonth as ClosingMonth]}
            </span>
          ) : (
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Sin mes
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-28 shrink-0">
          <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor} transition-all duration-500`}
              style={{ width: `${clamped}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground w-8 text-right tabular-nums">
            {Math.round(clamped)}%
          </span>
        </div>

        {/* Base / Actual / Meta */}
        <div className="flex items-center shrink-0 text-[11px] tabular-nums">
          <span className="w-16 text-right font-medium text-muted-foreground/50">{kr.baseline}</span>
          <span className="w-16 text-right font-bold text-foreground">{kr.current}</span>
          <span className="w-16 text-right font-medium text-muted-foreground/50">{kr.target}</span>
        </div>

        {/* Edit/Delete actions - only visible when canManage */}
        {canManage && (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/kr:opacity-100 transition-opacity duration-200">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit?.(kr); }}
                  className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors bg-transparent border-none cursor-pointer text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Editar</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete?.(kr); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors bg-transparent border-none cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Eliminar</p></TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </>
  );
}
