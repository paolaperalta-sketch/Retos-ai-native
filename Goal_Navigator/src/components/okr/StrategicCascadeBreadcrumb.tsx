import { Building2, Users, Target, ChevronRight } from "lucide-react";

interface StrategicCascadeBreadcrumbProps {
  companyOkr: string;
  areaOkr: string;
  krName?: string;
}

export function StrategicCascadeBreadcrumb({ companyOkr, areaOkr, krName }: StrategicCascadeBreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 text-[10px] flex-wrap">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/8 text-primary font-medium">
        <Building2 className="h-3 w-3" />
        {companyOkr}
      </span>
      <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/50 text-muted-foreground font-medium">
        <Users className="h-3 w-3" />
        {areaOkr}
      </span>
      {krName && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-foreground font-medium">
            <Target className="h-3 w-3" />
            KR
          </span>
        </>
      )}
    </div>
  );
}
