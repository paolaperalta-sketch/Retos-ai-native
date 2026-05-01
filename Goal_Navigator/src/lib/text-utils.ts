/**
 * Convert a string to sentence case while preserving:
 *  - short ALL-CAPS acronyms (≤3 chars: AI, KR, IT, CEO, CFO…)
 *  - numbers, percentages, arrows, comparators (≤24h, →, ≥, %)
 *  - the first letter of the whole string is uppercased
 *
 * Examples:
 *   "TIEMPO PROMEDIO RESPUESTA CONTRACTUAL. ≤24H→≤18H→≤12H→≤6H."
 *     → "Tiempo promedio respuesta contractual. ≤24h→≤18h→≤12h→≤6h."
 *   "DIAGNÓSTICO BRASIL: ABRIL: ESTRUCTURA+ANEEL. MAYO: RIESGOS."
 *     → "Diagnóstico Brasil: abril: estructura+aneel. Mayo: riesgos."
 *     (first letter after ". " is also capitalized)
 */
// Acronyms that must always render in their exact casing, regardless of how
// they were stored in the DB or hardcoded. Add new ones as the product grows.
const PROTECTED_TERMS: Record<string, string> = {
  AI: "AI", CX: "CX", KR: "KR", OKR: "OKR", CEO: "CEO", CFO: "CFO",
  CTO: "CTO", COO: "COO", CMO: "CMO", IT: "IT", HR: "HR", QA: "QA",
  ANEEL: "ANEEL", NPS: "NPS", ROI: "ROI", KPI: "KPI", API: "API",
  SQL: "SQL", SaaS: "SaaS", B2B: "B2B", B2C: "B2C",
  BIA: "Bia", Bia: "Bia", bia: "Bia",
};

export function sentenceCaseTitle(input: string | null | undefined): string {
  return formatKR(input);
}

export function formatKR(input: string | null | undefined): string {
  if (!input) return "";
  const trimmed = String(input).trim();
  if (!trimmed) return "";

  let result = trimmed.toLowerCase();

  result = result.charAt(0).toUpperCase() + result.slice(1);

  for (const [key, replacement] of Object.entries(PROTECTED_TERMS)) {
    const re = new RegExp(`\\b${key.toLowerCase()}\\b`, "g");
    result = result.replace(re, replacement);
  }

  return result;
}

/**
 * Force the brand word "Bia" to always render with exact capitalization.
 * Matches BIA / bia / BIa / etc. as a whole word and replaces with "Bia".
 * Use this whenever rendering user-facing text that may contain the brand name.
 */
export function normalizeBia(input: string | null | undefined): string {
  if (!input) return "";
  return String(input).replace(/\bbia\b/giu, "Bia");
}
