import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Trash2, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AppRole = "super_admin" | "global_leader" | "team_leader" | "individual_contributor";

const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: "Super Admin",
  global_leader: "Admin",
  team_leader: "Líder",
  individual_contributor: "Contribuidor Individual",
};

const ROLE_OPTIONS: AppRole[] = [
  "super_admin",
  "global_leader",
  "team_leader",
  "individual_contributor",
];

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  area: string | null;
  cargo: string | null;
  avatar_url: string | null;
  role: AppRole | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminUserManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, area, cargo, avatar_url")
      .is("deleted_at", null)
      .order("full_name", { ascending: true });

    if (pErr) {
      toast({ title: "Error cargando usuarios", description: pErr.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const ids = (profiles || []).map((p) => p.user_id);
    let rolesByUser: Record<string, AppRole> = {};
    if (ids.length > 0) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      (roles || []).forEach((r: any) => {
        rolesByUser[r.user_id] = r.role as AppRole;
      });
    }

    setUsers(
      (profiles || []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        area: p.area,
        cargo: p.cargo,
        avatar_url: p.avatar_url,
        role: rolesByUser[p.user_id] ?? null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const areas = useMemo(() => {
    const s = new Set<string>();
    users.forEach((u) => u.area && s.add(u.area));
    return Array.from(s).sort();
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (areaFilter !== "all" && u.area !== areaFilter) return false;
      if (!q) return true;
      return (
        u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, areaFilter]);

  const updateRole = async (user: UserRow, newRole: AppRole) => {
    if (user.role === newRole) return;
    setSavingRole(user.user_id);
    try {
      // Remove existing roles for this user, then insert the new one.
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.user_id);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase
        .from("user_roles")
        .insert({ user_id: user.user_id, role: newRole });
      if (insErr) throw insErr;

      setUsers((prev) =>
        prev.map((u) => (u.user_id === user.user_id ? { ...u, role: newRole } : u)),
      );
      toast({ title: "Rol actualizado", description: `${user.full_name} ahora es ${ROLE_LABEL[newRole]}.` });
    } catch (e: any) {
      toast({ title: "No se pudo actualizar el rol", description: e.message, variant: "destructive" });
    } finally {
      setSavingRole(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmText.trim() !== deleteTarget.full_name.trim()) {
      toast({
        title: "Confirmación incorrecta",
        description: "Escribe el nombre exacto del usuario para confirmar.",
        variant: "destructive",
      });
      return;
    }
    setDeleting(true);
    const now = new Date().toISOString();
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ deleted_at: now })
        .eq("user_id", deleteTarget.user_id);
      if (pErr) throw pErr;

      // Mirror to users_master by email (best-effort; ignore if no row)
      await supabase
        .from("users_master")
        .update({ deleted_at: now })
        .eq("email", deleteTarget.email);

      setUsers((prev) => prev.filter((u) => u.user_id !== deleteTarget.user_id));
      toast({
        title: "Usuario eliminado",
        description: `${deleteTarget.full_name} ya no aparecerá en People Space.`,
      });
      setDeleteTarget(null);
      setDeleteConfirmText("");
    } catch (e: any) {
      toast({ title: "No se pudo eliminar", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Gestión de Usuarios</h3>
            <p className="text-xs text-muted-foreground">
              Administra roles y accesos de las personas en People Space
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground tabular-nums">{filtered.length}</p>
          <p className="text-[10px] text-muted-foreground">usuarios visibles</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="pl-9 h-9"
          />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Filtrar por área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las áreas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando usuarios…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground italic">
          No se encontraron usuarios con los filtros actuales.
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 divide-y divide-border/40 overflow-hidden">
          {filtered.map((u) => (
            <div
              key={u.user_id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors flex-wrap sm:flex-nowrap"
            >
              <Avatar className="h-9 w-9 shrink-0">
                {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.full_name} />}
                <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
                  {initials(u.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>

              <div className="hidden md:flex flex-col min-w-[140px] max-w-[220px]">
                <span className="text-xs text-foreground truncate" title={u.cargo ?? ""}>
                  {u.cargo || "—"}
                </span>
                <span className="text-[11px] text-muted-foreground truncate" title={u.area ?? ""}>
                  {u.area || "Sin área"}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                <Select
                  value={u.role ?? "individual_contributor"}
                  onValueChange={(v) => updateRole(u, v as AppRole)}
                  disabled={savingRole === u.user_id}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {savingRole === u.user_id && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDeleteTarget(u);
                  setDeleteConfirmText("");
                }}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Eliminar usuario"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirmText("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <DialogTitle>Eliminar usuario</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm">
              Esta acción eliminará a{" "}
              <strong className="text-foreground">{deleteTarget?.full_name}</strong> de la
              plataforma. Ya no aparecerá en ningún equipo, reporte ni módulo de People Space.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Para confirmar, escribe el nombre completo del usuario:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteTarget?.full_name}
              className="text-sm"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteConfirmText("");
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={
                deleting || deleteConfirmText.trim() !== (deleteTarget?.full_name.trim() ?? "")
              }
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar definitivamente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
