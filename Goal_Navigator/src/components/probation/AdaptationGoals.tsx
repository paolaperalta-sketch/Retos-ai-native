import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Check, Trash2, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdaptationGoalsProps {
  targetUserId: string;
  canManage: boolean;
}

interface Goal {
  id: string;
  title: string;
  completed: boolean;
}

export function AdaptationGoals({ targetUserId, canManage }: AdaptationGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, [targetUserId]);

  const loadGoals = async () => {
    const { data } = await supabase
      .from("probation_goals")
      .select("id, title, completed")
      .eq("user_id", targetUserId)
      .order("created_at");
    setGoals(data || []);
    setLoading(false);
  };

  const addGoal = async () => {
    if (!newGoal.trim() || goals.length >= 5) return;
    const { data, error } = await supabase
      .from("probation_goals")
      .insert({ user_id: targetUserId, title: newGoal.trim().toUpperCase() })
      .select()
      .single();
    if (error) {
      toast({ title: "Error al crear objetivo", variant: "destructive" });
      return;
    }
    setGoals(prev => [...prev, data]);
    setNewGoal("");
    toast({ title: "Objetivo de adaptación creado" });
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    await supabase.from("probation_goals").update({ completed: !completed }).eq("id", id);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !completed } : g));
  };

  const removeGoal = async (id: string) => {
    await supabase.from("probation_goals").delete().eq("id", id);
    setGoals(prev => prev.filter(g => g.id !== id));
    toast({ title: "Objetivo eliminado" });
  };

  const completedCount = goals.filter(g => g.completed).length;

  if (loading) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Objetivos de Adaptación</h3>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {completedCount}/{goals.length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {goals.map(goal => (
          <div
            key={goal.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              goal.completed
                ? "border-success/30 bg-success-bg/30"
                : "border-border bg-muted/20"
            }`}
          >
            {canManage ? (
              <button
                onClick={() => toggleGoal(goal.id, goal.completed)}
                className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                  goal.completed
                    ? "border-success bg-success text-primary-foreground"
                    : "border-muted-foreground/30 bg-transparent hover:border-primary"
                }`}
              >
                {goal.completed && <Check className="h-3 w-3" />}
              </button>
            ) : (
              <div className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                goal.completed ? "border-success bg-success text-primary-foreground" : "border-muted-foreground/30"
              }`}>
                {goal.completed && <Check className="h-3 w-3" />}
              </div>
            )}
            <span className={`flex-1 text-sm ${goal.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {goal.title}
            </span>
            {canManage && (
              <button
                onClick={() => removeGoal(goal.id)}
                className="shrink-0 p-1 rounded hover:bg-danger-bg text-muted-foreground hover:text-danger-foreground transition-colors bg-transparent border-none cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {canManage && goals.length < 5 && (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addGoal()}
            placeholder="Nueva meta de adaptación..."
            maxLength={200}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={addGoal}
            disabled={!newGoal.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-none cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir
          </button>
        </div>
      )}

      {goals.length === 0 && !canManage && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Tu líder aún no ha definido objetivos de adaptación.
        </p>
      )}
    </div>
  );
}
