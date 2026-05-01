import { useState } from "react";
import {
  ChevronDown, ChevronRight, Target, CheckCircle2, MessageSquare, XCircle,
  Pencil, Trash2, Plus, Star, Sparkles,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { avatarMap } from "@/data/avatarMap";
import { PersonAutomationPanel } from "@/components/automation/PersonAutomationPanel";
import { usePersonAutomationPct } from "@/hooks/usePersonAutomationPct";
import { WeightValidationBanner } from "@/components/okr/WeightValidationBanner";
import { OKRContextTags } from "@/components/okr/OKRContextTags";
import { formatKR } from "@/lib/text-utils";
import type { PersonalKR } from "@/types/okr";
import type { MonthlyCheckin, StatusRating } from "@/hooks/useMonthlyCheckins";
import type { TeamNode } from "@/data/teamHierarchy";
import { Users } from "lucide-react";

type MemberStatus = "approved" | "pending" | "not_sent" | "no_krs";

interface TeamMemberRowProps {
  name: string;
  role: string;
  area: string;
  progress: number;
  krs: PersonalKR[];
  status: MemberStatus;
  checkins: Record<string, MonthlyCheckin>;
  onApprove: (krId: string) => void;
  onAdjust: (krId: string, percent: number, rating: StatusRating, feedback: string) => void;
  krPillarMap: Record<string, string>;
  /** Map of KR id → área OKR text (shown as compact tag with tooltip). */
  krAreaOkrMap?: Record<string, string>;
  /** Email used to load the person's automation tasks */
  email?: string;
  // KR CRUD
  onEditKR?: (kr: PersonalKR) => void;
  onDeleteKR?: (kr: PersonalKR) => void;
  onAddKR?: () => void;
  /** Inline weight update (optimistic). Returns when server confirms. */
  onUpdateWeight?: (kr: PersonalKR, newWeight: number) => Promise<void> | void;
  // Leader direct rating (without checkin)
  onLeaderRate?: (krId: string, percent: number, rating: StatusRating, comment: string) => void;
  // Recursive sub-team rendering (for hierarchical leaders like global_leader)
  subReports?: TeamNode[];
  renderSubReport?: (node: TeamNode) => React.ReactNode;
}

const STATUS_CONFIG: Record<MemberStatus, { dot: string; label: string }> = {
  approved: { dot: "bg-emerald-500", label: "Aprobada" },
  pending: { dot: "bg-amber-500", label: "Pendiente" },
  not_sent: { dot: "bg-rose-500", label: "No enviada" },
  no_krs: { dot: "bg-muted-foreground/40", label: "Sin KRs" },
};

const RATING_DISPLAY: Record<string, { emoji: string; label: string; color: string }> = {
  cumplido: { emoji: "✅", label: "Cumplido", color: "text-emerald-600 dark:text-emerald-400" },
  parcial: { emoji: "⚠️", label: "Parcial", color: "text-amber-600 dark:text-amber-400" },
  no_cumplido: { emoji: "❌", label: "No cumplido", color: "text-rose-600 dark:text-rose-400" },
};

const RATING_OPTIONS: { key: StatusRating; label: string; emoji: string; bg: string; text: string }[] = [
  { key: "cumplido", label: "Cumplido", emoji: "✅", bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-400" },
  { key: "parcial", label: "Parcial", emoji: "⚠️", bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600 dark:text-yellow-400" },
  { key: "no_cumplido", label: "No cumplido", emoji: "❌", bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-500 dark:text-pink-400" },
];

export function TeamMemberRow({
  name, role, area, progress, krs, status, checkins, onApprove, onAdjust, krPillarMap,
  krAreaOkrMap,
  email, onEditKR, onDeleteKR, onAddKR, onLeaderRate, onUpdateWeight,
  subReports, renderSubReport,
}: TeamMemberRowProps) {
  const [open, setOpen] = useState(false);
  const [subTeamOpen, setSubTeamOpen] = useState(false);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const cfg = STATUS_CONFIG[status];
  const { pct: autoPct, total: autoTotal } = usePersonAutomationPct(email);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#F5F5FF] dark:hover:bg-primary/5 group cursor-pointer border-b border-border/30 ${open ? "bg-[#F8FAFC] dark:bg-muted/10" : ""}`}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={avatarMap[name]} alt={name} className="object-cover" />
            <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{role} · {area}</p>
          </div>

          {/* OKR progress — semantic pill */}
          {(() => {
            const pct = Math.round(progress);
            const tone = pct > 50 ? { c: "#639922", bg: "rgba(99,153,34,0.10)" }
                       : pct >= 20 ? { c: "#EF9F27", bg: "rgba(239,159,39,0.10)" }
                                   : { c: "#E24B4A", bg: "rgba(226,75,74,0.10)" };
            return (
              <div
                className="hidden sm:inline-flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold"
                style={{ background: tone.bg, color: tone.c }}
                title={`OKRs ${pct}%`}
              >
                <Target className="h-3 w-3" />
                OKRs {pct}%
              </div>
            );
          })()}

          {/* Automation progress — semantic pill */}
          {(() => {
            const empty = autoTotal === 0;
            const pct = Math.round(autoPct ?? 0);
            const tone = empty
              ? { c: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" }
              : pct > 50 ? { c: "#639922", bg: "rgba(99,153,34,0.10)" }
              : pct >= 20 ? { c: "#EF9F27", bg: "rgba(239,159,39,0.10)" }
                          : { c: "#E24B4A", bg: "rgba(226,75,74,0.10)" };
            return (
              <div
                className="hidden sm:inline-flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold"
                style={{ background: tone.bg, color: tone.c }}
                title={empty ? "Sin automatizaciones" : `Automatización ${pct}%`}
              >
                <Sparkles className="h-3 w-3" />
                AUTO {empty ? "—" : `${pct}%`}
              </div>
            );
          })()}

          {/* Mobile compact view */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-foreground tabular-nums">{Math.round(progress)}%</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: "#639922" }}>
              {autoTotal === 0 ? "—" : `${Math.round(autoPct ?? 0)}%`}
            </span>
          </div>

          {subReports && subReports.length > 0 && (
            <span
              className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0"
              title={`${subReports.length} reporte(s) directo(s)`}
            >
              <Users className="h-3 w-3" />
              {subReports.length}
            </span>
          )}

          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="bg-[#F8FAFC] dark:bg-muted/5 border-b border-border/30 overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="px-5 py-4 pl-[60px]">
          <Tabs defaultValue="okrs">
            <TabsList className="bg-card border border-border h-8">
              <TabsTrigger value="okrs" className="gap-1.5 text-xs h-6">
                <Target className="h-3 w-3" />
                OKRs &amp; Check-ins
              </TabsTrigger>
              <TabsTrigger value="automation" className="gap-1.5 text-xs h-6">
                <Sparkles className="h-3 w-3" />
                Automatización
              </TabsTrigger>
            </TabsList>

            <TabsContent value="okrs" className="mt-3 space-y-3">
              {/* Toolbar superior: siempre visible para el líder */}
              {onAddKR && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Objetivos ({krs.length})
                  </span>
                  <Button
                    size="sm"
                    onClick={onAddKR}
                    className="gap-1.5 h-8 text-xs bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Agregar KR
                  </Button>
                </div>
              )}

              {/* Banner de validación de pesos — visible al líder, único que puede corregir */}
              {krs.length > 0 && (
                <WeightValidationBanner
                  weightSum={Math.round(krs.reduce((acc, k) => acc + (k.weight || 0) * 100, 0))}
                  krCount={krs.length}
                />
              )}
              {krs.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    Esta persona no tiene KRs asignados este mes. Usa <span className="font-semibold text-foreground">Agregar KR</span> para crear el primero.
                  </p>
                </div>
              ) : (
                <>
                  {krs.map(kr => (
                    <KRRow
                      key={kr.id}
                      kr={kr}
                      checkin={checkins[kr.id] || null}
                      pillar={krPillarMap[kr.id]}
                      areaOkrText={krAreaOkrMap?.[kr.id]}
                      onApprove={onApprove}
                      onAdjust={onAdjust}
                      onEdit={onEditKR}
                      onDelete={onDeleteKR}
                      onLeaderRate={onLeaderRate}
                      onUpdateWeight={onUpdateWeight}
                    />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="automation" className="mt-3">
              {email ? (
                <PersonAutomationPanel email={email} fullName={name} />
              ) : (
                <p className="text-xs text-muted-foreground italic py-3">
                  No se encontró el correo de {name.split(" ")[0]} para cargar sus tareas.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CollapsibleContent>

      {/* Sub-team (recursive): only for leaders with people under them */}
      {subReports && subReports.length > 0 && renderSubReport && (
        <Collapsible open={subTeamOpen} onOpenChange={setSubTeamOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-2 px-5 py-2 text-left text-[11px] font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors border-b border-border/30 cursor-pointer">
              <Users className="h-3 w-3" />
              <span>{subTeamOpen ? "Ocultar" : "Ver"} sub-equipo de {name.split(" ")[0]}</span>
              <span className="text-muted-foreground">({subReports.length})</span>
              {subTeamOpen ? (
                <ChevronDown className="h-3 w-3 ml-auto" />
              ) : (
                <ChevronRight className="h-3 w-3 ml-auto" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-l-2 border-primary/20 ml-5">
              {subReports.map((sub) => renderSubReport(sub))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Collapsible>
  );
}

/** Individual KR row inside the expanded section */
function KRRow({
  kr, checkin, pillar, areaOkrText, onApprove, onAdjust, onEdit, onDelete, onLeaderRate, onUpdateWeight,
}: {
  kr: PersonalKR;
  checkin: MonthlyCheckin | null;
  pillar?: string;
  areaOkrText?: string;
  onApprove: (krId: string) => void;
  onAdjust: (krId: string, percent: number, rating: StatusRating, feedback: string) => void;
  onEdit?: (kr: PersonalKR) => void;
  onDelete?: (kr: PersonalKR) => void;
  onLeaderRate?: (krId: string, percent: number, rating: StatusRating, comment: string) => void;
  onUpdateWeight?: (kr: PersonalKR, newWeight: number) => Promise<void> | void;
}) {
  const [showLeaderRate, setShowLeaderRate] = useState(false);
  const [leaderPercent, setLeaderPercent] = useState("");
  const [leaderRating, setLeaderRating] = useState<StatusRating | null>(null);
  const [leaderComment, setLeaderComment] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  // Display weights as percent (DB stores 0-1 decimal). Editable in-line.
  const initialWeightPct = Math.round((kr.weight || 0) * 100);
  const [weightDraft, setWeightDraft] = useState<string>(String(initialWeightPct));
  const [savingWeight, setSavingWeight] = useState(false);

  const flowStatus = checkin?.flow_status;
  const isClosed = flowStatus === "approved" || flowStatus === "adjusted";
  const isPending = flowStatus === "submitted";
  const ratingKey = checkin?.leader_adjusted_rating || checkin?.status_rating;
  const ratingInfo = ratingKey ? RATING_DISPLAY[ratingKey] : null;
  const percent = checkin?.leader_adjusted_percent ?? checkin?.progress_percent ?? 0;

  const commitWeight = async () => {
    const newPct = Math.max(0, Math.min(100, Number(weightDraft) || 0));
    if (newPct === initialWeightPct) return;
    if (!onUpdateWeight) return;
    // Optimistic UI: keep the field showing the draft value
    setSavingWeight(true);
    try {
      // DB stores weight as 0–1 decimal
      await onUpdateWeight(kr, newPct / 100);
    } finally {
      setSavingWeight(false);
    }
  };

  return (
    <div className="space-y-2 group/kr p-3 rounded-lg border border-border/30 bg-card/40 hover:border-border/60 hover:bg-card transition-colors min-w-0 overflow-hidden">
      {/* KR header row */}
      <div className="flex items-start gap-3 min-w-0">
        <Target className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
        <div className="flex-1 min-w-0">
          <p
            className="kr-title text-foreground line-clamp-2 normal-case break-words"
            style={{ textTransform: "none" }}
            title={formatKR(kr.name)}
          >
            {formatKR(kr.name)}
          </p>
          {(pillar || areaOkrText) && (
            <div className="mt-1.5 max-w-full">
              <OKRContextTags companyOkrText={pillar} areaOkrText={areaOkrText} />
            </div>
          )}


          {/* KR metrics */}
          <div className="flex items-center gap-3 mt-1 kr-meta-label">
            <span>Base: <strong className="text-foreground">{kr.baseline}</strong></span>
            <span>Meta: <strong className="text-foreground">{kr.target}</strong></span>
            {onUpdateWeight ? (
              <span className="flex items-center gap-1">
                Peso:
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weightDraft}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setWeightDraft(e.target.value)}
                  onBlur={commitWeight}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  disabled={savingWeight}
                  className="w-12 h-5 text-[11px] font-bold text-center rounded border border-border/50 bg-transparent focus:border-primary outline-none tabular-nums disabled:opacity-50"
                />
                <strong className="text-foreground">%</strong>
                {savingWeight && <span className="text-[9px] text-muted-foreground italic">guardando…</span>}
              </span>
            ) : (
              <span>Peso: <strong className="text-foreground">{Math.round((kr.weight || 0) * 100)}%</strong></span>
            )}
          </div>

          {/* Checkin data (if exists) */}
          {checkin && (
            <div className="mt-1.5 space-y-1.5">
              {/* Collaborator self-rating — compact inline */}
              {checkin.collaborator_comment && (
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Colaborador:
                  </span>
                  {checkin.status_rating && RATING_DISPLAY[checkin.status_rating] && (
                    <span className={`font-medium ${RATING_DISPLAY[checkin.status_rating].color}`}>
                      {RATING_DISPLAY[checkin.status_rating].emoji} {RATING_DISPLAY[checkin.status_rating].label}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {checkin.progress_percent}%
                  </span>
                  <span className="text-muted-foreground italic truncate max-w-[200px]" title={checkin.collaborator_comment}>
                    "{checkin.collaborator_comment}"
                  </span>
                </div>
              )}

              {/* Leader rating — compact inline */}
              {(checkin.leader_adjusted_percent != null || flowStatus === "approved") && (
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1">
                    {flowStatus === "approved" ? (
                      <><CheckCircle2 className="h-3 w-3" /> Aprobado</>
                    ) : (
                      <><Star className="h-3 w-3" /> Líder:</>
                    )}
                  </span>
                  {checkin.leader_adjusted_rating && RATING_DISPLAY[checkin.leader_adjusted_rating] && (
                    <span className={`font-medium ${RATING_DISPLAY[checkin.leader_adjusted_rating].color}`}>
                      {RATING_DISPLAY[checkin.leader_adjusted_rating].emoji} {RATING_DISPLAY[checkin.leader_adjusted_rating].label}
                    </span>
                  )}
                  {checkin.leader_adjusted_percent != null && (
                    <span className="text-muted-foreground">{checkin.leader_adjusted_percent}%</span>
                  )}
                  {checkin.leader_feedback && (
                    <span className="text-muted-foreground italic truncate max-w-[200px]" title={checkin.leader_feedback}>
                      "{checkin.leader_feedback}"
                    </span>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div className="h-1 rounded-full bg-muted/40 overflow-hidden max-w-[200px]">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* No checkin yet */}
          {!checkin && !showLeaderRate && (
            <p className="text-[11px] text-muted-foreground/70 mt-1 italic">Sin autocalificación aún</p>
          )}
        </div>

        {/* Action buttons (edit/delete) */}
        <div className="flex items-center gap-1 shrink-0 opacity-60 sm:opacity-0 sm:group-hover/kr:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(kr)}
              className="p-1 rounded hover:bg-muted/50 transition-colors bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground"
              title="Editar KR"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(kr)}
              className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors bg-transparent border-none cursor-pointer text-muted-foreground hover:text-rose-500"
              title="Eliminar KR"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Approval actions for submitted checkins */}
      {isPending && !isClosed && (
        <div className="ml-6 flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onApprove(kr.id)}
              className="gap-1.5 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="h-3 w-3" /> Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReject(!showReject)}
              className="gap-1.5 h-7 text-xs border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <XCircle className="h-3 w-3" /> Rechazar
            </Button>
          </div>
          {showReject && (
            <div className="space-y-2 animate-fade-in">
              <Textarea
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                placeholder="Comentario obligatorio..."
                rows={2}
                className="text-xs resize-none"
              />
              <Button
                size="sm"
                disabled={!rejectComment.trim()}
                onClick={() => {
                  onAdjust(kr.id, checkin!.progress_percent, checkin!.status_rating as StatusRating, rejectComment.trim());
                  setShowReject(false);
                  setRejectComment("");
                }}
                className="h-7 text-xs"
              >
                Enviar rechazo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Leader direct rating (when no checkin or wants to override) */}
      {!isClosed && !isPending && onLeaderRate && (
        <div className="ml-6">
          {!showLeaderRate ? (
            <button
              onClick={() => setShowLeaderRate(true)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
            >
              <Star className="h-3 w-3" /> Calificar directamente
            </button>
          ) : (
            <div className="space-y-2.5 animate-fade-in rounded-lg border border-border/30 bg-background p-3">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-wide">Tu calificación</p>

              {/* Rating pills */}
              <div className="flex rounded-lg border border-border/50 overflow-hidden h-7">
                {RATING_OPTIONS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setLeaderRating(r.key)}
                    className={`px-2.5 text-[10px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap border-r border-border/30 last:border-r-0 cursor-pointer ${
                      leaderRating === r.key ? `${r.bg} ${r.text}` : "text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-xs">{r.emoji}</span>
                    <span className="hidden sm:inline">{r.label}</span>
                  </button>
                ))}
              </div>

              {/* Percent */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground">Avance %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={leaderPercent}
                  onChange={e => setLeaderPercent(e.target.value)}
                  placeholder="—"
                  className="w-16 h-7 text-xs font-semibold text-center rounded-lg border border-border/50 bg-transparent focus:border-primary outline-none tabular-nums"
                />
              </div>

              {/* Comment */}
              <Textarea
                value={leaderComment}
                onChange={e => setLeaderComment(e.target.value)}
                placeholder="Comentario (opcional)..."
                rows={1}
                className="text-xs resize-none min-h-[28px] py-1.5"
              />

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={!leaderRating || leaderPercent === ""}
                  onClick={() => {
                    if (leaderRating && leaderPercent !== "") {
                      onLeaderRate(kr.id, Number(leaderPercent), leaderRating, leaderComment.trim());
                      setShowLeaderRate(false);
                      setLeaderPercent("");
                      setLeaderRating(null);
                      setLeaderComment("");
                    }
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" /> Guardar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLeaderRate(false)}
                  className="h-7 text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
