import { useMemo, useState } from "react";
import { ChevronDown, Sparkles, Clock, Target, Calendar, Plus, ExternalLink, MessageSquare, CheckCircle2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useOperationalTasks, useTaskComments } from "@/hooks/useOperationalTasks";
import { useAuth } from "@/contexts/AuthContext";
import {
  diasRestantes,
  estadoConfig,
  estadoSemaforo,
  FRECUENCIAS,
  minutosAhorradosMes,
  porcentajeAvance,
  semaforoConfig,
  totalHorasAhorradas,
  type Estado,
  type OperationalTask,
} from "@/lib/automation-utils";
import { TeamAutomationView } from "./TeamAutomationView";

export function AutomatizacionTareas() {
  const { role } = useAuth();
  const [open, setOpen] = useState(true);
  const isLeader = role === "team_leader" || role === "global_leader" || role === "super_admin";
  const [tab, setTab] = useState<"mias" | "equipo">("mias");

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-6">
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Automatización de Tareas</h2>
                <p className="text-xs text-muted-foreground">
                  OKR Mayo 2026 · Automatizar el 80% de tus tareas operativas
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border p-5 space-y-6">
            {isLeader ? (
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="mias">Mis tareas</TabsTrigger>
                  <TabsTrigger value="equipo">Mi equipo</TabsTrigger>
                </TabsList>
                <TabsContent value="mias" className="mt-4">
                  <CollaboratorAutomation />
                </TabsContent>
                <TabsContent value="equipo" className="mt-4">
                  <TeamAutomationView />
                </TabsContent>
              </Tabs>
            ) : (
              <CollaboratorAutomation />
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function CollaboratorAutomation() {
  const { period, tasks, loading, toggleAutomatizada, updateTask, createTask } = useOperationalTasks();
  const [filtro, setFiltro] = useState<"todas" | Estado>("todas");
  const [openTask, setOpenTask] = useState<OperationalTask | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () => (filtro === "todas" ? tasks : tasks.filter((t) => t.estado === filtro)),
    [tasks, filtro],
  );

  const pct = porcentajeAvance(tasks);
  const horas = totalHorasAhorradas(tasks);
  const auto = tasks.filter((t) => t.estado === "automatizada").length;
  const meta = period?.meta_porcentaje ?? 80;
  const restantes = period ? diasRestantes(period.fecha_fin) : 0;
  const sem = period ? estadoSemaforo(pct, meta, period.fecha_inicio, period.fecha_fin) : "en_camino";
  const semCfg = semaforoConfig[sem];

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Cargando tus tareas...</div>;
  }

  if (!period) {
    return <div className="text-sm text-muted-foreground py-8 text-center">No hay un periodo OKR activo.</div>;
  }

  if (!tasks.length) {
    return (
      <Card className="p-8 text-center bg-muted/20 border-dashed">
        <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          Aún no tienes tareas mapeadas. Empieza agregando una.
        </p>
        <NewTaskDialog open={creating} onOpenChange={setCreating} onCreate={createTask} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header OKR */}
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[10px]">OKR ACTIVO</Badge>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${semCfg.bg} ${semCfg.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${semCfg.dot}`} />
                {semCfg.label}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{period.nombre}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{period.descripcion}</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <Metric icon={Target} label="Avance" value={`${pct.toFixed(0)}%`} sub={`Meta ${meta}%`} />
            <Metric icon={CheckCircle2} label="Tareas" value={`${auto}/${tasks.length}`} sub="automatizadas" />
            <Metric icon={Clock} label="Ahorradas" value={`${horas.toFixed(1)}h`} sub="al mes" />
            <Metric icon={Calendar} label="Días" value={String(restantes)} sub="restantes" />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progreso hacia la meta del {meta}%</span>
            <span className="font-medium text-foreground">{pct.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(100, (pct / meta) * 100)} className="h-2" />
        </div>
      </Card>

      {/* Filtros + Nueva */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {(["todas", "pendiente", "en_progreso", "automatizada"] as const).map((f) => (
            <Button
              key={f}
              variant={filtro === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro(f)}
              className="h-8"
            >
              {f === "todas" ? "Todas" : estadoConfig[f].label}
              <span className="ml-1.5 text-[10px] opacity-70">
                {f === "todas" ? tasks.length : tasks.filter((t) => t.estado === f).length}
              </span>
            </Button>
          ))}
        </div>
        <NewTaskDialog open={creating} onOpenChange={setCreating} onCreate={createTask} />
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Tarea</TableHead>
              <TableHead className="w-28">Frecuencia</TableHead>
              <TableHead className="w-20 text-right">Min</TableHead>
              <TableHead className="w-28 text-right">Ahorro/mes</TableHead>
              <TableHead className="w-32">Estado</TableHead>
              <TableHead className="w-40">Herramienta</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id} className="group">
                <TableCell>
                  <Checkbox
                    checked={t.estado === "automatizada"}
                    onCheckedChange={() => toggleAutomatizada(t)}
                  />
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="text-sm text-foreground line-clamp-2">{t.descripcion}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {t.frecuencia}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">{t.tiempo_minutos}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {(minutosAhorradosMes(t) / 60).toFixed(1)}h
                </TableCell>
                <TableCell>
                  <Select
                    value={t.estado}
                    onValueChange={(v: Estado) =>
                      updateTask(t.id, {
                        estado: v,
                        fecha_automatizada: v === "automatizada" ? new Date().toISOString() : null,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_progreso">En progreso</SelectItem>
                      <SelectItem value="automatizada">Automatizada</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={t.herramienta_usada ?? ""}
                    onChange={(e) => updateTask(t.id, { herramienta_usada: e.target.value })}
                    placeholder="n8n, GPT, script..."
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setOpenTask(t)} className="h-8">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No hay tareas en este filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <TaskDetailDrawer task={openTask} onClose={() => setOpenTask(null)} onUpdate={updateTask} onToggle={toggleAutomatizada} />
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-md bg-background flex items-center justify-center border border-border">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-left">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {value} <span className="text-[10px] font-normal text-muted-foreground">{sub}</span>
        </p>
      </div>
    </div>
  );
}

function NewTaskDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (i: { descripcion: string; frecuencia: string; tiempo_minutos: number }) => Promise<void>;
}) {
  const [desc, setDesc] = useState("");
  const [freq, setFreq] = useState("Semanal");
  const [min, setMin] = useState("15");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4" /> Nueva tarea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarea operativa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Descripción</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Frecuencia</label>
              <Select value={freq} onValueChange={setFreq}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FRECUENCIAS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tiempo (min)</label>
              <Input type="number" value={min} onChange={(e) => setMin(e.target.value)} />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!desc.trim()}
            onClick={async () => {
              await onCreate({ descripcion: desc, frecuencia: freq, tiempo_minutos: parseInt(min) || 0 });
              setDesc("");
              setMin("15");
              onOpenChange(false);
            }}
          >
            Crear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskDetailDrawer({
  task,
  onClose,
  onUpdate,
  onToggle,
}: {
  task: OperationalTask | null;
  onClose: () => void;
  onUpdate: (id: string, p: Partial<OperationalTask>) => void;
  onToggle: (t: OperationalTask) => void;
}) {
  const { user } = useAuth();
  const { comments, addComment } = useTaskComments(task?.id ?? null);
  const [newComment, setNewComment] = useState("");
  const [evidencia, setEvidencia] = useState(task?.evidencia_url ?? "");

  if (!task) return null;

  return (
    <Sheet open={!!task} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Detalle de tarea</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Descripción</label>
            <Textarea
              defaultValue={task.descripcion}
              onBlur={(e) => onUpdate(task.id, { descripcion: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Evidencia (URL)</label>
            <div className="flex gap-2">
              <Input
                value={evidencia}
                onChange={(e) => setEvidencia(e.target.value)}
                onBlur={() => onUpdate(task.id, { evidencia_url: evidencia })}
                placeholder="https://..."
              />
              {evidencia && (
                <Button variant="outline" size="icon" asChild>
                  <a href={evidencia} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
              )}
            </div>
          </div>
          <Button
            variant={task.estado === "automatizada" ? "outline" : "default"}
            className="w-full"
            onClick={() => onToggle(task)}
          >
            <CheckCircle2 className="h-4 w-4" />
            {task.estado === "automatizada" ? "Marcar como pendiente" : "Marcar como automatizada"}
          </Button>

          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Comentarios</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="text-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-foreground">
                      {c.author_user_id === user?.id ? "Tú" : "Equipo"}
                    </span>
                    {c.is_leader_comment && (
                      <Badge variant="secondary" className="text-[9px] h-4">Líder</Badge>
                    )}
                    <span className="text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                  <p className="text-foreground">{c.comentario}</p>
                </div>
              ))}
              {!comments.length && (
                <p className="text-xs text-muted-foreground">Sin comentarios aún.</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={2}
              />
              <Button
                size="sm"
                onClick={async () => {
                  await addComment(newComment);
                  setNewComment("");
                }}
                disabled={!newComment.trim()}
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
