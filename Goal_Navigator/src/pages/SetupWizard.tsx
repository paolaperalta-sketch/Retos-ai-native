import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, ChevronRight, ChevronLeft, Check, User, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AREAS = [
  "OPERACIONES", "CX", "SALES", "MARKETING", "FINANCE",
  "LEGAL", "PEOPLE", "COMPANY", "ENERGY", "TECNOLOGÍA",
];

interface LeaderOption {
  full_name: string;
  cargo: string | null;
  area: string | null;
  subarea: string | null;
  email: string | null;
}

const sanitize = (val: string) =>
  val.replace(/[^A-ZÁÉÍÓÚÑÜ\s\-\.]/gi, "").toUpperCase();

const SetupWizard = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [cargo, setCargo] = useState("");

  // Step 2
  const [area, setArea] = useState("");

  // Step 3
  const [leaders, setLeaders] = useState<LeaderOption[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<LeaderOption | null>(null);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const [leadersError, setLeadersError] = useState<string | null>(null);

  // ── Bootstrap: si el usuario ya tiene perfil o existe en users_master,
  //    saltarse el wizard completamente.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        // 1) ¿Ya tiene profile?
        const { data: existing } = await supabase
          .from("profiles")
          .select("id, onboarding_completed_at")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .maybeSingle();

        if (cancelled) return;

        if (existing) {
          await refreshProfile();
          navigate("/", { replace: true });
          return;
        }

        // 2) ¿Está en users_master? Auto-crear perfil sin preguntar.
        const { data: created } = await supabase.rpc(
          "auto_create_profile_from_master",
          { _user_id: user.id }
        );
        if (cancelled) return;
        if (created === true) {
          await refreshProfile();
          navigate("/", { replace: true });
          return;
        }
      } catch (e) {
        console.warn("SetupWizard bootstrap failed", e);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Pre-fill name from Google metadata
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata;
      if (meta?.full_name) setFullName(sanitize(meta.full_name));
      else if (meta?.name) setFullName(sanitize(meta.name));
    }
  }, [user]);

  // Reset leader when area changes
  useEffect(() => {
    setSelectedLeader(null);
    setLeaders([]);
    setLeadersError(null);
  }, [area]);

  // Fetch leaders when entering step 3 — query directly (no edge function)
  useEffect(() => {
    if (step !== 3 || !area) return;
    const fetchLeaders = async () => {
      setIsLoadingLeaders(true);
      setLeadersError(null);
      try {
        // Query the table directly: leaders in this area + CEO (EXECUTIVE)
        const { data, error } = await supabase
          .from("leader_directory")
          .select("full_name, cargo, area, subarea, email")
          .or(`area.eq.${area},area.eq.EXECUTIVE`)
          .order("full_name");

        if (error) throw error;

        // Exclude the current user (you cannot be your own leader)
        const filtered = (data || []).filter(
          (l) => !user?.email || l.email?.toLowerCase() !== user.email.toLowerCase()
        );

        setLeaders(filtered as LeaderOption[]);
      } catch (err: any) {
        setLeadersError(err?.message || "No se pudieron cargar los líderes. Verifica tu conexión.");
        setLeaders([]);
      } finally {
        setIsLoadingLeaders(false);
      }
    };
    fetchLeaders();
  }, [step, area, user?.email]);

  const canProceed = () => {
    if (step === 1) return fullName.trim().length >= 2 && cargo.trim().length >= 2;
    if (step === 2) return !!area;
    if (step === 3) return !!selectedLeader;
    return false;
  };

  const handleFinish = async () => {
    if (!user || !selectedLeader) return;
    setIsSubmitting(true);
    try {
      const avatarUrl =
        (user.user_metadata as any)?.avatar_url ||
        (user.user_metadata as any)?.picture ||
        null;

      // UPSERT por user_id: si ya existe, no rompe — solo actualiza updated_at
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            email: user.email!,
            full_name: fullName.trim(),
            cargo: cargo.trim(),
            area,
            manager_email: selectedLeader.email || selectedLeader.full_name,
            avatar_url: avatarUrl,
            onboarding_completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id", ignoreDuplicates: false }
        );
      if (profileError) {
        // Mensaje amigable si por alguna razón vuelve duplicate key
        const msg = profileError.message || "";
        if (msg.includes("duplicate key") || msg.includes("profiles_user_id_key")) {
          toast({ title: "Tu perfil ya existe", description: "Iniciando sesión..." });
          await refreshProfile();
          navigate("/", { replace: true });
          return;
        }
        throw profileError;
      }

      // Rol por defecto — solo si aún no tiene uno
      await supabase
        .from("user_roles")
        .upsert(
          { user_id: user.id, role: "individual_contributor" },
          { onConflict: "user_id,role", ignoreDuplicates: true }
        );

      await refreshProfile();
      toast({
        title: "¡Bienvenido a Bia!",
        description: "Tu ruta de Onboarding ya está lista para empezar.",
      });
      navigate("/journey", { replace: true });
    } catch (err: any) {
      toast({
        title: "Error al crear perfil",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("");

  const stepIcons = [
    <User key="1" className="h-5 w-5" />,
    <Building2 key="2" className="h-5 w-5" />,
    <Users key="3" className="h-5 w-5" />,
  ];
  const stepLabels = ["Datos personales", "Área", "Líder directo"];

  // Mientras chequeamos si el usuario ya existe → spinner (no mostrar wizard).
  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg border-border/50 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bienvenido a People Space</h1>
          <p className="text-sm text-muted-foreground mt-1">Completa tu perfil para comenzar</p>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center h-9 w-9 rounded-full transition-colors ${
                    s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <Check className="h-4 w-4" /> : stepIcons[s - 1]}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Paso {step} de 3 — {stepLabels[step - 1]}
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Step 1: Name & Cargo */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  placeholder="TU NOMBRE COMPLETO"
                  value={fullName}
                  onChange={(e) => setFullName(sanitize(e.target.value))}
                  className="uppercase tracking-wide text-base h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  placeholder="EJ: ANALISTA DE DATOS, VP SALES"
                  value={cargo}
                  onChange={(e) => setCargo(sanitize(e.target.value))}
                  className="uppercase tracking-wide text-base h-12"
                />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Escribe tu cargo exactamente como aparece en tu contrato laboral. Esto garantiza la validez de tu perfil en People Space.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Area */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Área</Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona tu área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Leader (filtered by area) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>¿Quién es tu líder directo?</Label>
                <p className="text-xs text-muted-foreground">
                  Mostrando líderes del área <span className="font-semibold text-foreground">{area}</span>
                </p>
              </div>

              {isLoadingLeaders && (
                <p className="text-sm text-muted-foreground text-center py-6">Cargando líderes...</p>
              )}

              {!isLoadingLeaders && leadersError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
                  <p className="text-sm text-destructive font-medium">No se pudieron cargar los líderes</p>
                  <p className="text-xs text-muted-foreground">{leadersError}</p>
                  <button
                    onClick={() => setArea((a) => a)}
                    className="text-xs text-primary hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {!isLoadingLeaders && !leadersError && leaders.length === 0 && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No se encontraron líderes en esta área. Contacta a People Space.
                  </p>
                </div>
              )}

              {!isLoadingLeaders && leaders.length > 0 && (
                <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                  {leaders.map((l) => {
                    const isSelected = selectedLeader?.full_name === l.full_name;
                    return (
                      <button
                        key={l.full_name}
                        type="button"
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                          isSelected
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "hover:bg-accent"
                        }`}
                        onClick={() => setSelectedLeader(l)}
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(l.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground uppercase tracking-wide truncate">
                            {l.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase truncate">
                            {l.cargo} · {l.subarea}
                          </p>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="gap-1"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!canProceed() || isSubmitting}
                className="gap-1"
              >
                {isSubmitting ? "Creando perfil..." : "Finalizar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupWizard;
