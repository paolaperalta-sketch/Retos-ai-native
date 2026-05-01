import {
  Target,
  TrendingUp,
  Star,
  Users,
  BarChart3,
  HeartHandshake,
  GraduationCap,
  Building2,
  ShieldCheck,
  LogOut,
  ChevronUp,
  User as UserIcon,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/lib/rbac";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { sentenceCaseTitle } from "@/lib/text-utils";

type NavItem = {
  to?: string;
  icon: LucideIcon;
  label: string;
  visible?: boolean;
  disabled?: boolean;
  badge?: string;
};

type Cluster = {
  label: string;
  visible: boolean;
  items: NavItem[];
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { signOut, user, role } = useAuth();

  const permissions = getUserPermissions(user?.email, role);

  const googleAvatar =
    (user?.user_metadata as any)?.avatar_url ||
    (user?.user_metadata as any)?.picture ||
    null;
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.id || googleAvatar) return;
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfileAvatar(data?.avatar_url ?? null));
  }, [user?.id, googleAvatar]);
  const avatarUrl = googleAvatar || profileAvatar;
  const displayName =
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    permissions.userName ||
    user?.email ||
    "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const clusters: Cluster[] = [
    {
      label: "Estrategia",
      visible: true,
      items: [
        { to: "/okrs", icon: Target, label: "Objetivos de compañía" },
      ],
    },
    {
      label: "Mi Espacio",
      visible: true,
      items: [
        { to: "/desempeno", icon: TrendingUp, label: "Mi desempeño" },
        { icon: Star, label: "Mi performance review", disabled: true, badge: "Próximamente" },
      ],
    },
    {
      label: "Mi Equipo",
      visible: permissions.canSeeTeam,
      items: [
        { to: "/equipo", icon: Users, label: "Desempeño del equipo" },
        { icon: BarChart3, label: "Performance del equipo", disabled: true, badge: "Próximamente" },
        { to: "/enps", icon: HeartHandshake, label: "Clima (eNPS)", visible: permissions.canSeeEnps },
      ].filter((i) => i.visible !== false),
    },
    {
      label: "Bia Academy",
      visible: true,
      items: [
        { to: "/onboarding", icon: GraduationCap, label: "Onboarding" },
      ],
    },
    {
      label: "Administración",
      visible: permissions.canSeeAdminPanel || permissions.canSeeQA,
      items: [
        { to: "/admin", icon: Building2, label: "Panel empresa", visible: permissions.canSeeAdminPanel },
        { to: "/admin/qa", icon: ShieldCheck, label: "Validación QA", visible: permissions.canSeeQA },
      ].filter((i) => i.visible !== false),
    },
  ].filter((c) => c.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo — sticky top */}
        <div className="sticky top-0 z-20 bg-sidebar p-4 flex items-center gap-3 border-b border-sidebar-border shrink-0">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-foreground">Bia</p>
              <p className="text-[11px] text-muted-foreground">People Space</p>
            </div>
          )}
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto">
          {clusters
            .filter((c) => c.visible)
            .map((cluster, idx) => (
              <SidebarGroup
                key={cluster.label}
                className={idx > 0 ? "border-t border-sidebar-border/50 pt-2" : ""}
              >
                {!collapsed && (
                  <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70 font-medium">
                    {cluster.label}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {cluster.items.map((item) => {
                      const Icon = item.icon;
                      const active = !!item.to && path === item.to;
                      const key = item.to || item.label;

                      if (item.disabled) {
                        return (
                          <SidebarMenuItem key={key}>
                            <SidebarMenuButton
                              className="cursor-default font-normal text-muted-foreground/60 hover:bg-transparent hover:text-muted-foreground/60 pointer-events-none"
                              tooltip={collapsed ? item.label : undefined}
                            >
                              <Icon className="mr-2 h-4 w-4" />
                              {!collapsed && (
                                <>
                                  <span className="text-sm font-normal">{item.label}</span>
                                  {item.badge && (
                                    <span className="ml-auto text-[10px] font-normal text-muted-foreground/70 bg-muted/50 border border-border/60 rounded px-1.5 py-px">
                                      {item.badge}
                                    </span>
                                  )}
                                </>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      }

                      const prefetch = () => {
                        if (!item.to) return;
                        // Warm the route bundle + data caches before the user clicks.
                        switch (item.to) {
                          case "/enps":
                            import("@/pages/EnpsDashboard.tsx");
                            import("@/lib/enpsData").then(m => m.loadENPSData());
                            import("@/lib/rawDataContext").then(m => m.loadRawResponses());
                            import("@/lib/valoresData").then(m => m.loadValoresData());
                            break;
                          case "/admin/qa":
                            import("@/pages/AdminQA.tsx");
                            break;
                          case "/admin":
                            import("@/pages/AdminPanel.tsx");
                            break;
                          case "/equipo":
                            import("@/pages/Equipo.tsx");
                            break;
                          case "/desempeno":
                            import("@/pages/Desempeno.tsx");
                            break;
                          case "/onboarding":
                            import("@/pages/Onboarding.tsx");
                            break;
                        }
                      };
                      return (
                        <SidebarMenuItem key={key}>
                          <SidebarMenuButton
                            onClick={() => item.to && navigate(item.to)}
                            onMouseEnter={prefetch}
                            onFocus={prefetch}
                            className={`cursor-pointer ${
                              active
                                ? "bg-sidebar-accent text-primary font-medium [&>svg]:text-primary"
                                : "font-normal text-foreground"
                            }`}
                            tooltip={collapsed ? item.label : undefined}
                          >
                            <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {!collapsed && <span className="text-sm">{item.label}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
        </div>

        {/* Profile dropdown — sticky bottom */}
        <div className="sticky bottom-0 z-20 mt-auto border-t border-sidebar-border/60 bg-sidebar shrink-0">
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`w-full flex items-center gap-2.5 p-3 hover:bg-sidebar-accent/50 transition-colors ${
                    collapsed ? "justify-center" : ""
                  }`}
                  aria-label="Abrir menú de perfil"
                >
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-border/50">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-medium text-foreground truncate leading-tight">
                          {sentenceCaseTitle(displayName)}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 truncate leading-tight mt-0.5">
                          {permissions.effectiveRole === "super_admin" && "Super admin"}
                          {permissions.effectiveRole === "global_leader" && `Admin · ${sentenceCaseTitle(permissions.userArea || "")}`}
                          {permissions.effectiveRole === "team_leader" && "Líder"}
                          {permissions.effectiveRole === "individual_contributor" && "Colaborador"}
                        </p>
                      </div>
                      <ChevronUp className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    </>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56 p-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-150"
              >
                <button
                  onClick={() => navigate("/desempeno")}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-md hover:bg-accent text-foreground transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Mi perfil</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
