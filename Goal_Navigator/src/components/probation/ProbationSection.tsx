import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calcProbationStatus, ProbationStatus } from "@/lib/probation-utils";
import { ProbationBadge } from "./ProbationBadge";
import { AdaptationGoals } from "./AdaptationGoals";
import { CheckinForm } from "./CheckinForm";
import { BiaLegendCelebration } from "./BiaLegendCelebration";
import { AlertTriangle, Calendar, ClipboardCheck, PartyPopper } from "lucide-react";

interface ProbationSectionProps {
  targetUserEmail: string;
  targetUserId: string;
  targetName: string;
  canManage: boolean; // leader or super_admin
}

export function ProbationSection({ targetUserEmail, targetUserId, targetName, canManage }: ProbationSectionProps) {
  const { user } = useAuth();
  const [hireDate, setHireDate] = useState<string | null>(null);
  const [hasCheckin, setHasCheckin] = useState(false);
  const [hasFinalEval, setHasFinalEval] = useState(false);
  const [passedProbation, setPassedProbation] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [targetUserEmail, targetUserId]);

  const loadData = async () => {
    // Get hire_date from users_master
    const { data: masterData } = await supabase
      .from("users_master")
      .select("hire_date")
      .eq("email", targetUserEmail)
      .maybeSingle();

    setHireDate(masterData?.hire_date || null);

    // Get evaluations
    const { data: evals } = await supabase
      .from("probation_evaluations")
      .select("evaluation_type, passed_probation, submitted_at")
      .eq("user_id", targetUserId);

    const checkin = evals?.find(e => e.evaluation_type === "checkin" && e.submitted_at);
    const final_ = evals?.find(e => e.evaluation_type === "final" && e.submitted_at);

    setHasCheckin(!!checkin);
    setHasFinalEval(!!final_);
    setPassedProbation(final_?.passed_probation ?? null);
    setLoading(false);
  };

  if (loading) return null;

  const status = calcProbationStatus(hireDate, hasCheckin, hasFinalEval);

  // If not in probation and already passed or no hire date → don't show
  if (!status.isInProbation && passedProbation !== false && !status.needsFinalEval) {
    // Show celebration if just passed
    if (passedProbation === true) {
      return (
        <div className="rounded-xl border border-success/30 bg-success-bg/20 p-4">
          <div className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-success" />
            <span className="text-sm font-semibold text-foreground">Bia Legend ✓</span>
            <span className="text-xs text-muted-foreground">Periodo de prueba superado exitosamente</span>
          </div>
        </div>
      );
    }
    return null;
  }

  if (!status.isInProbation) return null;

  const handleCheckinSubmitted = () => {
    setHasCheckin(true);
  };

  const handleFinalSubmitted = () => {
    loadData().then(() => {
      // Check if passed
      supabase
        .from("probation_evaluations")
        .select("passed_probation")
        .eq("user_id", targetUserId)
        .eq("evaluation_type", "final")
        .maybeSingle()
        .then(({ data }) => {
          if (data?.passed_probation === true) {
            setCelebrationOpen(true);
          }
          setPassedProbation(data?.passed_probation ?? null);
          setHasFinalEval(true);
        });
    });
  };

  return (
    <div className="space-y-4">
      {/* Probation Status Card */}
      <div className="rounded-xl border border-warning/30 bg-warning-bg/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <ProbationBadge daysRemaining={status.daysRemaining} />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Ingreso: {status.hireDate?.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-warning transition-all duration-500"
            style={{ width: `${status.progressPercent}%` }}
          />
          {/* 30-day marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/20" style={{ left: "50%" }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Día {status.daysElapsed}</span>
          <span>Día 30</span>
          <span>Día 60</span>
        </div>

        {/* Alert actions for leader */}
        {canManage && (
          <div className="flex flex-wrap gap-2 mt-4">
            {status.needsCheckin && (
              <button
                onClick={() => setCheckinOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-none cursor-pointer animate-pulse"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Completar Check-in Mes 1
              </button>
            )}
            {hasCheckin && !status.needsCheckin && !hasFinalEval && status.daysElapsed < 57 && (
              <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-success-bg text-success-foreground">
                ✓ Check-in completado
              </span>
            )}
            {status.needsFinalEval && (
              <button
                onClick={() => setFinalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-danger text-primary-foreground hover:bg-danger/90 transition-colors border-none cursor-pointer animate-pulse"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Evaluación Final Obligatoria
              </button>
            )}
          </div>
        )}
      </div>

      {/* Adaptation Goals */}
      <AdaptationGoals targetUserId={targetUserId} canManage={canManage} />

      {/* Modals */}
      <CheckinForm
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        targetUserId={targetUserId}
        targetName={targetName}
        evaluationType="checkin"
        onSubmitted={handleCheckinSubmitted}
      />
      <CheckinForm
        open={finalOpen}
        onClose={() => setFinalOpen(false)}
        targetUserId={targetUserId}
        targetName={targetName}
        evaluationType="final"
        onSubmitted={handleFinalSubmitted}
      />
      <BiaLegendCelebration
        open={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        collaboratorName={targetName}
      />
    </div>
  );
}
