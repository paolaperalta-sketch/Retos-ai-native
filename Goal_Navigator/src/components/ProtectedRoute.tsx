import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/lib/rbac";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requireTeamAccess?: boolean;
  requireEnpsAccess?: boolean;
  requireAdminAccess?: boolean;
  requireQAAccess?: boolean;
  /** Route is the eNPS module itself (skip eNPS-only redirect). */
  isEnpsRoute?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireTeamAccess, requireEnpsAccess, requireAdminAccess, requireQAAccess, isEnpsRoute }: ProtectedRouteProps) {
  const { session, role, user, isLoading, hasProfile, refreshProfile } = useAuth();
  const [autoCreating, setAutoCreating] = useState(false);
  const [autoCreateTried, setAutoCreateTried] = useState(false);

  // Si el usuario está autenticado pero no tiene profile, intentar crearlo
  // automáticamente desde users_master antes de mandarlo a /setup.
  useEffect(() => {
    if (
      session?.user &&
      hasProfile === false &&
      !autoCreateTried &&
      !autoCreating
    ) {
      setAutoCreating(true);
      (async () => {
        try {
          const { data, error } = await supabase.rpc("auto_create_profile_from_master", {
            _user_id: session.user.id,
          });
          if (!error && data === true) {
            await refreshProfile();
          }
        } catch (e) {
          console.warn("auto_create_profile_from_master failed", e);
        } finally {
          setAutoCreateTried(true);
          setAutoCreating(false);
        }
      })();
    }
  }, [session, hasProfile, autoCreateTried, autoCreating, refreshProfile]);

  if (isLoading || autoCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (hasProfile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasProfile) {
    // Solo mandar a /setup si ya intentamos auto-crear y no había datos en users_master
    if (!autoCreateTried) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }
    return <Navigate to="/setup" replace />;
  }

  const permissions = getUserPermissions(user?.email, role);

  // eNPS-only users are restricted to the eNPS module
  const isEnpsOnly = !permissions.canSeeTeam && !permissions.canSeeOKRs && permissions.canSeeEnps;
  if (isEnpsOnly && !isEnpsRoute) {
    return <Navigate to="/enps" replace />;
  }

  if (requireTeamAccess && !permissions.canSeeTeam) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  if (requireEnpsAccess && !permissions.canSeeEnps) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  if (requireAdminAccess && !permissions.canSeeAdminPanel) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  if (requireQAAccess && !permissions.canSeeQA) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  if (allowedRoles && permissions.effectiveRole && !allowedRoles.includes(permissions.effectiveRole)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <>{children}</>;
}
