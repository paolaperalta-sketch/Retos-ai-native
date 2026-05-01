export interface RawResponse {
  periodo: string;
  area: string;
  subarea: string;
  antiguedad: string;
  personas_a_cargo: string;
  crecimiento: string;
  reconocimiento: string;
  remuneracion: string;
  motivation_score: number | null;
  motivation_comment: string;
  liderazgo_detalle: Record<string, string>;
  manager_nps: number | null;
  manager_comment: string;
  enps_score: number | null;
  mejoras_comment: string;
  valoras_comment: string;
  impacto: string;
}

let cachedRaw: RawResponse[] | null = null;
let rawPromise: Promise<RawResponse[]> | null = null;

export async function loadRawResponses(): Promise<RawResponse[]> {
  if (cachedRaw) return cachedRaw;
  if (rawPromise) return rawPromise;
  rawPromise = (async () => {
    const resp = await fetch("/data/raw_responses.json");
    const raw: RawResponse[] = await resp.json();
    cachedRaw = raw.map((r) => {
      let area = r.area;
      if (area === "Datos") area = "AI, Automation & Data";
      return area !== r.area ? { ...r, area } : r;
    });
    return cachedRaw!;
  })();
  return rawPromise;
}

export function filterRaw(
  data: RawResponse[],
  periodo: string,
  area: string,
  subarea: string,
  year: string,
  allowedAreas: string[] | null
): RawResponse[] {
  return data.filter((r) => {
    if (periodo !== "all" && r.periodo !== periodo) return false;
    if (periodo === "all" && year !== "all") {
      const m = r.periodo.match(/\d{4}/);
      if (!m || m[0] !== year) return false;
    }
    if (subarea === "all" && area !== "all" && r.area !== area) return false;
    if (subarea !== "all" && r.subarea !== subarea) return false;
    if (allowedAreas && allowedAreas.length > 1 && area === "all") {
      if (!allowedAreas.includes(r.area)) return false;
    }
    return true;
  });
}

export function buildEnrichedContext(
  records: RawResponse[],
  periodo: string,
  area: string,
  subarea: string
): string {
  if (records.length === 0) return "No hay datos disponibles para los filtros seleccionados.";

  const n = records.length;

  const validENPS = records.filter((r) => r.enps_score !== null);
  const promoters = validENPS.filter((r) => r.enps_score! >= 9).length;
  const detractors = validENPS.filter((r) => r.enps_score! <= 6).length;
  const enps = validENPS.length > 0
    ? Math.round(((promoters - detractors) / validENPS.length) * 100)
    : 0;

  const avgMotiv = records.filter((r) => r.motivation_score !== null);
  const avgMotivScore = avgMotiv.length > 0
    ? (avgMotiv.reduce((s, r) => s + r.motivation_score!, 0) / avgMotiv.length).toFixed(1)
    : "N/A";

  const avgMgr = records.filter((r) => r.manager_nps !== null);
  const avgMgrScore = avgMgr.length > 0
    ? (avgMgr.reduce((s, r) => s + r.manager_nps!, 0) / avgMgr.length).toFixed(1)
    : "N/A";

  const countBy = (field: keyof RawResponse) => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const v = r[field] as string;
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}: ${v} (${Math.round((v / n) * 100)}%)`)
      .join(", ");
  };

  const collectComments = (field: keyof RawResponse, maxPerArea = 8) => {
    const byArea: Record<string, string[]> = {};
    records.forEach((r) => {
      const text = (r[field] as string || "").trim();
      if (!text || text.length < 5) return;
      const a = r.area || "Sin área";
      if (!byArea[a]) byArea[a] = [];
      if (byArea[a].length < maxPerArea) byArea[a].push(text.substring(0, 200));
    });
    return Object.entries(byArea)
      .map(([a, comments]) => `  ${a}:\n${comments.map((c) => `    - "${c}"`).join("\n")}`)
      .join("\n");
  };

  const liderQuestions: Record<string, { si: number; parc: number; no: number }> = {};
  records.forEach((r) => {
    Object.entries(r.liderazgo_detalle || {}).forEach(([q, v]) => {
      if (!liderQuestions[q]) liderQuestions[q] = { si: 0, parc: 0, no: 0 };
      const val = v.toLowerCase().trim();
      if (val.startsWith("si")) liderQuestions[q].si++;
      else if (val.startsWith("parcial")) liderQuestions[q].parc++;
      else if (val.startsWith("no")) liderQuestions[q].no++;
    });
  });
  const liderDetail = Object.entries(liderQuestions)
    .map(([q, c]) => {
      const total = c.si + c.parc + c.no;
      return `  - ${q}: Sí ${Math.round((c.si / total) * 100)}%, Parcialmente ${Math.round((c.parc / total) * 100)}%, No ${Math.round((c.no / total) * 100)}%`;
    })
    .join("\n");

  const antigBreakdown = countBy("antiguedad");

  const detractorRecords = records.filter((r) => r.enps_score !== null && r.enps_score <= 6);
  const detractorComments = detractorRecords
    .filter((r) => r.motivation_comment || r.mejoras_comment)
    .slice(0, 15)
    .map((r) => `  - [${r.area}/${r.subarea}] Score:${r.enps_score} Motiv:${r.motivation_score} — Motivación: "${(r.motivation_comment || "").substring(0, 150)}" | Mejoras: "${(r.mejoras_comment || "").substring(0, 150)}"`)
    .join("\n");

  const promoterRecords = records.filter((r) => r.enps_score !== null && r.enps_score >= 9);
  const promoterComments = promoterRecords
    .filter((r) => r.valoras_comment || r.motivation_comment)
    .slice(0, 10)
    .map((r) => `  - [${r.area}] Score:${r.enps_score} — Valora: "${(r.valoras_comment || "").substring(0, 150)}" | Motivación: "${(r.motivation_comment || "").substring(0, 120)}"`)
    .join("\n");

  return `CONTEXTO COMPLETO DE DATOS eNPS - Bia
Filtro: Período=${periodo === "all" ? "Todos" : periodo}, Área=${area === "all" ? "Todas" : area}, Subárea=${subarea === "all" ? "Todas" : subarea}
Total respuestas: ${n}

═══ MÉTRICAS CLAVE ═══
eNPS Score: ${enps} (Promotores: ${validENPS.length > 0 ? Math.round((promoters / validENPS.length) * 100) : 0}%, Detractores: ${validENPS.length > 0 ? Math.round((detractors / validENPS.length) * 100) : 0}%)
Motivación promedio: ${avgMotivScore}/10
NPS de Liderazgo promedio: ${avgMgrScore}/10

═══ DESARROLLO Y MOTIVACIÓN ═══
Oportunidades de crecimiento: ${countBy("crecimiento")}
Reconocimiento: ${countBy("reconocimiento")}
Remuneración acorde: ${countBy("remuneracion")}

═══ LIDERAZGO DETALLADO ═══
${liderDetail}

═══ ANTIGÜEDAD ═══
${antigBreakdown}

═══ COMENTARIOS DE MOTIVACIÓN (por área) ═══
${collectComments("motivation_comment")}

═══ COMENTARIOS DE LIDERAZGO (por área) ═══
${collectComments("manager_comment")}

═══ QUÉ VALORAN (por área) ═══
${collectComments("valoras_comment")}

═══ ÁREAS DE MEJORA (por área) ═══
${collectComments("mejoras_comment")}

═══ DEEP-DIVE: DETRACTORES (eNPS ≤ 6) — ${detractorRecords.length} personas ═══
${detractorComments || "  Sin detractores en esta selección"}

═══ DEEP-DIVE: PROMOTORES (eNPS ≥ 9) — ${promoterRecords.length} personas ═══
${promoterComments || "  Sin promotores en esta selección"}`;
}