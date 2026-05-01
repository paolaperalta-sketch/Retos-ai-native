import { ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface OKRCascadeBadgeProps {
  companyOkr: string;
  areaOkr: string;
}

export function OKRCascadeBadge({ companyOkr, areaOkr }: OKRCascadeBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1 cursor-default max-w-full overflow-hidden">
          <span className="font-semibold text-primary shrink-0 truncate max-w-[120px]">{companyOkr}</span>
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
          <span className="truncate">{areaOkr}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <div className="space-y-1 text-xs">
          <p><span className="font-semibold text-primary">OKR Compañía:</span> {companyOkr}</p>
          <p><span className="font-semibold">OKR Área:</span> {areaOkr}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
