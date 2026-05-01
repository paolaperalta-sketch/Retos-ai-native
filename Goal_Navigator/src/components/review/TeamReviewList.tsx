import { CheckCircle2, Clock, ArrowRight } from "lucide-react";

export type ReviewState = "pending" | "in_progress" | "submitted";

export interface ReportRow {
  name: string;
  role: string;
  contribucion: "LÍDER" | "CONTRIBUIDOR INDIVIDUAL";
  state: ReviewState;
  progress: number; // 0-100
}

const stateConfig: Record<ReviewState, { label: string; chip: string }> = {
  pending: { label: "Pendiente", chip: "bg-muted text-muted-foreground" },
  in_progress: { label: "En curso", chip: "bg-warning-bg text-warning-foreground" },
  submitted: { label: "Enviada", chip: "bg-success-bg text-success-foreground" },
};

interface Props {
  reports: ReportRow[];
  onOpen: (name: string) => void;
}

export function TeamReviewList({ reports, onOpen }: Props) {
  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">No tienes reportes directos asignados.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {reports.map((r) => {
        const sc = stateConfig[r.state];
        const Icon = r.state === "submitted" ? CheckCircle2 : Clock;
        return (
          <button
            key={r.name}
            onClick={() => onOpen(r.name)}
            className="w-full text-left rounded-xl border border-border/60 bg-card hover:bg-muted/30 hover:border-primary/40 transition-all p-4 flex items-center gap-4 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center text-sm font-bold text-primary shrink-0">
              {r.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground truncate">
                  {r.name.toUpperCase()}
                </p>
                <span className="text-[10px] font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {r.contribucion === "LÍDER" ? "Líder" : "Contribuidor"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{r.role}</p>
              <div className="h-1 rounded-full bg-secondary mt-2 overflow-hidden max-w-[180px]">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${r.progress}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${sc.chip}`}>
                <Icon className="h-3 w-3" />
                {sc.label}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{r.progress}%</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
