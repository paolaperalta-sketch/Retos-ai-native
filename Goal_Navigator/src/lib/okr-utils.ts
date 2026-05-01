import { PersonalKR, Status } from "@/types/okr";

/** Calculate KR progress as percentage */
export function calcKRProgress(kr: PersonalKR): number {
  if (kr.target === kr.baseline) return 0;
  return ((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100;
}

/** Calculate weighted progress for a set of KRs */
export function calcWeightedProgress(krs: PersonalKR[]): number {
  if (krs.length === 0) return 0;
  return krs.reduce((sum, kr) => sum + calcKRProgress(kr) * (kr.weight / 100), 0);
}

/** Derive status from progress */
export function progressToStatus(progress: number): Status {
  return progress >= 70 ? "on_track" : progress >= 40 ? "at_risk" : "off_track";
}

/** Sum of weights */
export function calcWeightSum(krs: PersonalKR[]): number {
  return krs.reduce((s, kr) => s + kr.weight, 0);
}

/** Category tag for a company OKR name */
const OKR_CATEGORY_MAP: Record<string, string> = {
  "GROWTH ENGINE": "Growth",
  "BRASIL": "Growth",
  "LIFECYCLE": "Flywheel",
  "AI NATIVE": "Transversal",
  "BANKING & BANCABILIDAD": "Growth",
  "DATA COMO FUENTE DE VERDAD": "Flywheel",
  "PREDICTABLE FINANCE": "Inteligencia para el crecimiento rentable",
  "GENERACIÓN ENERGÉTICA": "Flywheel",
  "FINANCE ENERGY": "Inteligencia para el crecimiento rentable",
  "FINANCE ENERGY (PROCUREMENT)": "Inteligencia para el crecimiento rentable",
  "SERIE B": "Growth",
  "HABILITADORES DE NEGOCIO": "Habilitador de Negocio",
  "LEADERSHIP": "Transversal",
};

export function getOKRCategoryTag(okrName: string): string {
  return OKR_CATEGORY_MAP[okrName] ?? "";
}
