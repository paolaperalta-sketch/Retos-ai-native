import { Building2, ChevronRight } from "lucide-react";
import type { DrillState } from "./AdminDashboard";

interface AdminBreadcrumbsProps {
  breadcrumbs: DrillState["breadcrumbs"];
  onNavigate: (index: number) => void;
}

export function AdminBreadcrumbs({ breadcrumbs, onNavigate }: AdminBreadcrumbsProps) {
  if (breadcrumbs.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm flex-wrap">
      {breadcrumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
          <button
            onClick={() => onNavigate(i)}
            className={`bg-transparent border-none cursor-pointer transition-colors px-2 py-1 rounded-md ${
              i === breadcrumbs.length - 1
                ? "text-foreground font-semibold bg-primary/10"
                : "text-muted-foreground hover:text-primary font-medium"
            }`}
          >
            {i === 0 && <Building2 className="h-3.5 w-3.5 inline mr-1" />}
            {crumb.label}
          </button>
        </span>
      ))}
    </div>
  );
}
