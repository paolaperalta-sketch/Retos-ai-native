import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Send, CheckCircle2, UserCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface LeaderInfo {
  full_name: string;
  cargo: string;
  area: string;
  email: string;
}

interface EvaluationState {
  rating: number;
  comment: string;
  submitted: boolean;
}

export function LeaderEvaluationPanel() {
  const { user } = useAuth();
  const [leader, setLeader] = useState<LeaderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<EvaluationState>({
    rating: 0,
    comment: "",
    submitted: false,
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const fetchLeader = async () => {
      setLoading(true);
      // Get the user's manager_email from users_master
      const { data: userData } = await supabase
        .from("users_master")
        .select("manager_email")
        .eq("email", user.email)
        .maybeSingle();

      if (!userData?.manager_email) {
        setLoading(false);
        return;
      }

      // Get leader info
      const { data: leaderData } = await supabase
        .from("users_master")
        .select("full_name, cargo, area, email")
        .eq("email", userData.manager_email)
        .maybeSingle();

      if (leaderData) {
        setLeader(leaderData);
      }
      setLoading(false);
    };

    fetchLeader();
  }, [user?.email]);

  const handleSubmit = async () => {
    if (evaluation.rating === 0 || !evaluation.comment.trim()) {
      toast.error("Debes asignar una calificación y un comentario");
      return;
    }
    setSubmitting(true);

    // For now, local state only. Can persist to a table later.
    await new Promise((r) => setTimeout(r, 600));
    setEvaluation((prev) => ({ ...prev, submitted: true }));
    setSubmitting(false);
    toast.success("Evaluación enviada exitosamente");
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!leader) return null;

  const displayStars = hoveredStar || evaluation.rating;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Evaluación de mi Líder
        </h3>
      </div>

      <div className="p-5 space-y-5">
        {/* Leader info */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <UserCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">
              {leader.full_name.toLowerCase()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {leader.cargo} · {leader.area}
            </p>
          </div>
        </div>

        {evaluation.submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <div>
              <p className="text-sm font-semibold text-foreground">Evaluación enviada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Calificaste a {leader.full_name.split(" ")[0].toLowerCase()} con {evaluation.rating}/5
              </p>
            </div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${s <= evaluation.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Star rating */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Calificación General
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoveredStar(s)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setEvaluation((prev) => ({ ...prev, rating: s }))}
                    className="p-0.5 bg-transparent border-none cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        s <= displayStars
                          ? "fill-warning text-warning"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                {displayStars > 0 && (
                  <span className="ml-2 text-sm font-semibold text-foreground tabular-nums">
                    {displayStars}/5
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Retroalimentación
              </label>
              <Textarea
                value={evaluation.comment}
                onChange={(e) => setEvaluation((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="¿Cómo ha sido el acompañamiento de tu líder este periodo? ¿Qué podría mejorar?"
                className="text-sm min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {evaluation.comment.length}/500
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={evaluation.rating === 0 || !evaluation.comment.trim() || submitting}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
                evaluation.rating > 0 && evaluation.comment.trim() && !submitting
                  ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar Evaluación
            </button>
          </>
        )}
      </div>
    </div>
  );
}
