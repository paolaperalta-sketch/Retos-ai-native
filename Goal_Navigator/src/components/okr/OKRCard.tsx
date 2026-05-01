import { memo } from "react";
import { ProgressBar } from "./ProgressBar";
import { BiaTag } from "@/components/bia";
import { progressToStatus } from "@/lib/okr-utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface OKRCardProps {
  name: string;
  progress: number;
  owner?: string;
  description?: string;
  icon?: React.ReactNode;
  tags?: { label: string; color?: "default" | "info" | "purple" }[];
  expanded?: boolean;
  onToggle?: () => void;
  level?: 0 | 1;
  children?: React.ReactNode;
}

function OKRCardImpl({
  name, progress, icon, tags, expanded, onToggle, level = 0, children,
}: OKRCardProps) {
  const status = progressToStatus(progress);
  const isCompany = level === 0;

  return (
    <div className={`rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md ${
      isCompany ? "shadow-sm" : ""
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 text-left group bg-transparent border-none cursor-pointer"
        style={{ padding: isCompany ? "1.25rem" : "0.75rem 1rem" }}
      >
        {icon && (
          <div className={`flex items-center justify-center shrink-0 rounded-xl bg-primary/8 text-primary ${
            isCompany ? "h-11 w-11" : "h-8 w-8"
          }`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-foreground truncate ${isCompany ? "text-sm" : "text-xs"}`}>
              {name}
            </h3>
            {tags?.map((t, i) => (
              <BiaTag key={i} label={t.label} color={t.color ?? "default"} uppercase={false} />
            ))}
          </div>
          <div className={`mt-1.5 ${isCompany ? "max-w-sm" : "max-w-xs"}`}>
            <ProgressBar value={progress} status={status} size={isCompany ? "md" : "sm"} />
          </div>
        </div>
        {onToggle && (
          <div className="text-muted-foreground group-hover:text-foreground transition-colors">
            {expanded
              ? <ChevronDown className={isCompany ? "h-5 w-5" : "h-4 w-4"} />
              : <ChevronRight className={isCompany ? "h-5 w-5" : "h-4 w-4"} />
            }
          </div>
        )}
      </button>

      {expanded && children && (
        <div className={`animate-fade-in ${isCompany ? "px-5 pb-5" : "px-4 pb-4"}`}>
          {children}
        </div>
      )}
    </div>
  );
}

export const OKRCard = memo(OKRCardImpl);

