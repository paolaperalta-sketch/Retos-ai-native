import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/lib/rbac";
import { User, Users, Building2 } from "lucide-react";

const VIEWS: Array<{ path: string; label: string; icon: typeof User; requireTeam?: boolean; requireAdmin?: boolean }> = [
  { path: "/desempeno", label: "Mi Desempeño", icon: User },
  { path: "/equipo", label: "Mi Equipo", icon: Users, requireTeam: true },
  { path: "/admin", label: "Global Empresa", icon: Building2, requireAdmin: true },
];

export function ViewModeSwitcher() {
  const { user, role } = useAuth();
  const permissions = getUserPermissions(user?.email, role);
  const location = useLocation();
  const navigate = useNavigate();

  const availableViews = VIEWS.filter(v => {
    if (v.requireTeam && !permissions.canSeeTeam) return false;
    if (v.requireAdmin && !permissions.canSeeAdminPanel) return false;
    return true;
  });

  if (availableViews.length <= 1) return null;

  const currentView = availableViews.find(v => location.pathname.startsWith(v.path));

  return (
    <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
      {availableViews.map(view => {
        const Icon = view.icon;
        const isActive = currentView?.path === view.path;
        return (
          <button
            key={view.path}
            onClick={() => navigate(view.path)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
