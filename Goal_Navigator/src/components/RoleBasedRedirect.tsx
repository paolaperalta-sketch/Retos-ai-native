import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/lib/rbac";

/**
 * Smart redirect based on user role:
 * - Leaders/Admins → /equipo
 * - Individual contributors → /desempeno
 */
export function RoleBasedRedirect() {
  const { session, user, role, isLoading, hasProfile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Still loading profile check
  if (hasProfile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasProfile) {
    return <Navigate to="/setup" replace />;
  }

  const permissions = getUserPermissions(user?.email, role);

  // eNPS-only preview users land directly in eNPS
  if (!permissions.canSeeTeam && !permissions.canSeeOKRs && permissions.canSeeEnps) {
    return <Navigate to="/enps" replace />;
  }

  // Leaders default to team view, ICs to personal performance
  if (permissions.canSeeTeam) {
    return <Navigate to="/equipo" replace />;
  }

  return <Navigate to="/desempeno" replace />;
}
