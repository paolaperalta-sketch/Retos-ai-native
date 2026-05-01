/**
 * Probation period utilities — Colombian labor law (2 months / 60 days)
 */

export const PROBATION_DAYS = 60;
export const CHECKIN_DAY = 30;
export const FINAL_EVAL_DAY = 57;

export interface ProbationStatus {
  isInProbation: boolean;
  daysElapsed: number;
  daysRemaining: number;
  progressPercent: number;
  needsCheckin: boolean;    // Day >= 30 and no checkin done
  needsFinalEval: boolean;  // Day >= 57 and no final eval done
  hireDate: Date | null;
}

export function calcProbationStatus(
  hireDateStr: string | null | undefined,
  hasCheckin: boolean = false,
  hasFinalEval: boolean = false
): ProbationStatus {
  if (!hireDateStr) {
    return {
      isInProbation: false,
      daysElapsed: 999,
      daysRemaining: 0,
      progressPercent: 100,
      needsCheckin: false,
      needsFinalEval: false,
      hireDate: null,
    };
  }

  const hireDate = new Date(hireDateStr);
  const now = new Date();
  const diffMs = now.getTime() - hireDate.getTime();
  const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isInProbation = daysElapsed >= 0 && daysElapsed <= PROBATION_DAYS;
  const daysRemaining = Math.max(0, PROBATION_DAYS - daysElapsed);
  const progressPercent = Math.min(100, Math.round((daysElapsed / PROBATION_DAYS) * 100));

  return {
    isInProbation,
    daysElapsed,
    daysRemaining,
    progressPercent,
    needsCheckin: isInProbation && daysElapsed >= CHECKIN_DAY && !hasCheckin,
    needsFinalEval: isInProbation && daysElapsed >= FINAL_EVAL_DAY && !hasFinalEval,
    hireDate,
  };
}

export const CHECKIN_QUESTIONS = [
  "¿El colaborador demuestra adaptación al equipo y la cultura de Bia?",
  "¿Está cumpliendo con las expectativas iniciales del cargo?",
  "¿Requiere apoyo adicional para su integración?",
];

export const LINKEDIN_SHARE_TEXT = encodeURIComponent(
  "¡Oficialmente parte del equipo Bia! Feliz de superar mi periodo de prueba en People Space. #BiaLegend #EnergyFintech"
);
