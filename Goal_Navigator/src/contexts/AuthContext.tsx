import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "global_leader" | "team_leader" | "individual_contributor";

interface ImpersonationTarget {
  email: string;
  fullName: string;
  role: AppRole;
  userId?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  hasProfile: boolean | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Impersonation (super_admin only)
  realUser: User | null;
  realRole: AppRole | null;
  impersonating: ImpersonationTarget | null;
  startImpersonation: (target: ImpersonationTarget) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  hasProfile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  realUser: null,
  realRole: null,
  impersonating: null,
  startImpersonation: () => {},
  stopImpersonation: () => {},
});

export const useAuth = () => useContext(AuthContext);

const IMPERSONATION_KEY = "ps_impersonation_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [realUser, setRealUser] = useState<User | null>(null);
  const [realRole, setRealRole] = useState<AppRole | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<ImpersonationTarget | null>(() => {
    try {
      const raw = localStorage.getItem(IMPERSONATION_KEY);
      return raw ? (JSON.parse(raw) as ImpersonationTarget) : null;
    } catch {
      return null;
    }
  });
  const initializedRef = useRef(false);
  const fetchingRef = useRef(false);

  const fetchRoleAndProfile = async (userId: string, currentUser?: User | null) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [{ data: roleData, error: roleError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase.rpc("get_user_role", { _user_id: userId }),
        supabase.from("profiles").select("id, avatar_url").eq("user_id", userId).maybeSingle(),
      ]);

      if (roleError) console.error("Error loading user role", roleError);
      if (profileError) console.error("Error loading user profile", profileError);

      setRealRole(roleError ? null : ((roleData as AppRole) || null));
      setHasProfile(profileError ? false : !!profileData);

      const googleAvatar =
        (currentUser?.user_metadata as any)?.avatar_url ||
        (currentUser?.user_metadata as any)?.picture ||
        null;
      if (profileData && googleAvatar && profileData.avatar_url !== googleAvatar) {
        supabase
          .from("profiles")
          .update({ avatar_url: googleAvatar })
          .eq("user_id", userId)
          .then(({ error }) => {
            if (error) console.warn("Could not sync Google avatar to profile", error.message);
          });
      }
    } catch (error) {
      console.error("Error loading auth context", error);
      setRealRole(null);
      setHasProfile(false);
    } finally {
      fetchingRef.current = false;
    }
  };

  const refreshProfile = async () => {
    if (realUser) {
      fetchingRef.current = false;
      await fetchRoleAndProfile(realUser.id, realUser);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!initializedRef.current) return;
        setSession(newSession);
        setRealUser(newSession?.user ?? null);
        if (newSession?.user) {
          fetchingRef.current = false;
          fetchRoleAndProfile(newSession.user.id, newSession.user);
        } else {
          setRealRole(null);
          setHasProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: restoredSession } }) => {
      initializedRef.current = true;
      setSession(restoredSession);
      setRealUser(restoredSession?.user ?? null);
      if (restoredSession?.user) {
        fetchRoleAndProfile(restoredSession.user.id, restoredSession.user).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(IMPERSONATION_KEY);
    setImpersonating(null);
    await supabase.auth.signOut();
    setSession(null);
    setRealUser(null);
    setRealRole(null);
    setHasProfile(null);
  };

  const startImpersonation = (target: ImpersonationTarget) => {
    // Only super_admin can impersonate
    if (realRole !== "super_admin") {
      console.warn("Only super_admin can impersonate");
      return;
    }
    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(target));
    setImpersonating(target);
  };

  const stopImpersonation = () => {
    localStorage.removeItem(IMPERSONATION_KEY);
    setImpersonating(null);
  };

  // Build the effective user: if impersonating, override id, email + metadata
  const effectiveUser = useMemo<User | null>(() => {
    if (!realUser) return null;
    if (!impersonating || realRole !== "super_admin") return realUser;
    return {
      ...realUser,
      id: impersonating.userId || realUser.id,
      email: impersonating.email,
      user_metadata: {
        ...(realUser.user_metadata || {}),
        full_name: impersonating.fullName,
        name: impersonating.fullName,
        avatar_url: undefined,
        picture: undefined,
      },
    } as User;
  }, [realUser, impersonating, realRole]);

  const effectiveRole: AppRole | null =
    impersonating && realRole === "super_admin" ? impersonating.role : realRole;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: effectiveUser,
        role: effectiveRole,
        hasProfile,
        isLoading,
        signOut,
        refreshProfile,
        realUser,
        realRole,
        impersonating,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
