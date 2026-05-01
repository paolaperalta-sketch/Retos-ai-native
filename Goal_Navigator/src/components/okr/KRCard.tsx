import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { BiaTag } from "@/components/bia";
import { PersonalKR } from "@/types/okr";
import { calcKRProgress } from "@/lib/okr-utils";
import { formatKR } from "@/lib/text-utils";
import { User } from "lucide-react";

interface KRCardProps {
  kr: PersonalKR;
  highlight?: boolean;
  renderActions?: (kr: PersonalKR) => React.ReactNode;
  compact?: boolean;
}

export function KRCard({ kr, highlight, renderActions, compact = false }: KRCardProps) {
  const progress = calcKRProgress(kr);

  return (
    <div
      className={`rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md animate-fade-in ${
        highlight ? "ring-1 ring-primary/20" : ""
      } ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="kr-title text-foreground normal-case" style={{ textTransform: "none" }}>
            {formatKR(kr.name)}
          </h4>
          <div className="flex items-center gap-2 mt-1.5">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{kr.owner}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BiaTag label={`Peso ${kr.weight}%`} color="purple" uppercase={false} />
          <StatusBadge status={kr.status} />
        </div>
      </div>

      <ProgressBar value={progress} status={kr.status} size={compact ? "sm" : "md"} />

      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        <div className="rounded-lg bg-secondary p-2.5">
          <p className="kr-meta-label tracking-wide">Base</p>
          <p className="text-sm font-bold text-foreground mt-0.5">{kr.baseline}</p>
        </div>
        <div className="rounded-lg bg-primary/5 p-2.5">
          <p className="text-[10px] text-muted-foreground tracking-wide">Actual</p>
          <p className="text-sm font-bold text-primary mt-0.5">{kr.current}</p>
        </div>
        <div className="rounded-lg bg-secondary p-2.5">
          <p className="kr-meta-label tracking-wide">Meta</p>
          <p className="text-sm font-bold text-foreground mt-0.5">{kr.target}</p>
        </div>
      </div>

      {renderActions && (
        <div className="mt-4 pt-4 border-t border-border">
          {renderActions(kr)}
        </div>
      )}
    </div>
  );
}
