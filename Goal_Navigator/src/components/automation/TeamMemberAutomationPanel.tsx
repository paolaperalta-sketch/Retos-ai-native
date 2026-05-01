import { useState } from "react";
import {
  ExternalLink, MessageSquare, Wrench, AlertTriangle, CheckCircle2,
  Clock, Send, Loader2, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTaskComments } from "@/hooks/useOperationalTasks";
import { useAuth } from "@/contexts/AuthContext";
import { estadoConfig, type OperationalTask } from "@/lib/automation-utils";
import { taskHasEvidence } from "@/hooks/useTeamAutomation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  task: OperationalTask;
}

/**
 * Developer-tool aesthetic detail card for a single automation task.
 * Shows: technical description, tool, evidence URL (mono), and a comment
 * thread between the collaborator and their leader.
 */
export function TeamMemberAutomationTaskCard({ task }: Props) {
  const { user } = useAuth();
  const { comments, addComment } = useTaskComments(task.id);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewing, setReviewing] = useState<"validada" | "rechazada" | null>(null);

  const cfg = estadoConfig[task.estado];
  const hasEvidence = taskHasEvidence(task);
  const isFlagged = task.estado === "automatizada" && !hasEvidence;
  const needsReview = task.validation_status === "pendiente";

  const handleReview = async (status: "validada" | "rechazada") => {
    if (!user?.id || reviewing) return;
    if (status === "rechazada" && !reviewComment.trim()) {
      toast.error("Agrega un comentario para rechazar la tarea");
      return;
    }
    setReviewing(status);
    const { error } = await supabase
      .from("operational_tasks")
      .update({
        validation_status: status,
        leader_id: user.id,
        leader_comment: status === "rechazada" ? reviewComment.trim() : null,
        validated_at: status === "validada" ? new Date().toISOString() : null,
        rejected_at: status === "rechazada" ? new Date().toISOString() : null,
      })
      .eq("id", task.id);
    setReviewing(null);
    if (error) {
      toast.error("No se pudo actualizar la validación");
      return;
    }
    setReviewComment("");
    toast.success(status === "validada" ? "Tarea validada" : "Tarea rechazada");
  };

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await addComment(draft.trim(), true);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      {/* Header: descripción + estado */}
      <div className="px-4 py-3 flex items-start gap-3 border-b border-border/40">
        <div
          className={`mt-0.5 h-5 w-5 shrink-0 rounded-md flex items-center justify-center ${
            task.estado === "automatizada"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : task.estado === "en_progreso"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {task.estado === "automatizada" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">{task.descripcion}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-normal">
              {task.frecuencia}
            </Badge>
            <span className="tabular-nums">{task.tiempo_minutos} min</span>
            <span>·</span>
            <span className={cfg.text}>{cfg.label}</span>
          </div>
        </div>
        {isFlagged && (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            <AlertTriangle className="h-3 w-3" />
            Sin evidencia
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px] shrink-0">
          {task.validation_status === "validada"
            ? "Validada"
            : task.validation_status === "rechazada"
            ? "Rechazada"
            : task.validation_status === "pendiente"
            ? "Pendiente líder"
            : "Sin enviar"}
        </Badge>
      </div>

      {/* Evidencia técnica */}
      <div className="px-4 py-3 space-y-2 bg-muted/10">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <Wrench className="h-3 w-3" />
          Detalle de ejecución
        </div>

        <EvidenceRow
          icon={Wrench}
          label="Herramienta"
          value={task.herramienta_usada}
          empty="No documentada"
        />
        <EvidenceRow
          icon={Link2}
          label="Evidencia"
          value={task.evidencia_url}
          empty="Sin link de evidencia"
          isUrl
        />
        <EvidenceRow
          icon={Wrench}
          label="Proceso"
          value={task.proceso_automatizado}
          empty="Sin respuesta"
        />
        <EvidenceRow
          icon={Clock}
          label="Antes"
          value={task.baseline_descripcion}
          empty="Sin baseline"
        />
        <EvidenceRow
          icon={CheckCircle2}
          label="Después"
          value={task.resultado_descripcion}
          empty="Sin resultado"
        />
      </div>

      {needsReview && (
        <div className="px-4 py-3 border-t border-border/40 space-y-2 bg-background">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Validación del líder
          </p>
          <Textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Comentario obligatorio si rechazas…"
            rows={2}
            className="text-xs resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReview("rechazada")}
              disabled={reviewing !== null}
              className="gap-1.5"
            >
              {reviewing === "rechazada" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              Rechazar
            </Button>
            <Button
              size="sm"
              onClick={() => handleReview("validada")}
              disabled={reviewing !== null}
              className="gap-1.5"
            >
              {reviewing === "validada" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Validar
            </Button>
          </div>
        </div>
      )}

      {/* Comentarios */}
      <div className="px-4 py-3 border-t border-border/40">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          <MessageSquare className="h-3 w-3" />
          Conversación · {comments.length}
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-1">
              Sin comentarios todavía. Sé el primero en dar feedback.
            </p>
          )}
          {comments.map((c) => {
            const mine = c.author_user_id === user?.id;
            return (
              <div
                key={c.id}
                className={`text-xs rounded-md px-2.5 py-1.5 ${
                  c.is_leader_comment
                    ? "bg-primary/8 border border-primary/15"
                    : "bg-muted/40 border border-border/30"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 text-[10px]">
                  <span className="font-semibold text-foreground">
                    {mine ? "Tú" : c.is_leader_comment ? "Líder" : "Colaborador"}
                  </span>
                  {c.is_leader_comment && (
                    <Badge variant="secondary" className="h-3.5 px-1 text-[8px]">
                      Feedback
                    </Badge>
                  )}
                  <span className="text-muted-foreground ml-auto tabular-nums">
                    {new Date(c.created_at).toLocaleString("es-ES", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="text-foreground leading-snug whitespace-pre-wrap">{c.comentario}</p>
              </div>
            );
          })}
        </div>

        {/* Composer (líder) */}
        <div className="mt-2 flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Deja un comentario o feedback técnico…"
            rows={2}
            className="text-xs resize-none flex-1"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="self-end gap-1.5"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}

function EvidenceRow({
  icon: Icon,
  label,
  value,
  empty,
  isUrl = false,
}: {
  icon: any;
  label: string;
  value: string | null | undefined;
  empty: string;
  isUrl?: boolean;
}) {
  const has = value && value.trim();
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      {has ? (
        isUrl ? (
          <a
            href={value!.startsWith("http") ? value! : `https://${value}`}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono text-[11px] text-primary hover:underline break-all flex items-center gap-1 min-w-0"
          >
            <span className="truncate">{value}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <span className="font-mono text-[11px] text-foreground break-all">{value}</span>
        )
      ) : (
        <span className="text-muted-foreground/60 italic text-[11px]">{empty}</span>
      )}
    </div>
  );
}
