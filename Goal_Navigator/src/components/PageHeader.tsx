import { SidebarTrigger } from "@/components/ui/sidebar";
import { Zap } from "lucide-react";

interface PageHeaderProps {
  /** Optional small chip shown next to the logo (e.g. section name) */
  section?: string;
  /** Optional extra content rendered to the right of the chip */
  children?: React.ReactNode;
  /** Make the header sticky to the top of its scroll container */
  sticky?: boolean;
}

export function PageHeader({ section, children, sticky = false }: PageHeaderProps) {
  return (
    <header
      className={`h-14 flex items-center border-b border-border bg-background px-4 md:px-6 ${
        sticky ? "sticky top-0 z-10" : ""
      }`}
    >
      <SidebarTrigger className="mr-2 md:mr-4" />
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold text-foreground">Bia</span>
        {section && (
          <span className="text-[10px] text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider truncate">
            {section}
          </span>
        )}
        {children}
      </div>
    </header>
  );
}
