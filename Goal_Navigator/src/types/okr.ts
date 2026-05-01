export type Status = "on_track" | "at_risk" | "off_track";

export interface PersonalKR {
  id: string;
  name: string;
  owner: string;
  ownerAvatar?: string;
  baseline: number;
  target: number;
  current: number;
  weight: number; // percentage, all KRs for a person must sum to 100
  status: Status;
  areaOkrId: string;
  comment?: string;
  rating?: number; // leader rating 1-5
  closingMonth?: "abril" | "mayo" | "junio" | "julio" | null;
  /** True when the KR name was prefixed with ★ in the source (top-priority KR). */
  isStar?: boolean;
  /** Raw monthly_targets JSON (baseline / meta_mayo / meta_junio / meta_julio strings). */
  monthlyTargets?: Record<string, string | number | null> | null;
}

export interface AreaOKR {
  id: string;
  name: string;
  area: string;
  companyOkrId: string;
  progress: number; // 0-100
  krs: PersonalKR[];
}

export interface CompanyOKR {
  id: string;
  name: string;
  progress: number; // 0-100
  areaOkrs: AreaOKR[];
}

export interface Area {
  name: string;
  subareas: (string | Area)[];
}

export const COMPANY_OKRS_NAMES = [
  "GROWTH ENGINE",
  "LIFECYCLE",
  "AI NATIVE",
  "BANKING & BANCABILIDAD",
  "DATA COMO FUENTE DE VERDAD",
  "PREDICTABLE FINANCE",
  "GENERACIÓN ENERGÉTICA",
  "FINANCE ENERGY (PROCUREMENT)",
  "HABILITADORES DE NEGOCIO",
] as const;

export const AREAS = [
  "SALES", "OPERACIONES", "GROWTH", "ENERGY", "LEGAL",
  "PEOPLE", "FINANCE", "NEW BUSINESS", "AI & DATA", "CX",
] as const;
