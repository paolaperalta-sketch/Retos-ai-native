import { useState, useEffect, forwardRef } from "react";
import { MessageSquare, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Comment {
  type: "valoras" | "liderazgo" | "mejoras";
  text: string;
  category: string;
  score: number | null;
  area: string;
  periodo: string;
  salarioSatisfecho?: string;
}

interface CommentsSectionProps {
  comments: Comment[];
  externalTypeFilter?: string;
  externalCategoryFilter?: string;
  onClearExternalFilter?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  valoras: "Lo que más valoro",
  liderazgo: "Liderazgo",
  mejoras: "Mejoras",
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const cls = score >= 9 ? "badge-promoter" : score >= 7 ? "badge-passive" : "badge-detractor";
  return <span className={cls}>{score}/10</span>;
}

export const CommentsSection = forwardRef<HTMLDivElement, CommentsSectionProps>(
  ({ comments, externalTypeFilter, externalCategoryFilter, onClearExternalFilter }, ref) => {
    const [typeFilter, setTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [visibleCount, setVisibleCount] = useState(10);

    useEffect(() => {
      if (externalTypeFilter) {
        setTypeFilter(externalTypeFilter);
        setVisibleCount(10);
      }
    }, [externalTypeFilter]);

    useEffect(() => {
      if (externalCategoryFilter) {
        setCategoryFilter(externalCategoryFilter);
        setVisibleCount(10);
      }
    }, [externalCategoryFilter]);

    const categories = [...new Set(comments.map((c) => c.category))].sort();

    const isSalaryFilter = externalTypeFilter?.startsWith("salary:");
    const salaryAnswer = isSalaryFilter ? externalTypeFilter!.replace("salary:", "") : null;

    const filtered = comments.filter((c) => {
      if (salaryAnswer && c.salarioSatisfecho !== salaryAnswer) return false;
      if (!salaryAnswer && typeFilter !== "all" && c.type !== typeFilter) return false;
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
      return true;
    });

    const hasExternalFilter = externalTypeFilter || externalCategoryFilter;

    const handleClearFilter = () => {
      setTypeFilter("all");
      setCategoryFilter("all");
      setVisibleCount(10);
      onClearExternalFilter?.();
    };

    return (
      <div ref={ref} className="card-metric animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comentarios ({filtered.length})
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {hasExternalFilter && (
              <button
                onClick={handleClearFilter}
                className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-colors"
              >
                <X className="h-3 w-3" />
                Limpiar filtro
              </button>
            )}
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setVisibleCount(10); onClearExternalFilter?.(); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="valoras">Lo que más valoro</SelectItem>
                <SelectItem value="mejoras">Mejoras</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setVisibleCount(10); onClearExternalFilter?.(); }}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {filtered.slice(0, visibleCount).map((c, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border/50 animate-fade-in">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {TYPE_LABELS[c.type]}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{c.category}</span>
                <ScoreBadge score={c.score} />
                <span className="text-xs text-muted-foreground ml-auto">{c.area} · {c.periodo}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>

        {filtered.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((v) => v + 10)}
            className="mt-3 text-sm text-primary hover:text-primary/80 font-medium"
          >
            Ver más ({filtered.length - visibleCount} restantes)
          </button>
        )}
      </div>
    );
  }
);

CommentsSection.displayName = "CommentsSection";