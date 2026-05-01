// Shared mapping from Supabase `key_results` row -> PersonalKR shape used by the UI.
// Centralises 3 concerns that were duplicated / missing in CollaboratorView:
//   1. Strip the internal "★" marker from KR names (never shown to users).
//   2. Resolve real baseline / target from `monthly_targets` JSONB when the
//      flat columns are 0 (legacy data lives in the JSON).
//   3. Produce a stable PersonalKR object.

import type { PersonalKR } from "@/types/okr";

export interface KRRow {
  id: string;
  name: string;
  baseline?: number | string | null;
  target?: number | string | null;
  current_value?: number | string | null;
  weight?: number | string | null;
  status?: string | null;
  assigned_email?: string | null;
  assigned_full_name?: string | null;
  user_id?: string | null;
  company_okr_id?: string | null;
  monthly_targets?: Record<string, unknown> | null;
  closing_month?: string | null;
}

export const KR_SELECT_COLUMNS = "id, name, baseline, target, current_value, weight, status, assigned_email, assigned_full_name, user_id, company_okr_id, monthly_targets, closing_month";

export type ClosingMonth = "abril" | "mayo" | "junio" | "julio";
export const CLOSING_MONTHS: ClosingMonth[] = ["abril", "mayo", "junio", "julio"];
export const CLOSING_MONTH_LABELS: Record<ClosingMonth, string> = {
  abril: "Abril",
  mayo: "Mayo",
  junio: "Junio",
  julio: "Julio",
};
/** Tailwind classes for the per-month badge (bg + text). */
export const CLOSING_MONTH_BADGE: Record<ClosingMonth, string> = {
  abril: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  mayo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  junio: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  julio: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
};

/** Default mes activo actual (mayo 2026). */
export const CURRENT_CLOSING_MONTH: ClosingMonth = "mayo";

/** Convert a "Mes Año" period string (e.g. "Mayo 2026") to a closing_month value if it's one of the 4 supported months of 2026, else null (= "Todos"). */
export function periodToClosingMonth(period: string | undefined): ClosingMonth | null {
  if (!period) return null;
  const [m, y] = period.split(" ");
  if (y !== "2026") return null;
  const lower = (m || "").toLowerCase();
  return (CLOSING_MONTHS as string[]).includes(lower) ? (lower as ClosingMonth) : null;
}

/** Remove the internal "★" marker (and surrounding whitespace) from a KR name. */
export function sanitizeKRName(name: string): string {
  return (name || "").replace(/★/g, "").replace(/\s+/g, " ").trim();
}

export function getKRMonthKey(row: Pick<KRRow, "monthly_targets" | "closing_month"> | PersonalKR): string {
  const monthlyTargets = "monthly_targets" in row ? row.monthly_targets : (row as PersonalKR).monthlyTargets;
  const closingMonth = "closing_month" in row ? row.closing_month : (row as PersonalKR).closingMonth;
  const activeMonth = (monthlyTargets?.active_month as string | undefined) || "";
  if (activeMonth === "2026-05") return "mayo";
  if (activeMonth === "2026-06") return "junio";
  if (activeMonth === "2026-07") return "julio";
  return closingMonth || "sin-mes";
}

export function getKRDedupeKey(kr: PersonalKR): string {
  const normalizedName = sanitizeKRName(kr.name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${kr.areaOkrId || "sin-okr"}::${getKRMonthKey(kr)}::${normalizedName}`;
}

export function dedupeKRs(krs: PersonalKR[]): PersonalKR[] {
  const deduped = new Map<string, PersonalKR>();
  krs.forEach(kr => {
    const key = getKRDedupeKey(kr);
    const existing = deduped.get(key);
    if (!existing || (!existing.monthlyTargets?.active_month && kr.monthlyTargets?.active_month)) {
      deduped.set(key, kr);
    }
  });
  return Array.from(deduped.values());
}

/** Try to parse a value from monthly_targets JSON as a number. Returns null if not numeric. */
function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "" || v === "—") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolve effective baseline / target for a KR:
 * - prefer the flat `baseline` / `target` columns when > 0
 * - otherwise scan `monthly_targets` JSONB for the first numeric value
 *   (keys like meta_mayo, meta_junio, baseline, target...)
 */
export function getKRTargets(row: KRRow): { baseline: number; target: number } {
  const flatBase = Number(row.baseline ?? 0);
  const flatTarget = Number(row.target ?? 0);

  let baseline = flatBase;
  let target = flatTarget;

  const mt = row.monthly_targets;
  if (mt && typeof mt === "object") {
    // Explicit baseline / target keys win
    const explicitBase = toNumberOrNull((mt as any).baseline ?? (mt as any).base);
    const explicitTarget = toNumberOrNull((mt as any).target ?? (mt as any).meta);
    if (baseline === 0 && explicitBase !== null) baseline = explicitBase;
    if (target === 0 && explicitTarget !== null) target = explicitTarget;

    // Otherwise scan monthly meta_* keys for the first numeric value
    if (target === 0) {
      for (const [k, v] of Object.entries(mt)) {
        if (!/^meta_/i.test(k)) continue;
        const n = toNumberOrNull(v);
        if (n !== null) { target = n; break; }
      }
    }
  }

  return { baseline, target };
}

/** Map a raw Supabase row -> PersonalKR consumed by the UI. */
export function mapKRRow(row: KRRow, ownerName: string): PersonalKR {
  const { baseline, target } = getKRTargets(row);
  const rawName = row.name || "";
  const isStar = /★/.test(rawName);
  return {
    id: row.id,
    name: sanitizeKRName(rawName),
    owner: ownerName,
    baseline,
    target,
    current: Number(row.current_value ?? 0),
    weight: Number(row.weight ?? 0),
    status: (row.status as PersonalKR["status"]) || "on_track",
    areaOkrId: row.company_okr_id || "db",
    closingMonth: (row.closing_month as PersonalKR["closingMonth"]) ?? null,
    isStar,
    monthlyTargets: (row.monthly_targets as PersonalKR["monthlyTargets"]) ?? null,
  };
}
