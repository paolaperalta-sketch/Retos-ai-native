import Papa from "papaparse";

export interface ENPSRecord {
  periodo: string;
  area: string;
  subarea: string;
  antiguedad: string;
  enpsScore: number | null;
  motivationScore: number | null;
  managerNPS: number | null;
  valorasTexto: string;
  valorasCategoria: string;
  liderazgoTexto: string;
  mejorasTexto: string;
  mejorasCategoria: string;
  salarioSatisfecho: string;
  // Leadership behavior columns
  liderClaroObjetivos: string;
  liderComunicaPrioridades: string;
  liderDaFeedback: string;
  liderIncentivaColaboracion: string;
  liderDaHerramientas: string;
  liderReferenteCultura: string;
}

export interface MetricsSummary {
  enpsScore: number;
  promotersPct: number;
  passivesPct: number;
  detractorsPct: number;
  totalResponses: number;
  avgMotivation: number;
  avgManagerNPS: number;
  avgTenure: number;
}

export interface CategoryScore {
  category: string;
  count: number;
  percentage: number;
  avgScore: number;
}

let cachedData: ENPSRecord[] | null = null;

// Sistema de re-categorización por scoring de señales.
// Cada categoría tiene patrones "fuertes" (peso 3) y "débiles" (peso 1).
// La categoría con mayor score gana; si hay empate o score 0, se conserva la original.
const VALID_CATEGORIES = [
  "Plan de Carrera y Capacitación",
  "Bienestar y Balance",
  "Beneficios y Salario",
  "Procesos y Herramientas",
  "Comunicación Interna",
  "Cultura y Liderazgo",
  "General / Otros",
] as const;

type CategorySignals = { strong: RegExp[]; weak: RegExp[] };

const CATEGORY_SIGNALS: Record<string, CategorySignals> = {
  "Beneficios y Salario": {
    strong: [
      /\b(salario|sueldo|remuneraci[óo]n|compensaci[óo]n|aumento\s+salarial|bandas?\s+salariales?|ajuste\s+salarial|smlmv|ipc)\b/i,
      /\b(beneficios?\s+(no\s+)?(salariales?|extralegales?|extrasalariales?)|prepagada|medicina\s+prepagada|p[óo]liza|stock\s*options?|bonos?\s+(de|por)|auxilio\s+(de\s+)?(transporte|internet|educaci[óo]n))\b/i,
      /\b(convenios?\s+(con|de)\s+(gimnasios?|universidades?|cooperativas?|empresas?|comercios?|gym|smart\s*fit|sodexo|bigpass)|fondo\s+de\s+empleados)\b/i,
      /\b(incentivos?\s+(econ[óo]micos?|salariales?|por\s+(metas?|cumplimiento|desempe[ñn]o))|primas?\s+extralegales?)\b/i,
    ],
    weak: [/\bbeneficios?\b/i, /\bremuneraci[óo]n\b/i, /\bperks?\b/i],
  },
  "Bienestar y Balance": {
    strong: [
      /\b(carga\s+(de\s+)?(trabajo|laboral)|cargabilidad|sobrecarga|balance\s+vida[\s-]trabajo|work[\s-]life)\b/i,
      /\b(bienestar\s+(emocional|laboral|integral|del\s+(equipo|colaborador|trabajador|empleado))|salud\s+mental|burnout|estr[ée]s\s+laboral)\b/i,
      /\b(home\s*office|teletrabajo|d[íi]as?\s+(virtuales?|presenciales?)|horarios?\s+flexibles?|flexibilidad\s+horaria|desconexi[óo]n\s+laboral|tiempos?\s+de\s+descanso|incapacidades?)\b/i,
      /\b(pausas?\s+activas?|espacios?\s+(de\s+)?(desconexi[óo]n|descanso|integraci[óo]n)|salidas?\s+de\s+integraci[óo]n)\b/i,
      /\b(espacios?\s+(para\s+)?(almorzar|comer|descansar)|sala\s+de\s+descanso|comedor|cafeter[íi]a|lugar(es)?\s+(para\s+)?(comer|almorzar))\b/i,
    ],
    weak: [/\bbienestar\b/i, /\bdescanso\b/i, /\balmuerzo\b/i],
  },
  "Plan de Carrera y Capacitación": {
    strong: [
      /\b(plan(es)?\s+(de\s+)?(carrera|desarrollo)|ruta\s+de\s+carrera|l[íi]nea\s+de\s+carrera|movilidad\s+interna|crecimiento\s+(profesional|interno|laboral))\b/i,
      /\b(capacitaci[óo]n(es)?|formaci[óo]n\s+(continua|profesional|t[ée]cnica)|cursos?\s+(de|sobre)|certificaciones?|entrenamiento|onboarding)\b/i,
      /\b(oportunidades?\s+de\s+(crecimiento|desarrollo|aprendizaje)|desarrollo\s+profesional|aprendizaje\s+continuo)\b/i,
    ],
    weak: [/\baprend(izaje|er)\b/i, /\bcrecimiento\b/i, /\bcapacit/i, /\bformaci[óo]n\b/i],
  },
  "Procesos y Herramientas": {
    strong: [
      /\b(documentaci[óo]n\s+(de\s+)?procesos?|estandarizar\s+procesos?|manuales?\s+de\s+procesos?|procedimientos?\s+claros?|modelos?\s+operativos?)\b/i,
      /\b(herramientas?\s+(digitales?|internas?|tecnol[óo]gicas?|ofim[áa]ticas?)|software|sistemas?\s+internos?|automatizaci[óo]n\s+de)\b/i,
      /\b(reprocesos?|flujos?\s+de\s+trabajo|priorizaci[óo]n\s+(clara|real)|optimizaci[óo]n\s+de\s+procesos?)\b/i,
    ],
    weak: [/\bprocesos?\b/i, /\bherramientas?\b/i],
  },
  "Comunicación Interna": {
    strong: [
      /\b(comunicaci[óo]n\s+(interna|entre\s+[áa]reas|transversal|transparente)|alineaci[óo]n\s+entre\s+(equipos|[áa]reas)|coordinaci[óo]n\s+entre\s+[áa]reas)\b/i,
      /\b(transparencia|informaci[óo]n\s+compartida|visibilidad\s+(entre|de)|silos?\s+(de\s+)?informaci[óo]n)\b/i,
      /\b(organigrama|claridad\s+(de\s+)?(roles|responsabilidades))\b/i,
    ],
    weak: [/\bcomunicaci[óo]n\b/i, /\balineaci[óo]n\b/i],
  },
  "Cultura y Liderazgo": {
    strong: [
      /\b(liderazgo|l[íi]der(es)?\s+(deben|deber[íi]an|necesitan)|micromanagement|cultura\s+(t[óo]xica|de\s+se[ñn]alamiento|organizacional)|ambiente\s+(laboral|de\s+trabajo))\b/i,
      /\b(reconocimiento\s+(al|del)\s+(trabajo|colaborador|equipo)|feedback\s+(continuo|estructurado|del\s+l[íi]der)|retroalimentaci[óo]n\s+continua)\b/i,
      /\b(estabilidad\s+laboral|rotaci[óo]n\s+(de\s+)?(personal|empleados)|salidas?\s+constantes?)\b/i,
    ],
    weak: [/\bcultura\b/i, /\bliderazgo\b/i, /\breconocimiento\b/i],
  },
};

const NOISE_VALUES = new Set([
  "", "Si.", "Sí.", "Parcialmente.", "na", "Ninguna", ".", "a", "no tengo comentarios",
]);

function recategorizeMejoras(text: string, originalCategory: string): string {
  if (!text || text === "Sin comentarios" || text.length < 10) return originalCategory;

  // Si la categoría original es ruido (respuestas de Likert mal capturadas), forzar reclasificación.
  const originalIsNoise = NOISE_VALUES.has(originalCategory) || !VALID_CATEGORIES.includes(originalCategory as typeof VALID_CATEGORIES[number]);

  const scores: Record<string, number> = {};
  for (const [cat, sig] of Object.entries(CATEGORY_SIGNALS)) {
    let s = 0;
    for (const rx of sig.strong) if (rx.test(text)) s += 3;
    for (const rx of sig.weak) if (rx.test(text)) s += 1;
    scores[cat] = s;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topCat, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  // Solo recategorizar si hay señal fuerte clara (≥3) Y supera a la siguiente por al menos 2 puntos,
  // o si la categoría original es ruido.
  if (originalIsNoise) {
    return topScore > 0 ? topCat : "General / Otros";
  }
  if (topScore >= 3 && topScore - secondScore >= 2 && topCat !== originalCategory) {
    return topCat;
  }
  return originalCategory;
}


let enpsPromise: Promise<ENPSRecord[]> | null = null;

export async function loadENPSData(): Promise<ENPSRecord[]> {
  if (cachedData) return cachedData;
  if (enpsPromise) return enpsPromise;
  enpsPromise = (async () => {
    const response = await fetch("/data/enps_data.csv");
    const text = await response.text();

    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    cachedData = (parsed.data as Record<string, string>[]).map((row) => {
      let area = (row["Area"] || "").trim();
      const subarea = (row["Subarea"] || "").trim();
      const mejorasTexto = (row["Mejoras_Texto"] || "").trim();
      let mejorasCategoria = (row["Mejoras_Categoria"] || "").trim();
      mejorasCategoria = recategorizeMejoras(mejorasTexto, mejorasCategoria);

      // Normalize area names
      if (area === "OPS") area = "Operaciones";
      if (area === "Acquisition" && (subarea === "Sales" || subarea === "Ops")) area = "Sales";
      if (area === "Acquisition" || area === "Marketing" || area === "Growth") area = "Growth";
      if (area === "Datos") { area = "AI, Automation & Data"; }

      return {
        periodo: (row["Periodo"] || "").trim(),
        area,
        subarea,
        antiguedad: (row["Antiguedad"] || "").trim(),
        enpsScore: row["eNPS_Score"]?.trim() ? parseInt(row["eNPS_Score"].trim()) : null,
        motivationScore: row["Motivation_Score"]?.trim() ? parseInt(row["Motivation_Score"].trim()) : null,
        managerNPS: row["Manager_NPS"]?.trim() ? parseInt(row["Manager_NPS"].trim()) : null,
        valorasTexto: (row["Valoras_Texto"] || "").trim(),
        valorasCategoria: (row["Valoras_Categoria"] || "").trim(),
        liderazgoTexto: (row["Liderazgo_Texto"] || "").trim(),
        mejorasTexto,
        mejorasCategoria,
        salarioSatisfecho: (row["Salario_Satisfecho"] || "").trim(),
        liderClaroObjetivos: (row["Lider_Claro_Objetivos"] || "").trim(),
        liderComunicaPrioridades: (row["Lider_Comunica_Prioridades"] || "").trim(),
        liderDaFeedback: (row["Lider_Da_Feedback"] || "").trim(),
        liderIncentivaColaboracion: (row["Lider_Incentiva_Colaboracion"] || "").trim(),
        liderDaHerramientas: (row["Lider_Da_Herramientas"] || "").trim(),
        liderReferenteCultura: (row["Lider_Referente_Cultura"] || "").trim(),
      };
    });

    return cachedData!;
  })();
  return enpsPromise;
}

export function filterData(data: ENPSRecord[], periodo: string, area: string, subarea: string = "all"): ENPSRecord[] {
  return data.filter((r) => {
    const matchPeriod = periodo === "all" || r.periodo === periodo;
    const matchArea = area === "all" || r.area === area;
    const matchSubarea = subarea === "all" || r.subarea === subarea;
    return matchPeriod && matchArea && matchSubarea;
  });
}

function getUniqueSortedValues(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim() ?? "").filter(Boolean))].sort();
}

export function getSubareas(data: ENPSRecord[]): string[] {
  return getUniqueSortedValues(data.map((r) => r.subarea));
}

export function getAvailableSubareas(data: ENPSRecord[], periodo: string, area: string): string[] {
  return getUniqueSortedValues(
    data
      .filter((r) => (periodo === "all" || r.periodo === periodo) && (area === "all" || r.area === area))
      .map((r) => r.subarea)
  );
}

export function getPeriods(data: ENPSRecord[]): string[] {
  const unique = [...new Set(data.map((r) => r.periodo?.trim() ?? "").filter(Boolean))];
  return unique.sort((a, b) => {
    const parseP = (p: string) => {
      const m = p.match(/Q(\d)\s+(\d{4})/);
      return m ? parseInt(m[2]) * 10 + parseInt(m[1]) : 0;
    };
    return parseP(a) - parseP(b);
  });
}

export function getAreas(data: ENPSRecord[]): string[] {
  return getUniqueSortedValues(data.map((r) => r.area));
}

export function getAvailablePeriods(data: ENPSRecord[], area: string): string[] {
  if (area === "all") return getPeriods(data);
  return getUniqueSortedValues(data.filter((r) => r.area === area).map((r) => r.periodo));
}

export function getAvailableAreas(data: ENPSRecord[], periodo: string): string[] {
  if (periodo === "all") return getAreas(data);
  return getUniqueSortedValues(data.filter((r) => r.periodo === periodo).map((r) => r.area));
}

const TENURE_MONTHS: Record<string, number> = {
  "0  a 3 meses": 1.5,
  "0 a 3 meses": 1.5,
  "4 meses a 6 meses": 5,
  "3 a 6 meses": 4.5,
  "6 meses a 1 año": 9,
  "Más de 1 año": 18,
  "1 año a 2 años": 18,
  "Más de 2 años": 30,
  "2 años a 3 años": 30,
  "Más de 3 años": 42,
};

export function calculateMetrics(records: ENPSRecord[]): MetricsSummary {
  const scored = records.filter((r) => r.enpsScore !== null);
  if (scored.length === 0) {
    return { enpsScore: 0, promotersPct: 0, passivesPct: 0, detractorsPct: 0, totalResponses: 0, avgMotivation: 0, avgManagerNPS: 0, avgTenure: 0 };
  }

  const promoters = scored.filter((r) => r.enpsScore! >= 9);
  const passives = scored.filter((r) => r.enpsScore! >= 7 && r.enpsScore! <= 8);
  const detractors = scored.filter((r) => r.enpsScore! <= 6);

  const total = scored.length;
  const promotersPct = (promoters.length / total) * 100;
  const detractorsPct = (detractors.length / total) * 100;

  const motivScored = records.filter((r) => r.motivationScore !== null);
  const mgrScored = records.filter((r) => r.managerNPS !== null);
  const mgrPromoters = mgrScored.filter((r) => r.managerNPS! >= 9).length;
  const mgrDetractors = mgrScored.filter((r) => r.managerNPS! <= 6).length;
  const managerNPS = mgrScored.length ? Math.round((mgrPromoters / mgrScored.length) * 100 - (mgrDetractors / mgrScored.length) * 100) : 0;

  const tenureRecords = records.filter((r) => r.antiguedad && TENURE_MONTHS[r.antiguedad] !== undefined);
  const avgTenure = tenureRecords.length
    ? +(tenureRecords.reduce((s, r) => s + TENURE_MONTHS[r.antiguedad], 0) / tenureRecords.length).toFixed(1)
    : 0;

  return {
    enpsScore: Math.round(promotersPct - detractorsPct),
    promotersPct: Math.round(promotersPct),
    passivesPct: Math.round((passives.length / total) * 100),
    detractorsPct: Math.round(detractorsPct),
    totalResponses: total,
    avgMotivation: motivScored.length ? +(motivScored.reduce((s, r) => s + r.motivationScore!, 0) / motivScored.length).toFixed(1) : 0,
    avgManagerNPS: managerNPS,
    avgTenure,
  };
}

export function getCategoryScores(records: ENPSRecord[], type: "valoras" | "mejoras"): CategoryScore[] {
  const field = type === "valoras" ? "valorasCategoria" : "mejorasCategoria";
  const counts: Record<string, { count: number; totalScore: number }> = {};

  for (const r of records) {
    const cat = r[field];
    if (!cat || cat === "Sin comentarios") continue;
    if (!counts[cat]) counts[cat] = { count: 0, totalScore: 0 };
    counts[cat].count++;
    if (r.enpsScore !== null) counts[cat].totalScore += r.enpsScore;
  }

  const total = Object.values(counts).reduce((s, c) => s + c.count, 0);

  return Object.entries(counts)
    .map(([category, { count, totalScore }]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      avgScore: count > 0 ? +(totalScore / count).toFixed(1) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getComments(records: ENPSRecord[]): Array<{
  type: "valoras" | "liderazgo" | "mejoras";
  text: string;
  category: string;
  score: number | null;
  area: string;
  periodo: string;
  salarioSatisfecho: string;
}> {
  const comments: Array<{
    type: "valoras" | "liderazgo" | "mejoras";
    text: string;
    category: string;
    score: number | null;
    area: string;
    periodo: string;
    salarioSatisfecho: string;
  }> = [];

  for (const r of records) {
    if (r.valorasTexto && r.valorasTexto !== "Sin comentarios") {
      comments.push({ type: "valoras", text: r.valorasTexto, category: r.valorasCategoria, score: r.enpsScore, area: r.area, periodo: r.periodo, salarioSatisfecho: r.salarioSatisfecho });
    }
    if (r.liderazgoTexto && r.liderazgoTexto !== "Sin comentarios") {
      comments.push({ type: "liderazgo", text: r.liderazgoTexto, category: "Liderazgo", score: r.managerNPS, area: r.area, periodo: r.periodo, salarioSatisfecho: r.salarioSatisfecho });
    }
    if (r.mejorasTexto && r.mejorasTexto !== "Sin comentarios") {
      comments.push({ type: "mejoras", text: r.mejorasTexto, category: r.mejorasCategoria, score: r.enpsScore, area: r.area, periodo: r.periodo, salarioSatisfecho: r.salarioSatisfecho });
    }
  }

  return comments;
}

export function generateInsights(records: ENPSRecord[], metrics: MetricsSummary): {
  positiveDrivers: string[];
  painPoints: string[];
  recommendations: string[];
} {
  const valorasCats = getCategoryScores(records, "valoras");
  const mejoraCats = getCategoryScores(records, "mejoras");

  const positiveDrivers: string[] = [];
  const painPoints: string[] = [];
  const recommendations: string[] = [];

  const rankLabels = ["#1", "#2", "#3"];
  const topValoras = valorasCats.slice(0, 3);
  for (let i = 0; i < topValoras.length; i++) {
    const cat = topValoras[i];
    const samples = records
      .filter((r) => r.valorasCategoria === cat.category && r.valorasTexto && r.valorasTexto !== "Sin comentarios")
      .slice(0, 2)
      .map((r) => `"${r.valorasTexto.substring(0, 80)}"`);
    const sampleText = samples.length > 0 ? ` — ${samples.join("; ")}` : "";
    positiveDrivers.push(
      `${rankLabels[i]} "${cat.category}" (${cat.percentage}% de menciones, score ${cat.avgScore})${sampleText}`
    );
  }

  if (metrics.promotersPct > 50) {
    positiveDrivers.push(`${metrics.promotersPct}% de promotores indica alto compromiso`);
  }
  if (metrics.avgManagerNPS >= 8) {
    positiveDrivers.push(`NPS de liderazgo alto (${metrics.avgManagerNPS}/10)`);
  }
  if (positiveDrivers.length === 0) {
    positiveDrivers.push("Los datos muestran oportunidades de mejora en múltiples dimensiones");
  }

  if (metrics.detractorsPct > 20) {
    painPoints.push(`${metrics.detractorsPct}% de detractores requiere atención inmediata`);
  }

  const topMejoras = mejoraCats.slice(0, 3);
  for (let i = 0; i < topMejoras.length; i++) {
    const cat = topMejoras[i];
    const samples = records
      .filter((r) => r.mejorasCategoria === cat.category && r.mejorasTexto && r.mejorasTexto !== "Sin comentarios")
      .slice(0, 2)
      .map((r) => `"${r.mejorasTexto.substring(0, 80)}"`);
    const sampleText = samples.length > 0 ? ` — ${samples.join("; ")}` : "";
    painPoints.push(
      `${rankLabels[i]} "${cat.category}" (${cat.percentage}% de solicitudes)${sampleText}`
    );
  }

  const salaryNo = records.filter((r) => r.salarioSatisfecho === "No.").length;
  const salaryTotal = records.filter((r) => r.salarioSatisfecho).length;
  if (salaryTotal > 0 && salaryNo / salaryTotal > 0.15) {
    painPoints.push(`${Math.round((salaryNo / salaryTotal) * 100)}% reporta insatisfacción salarial`);
  }

  if (painPoints.length === 0) {
    painPoints.push("No se identifican dolores críticos en este período");
  }

  for (const cat of mejoraCats.slice(0, 2)) {
    const label = cat.category.toLowerCase();
    if (label.includes("carrera") || label.includes("crecimiento")) {
      recommendations.push(`Diseñar rutas de carrera visibles — "${cat.category}" concentra ${cat.percentage}% de menciones`);
    } else if (label.includes("beneficios") || label.includes("compensación") || label.includes("salario")) {
      recommendations.push(`Revisar paquete de compensación y beneficios — ${cat.percentage}% lo solicita`);
    } else if (label.includes("procesos") || label.includes("herramientas") || label.includes("estructura")) {
      recommendations.push(`Optimizar procesos y herramientas internas — mencionado por ${cat.percentage}%`);
    } else if (label.includes("comunicación") || label.includes("transparencia")) {
      recommendations.push(`Mejorar comunicación interna y transparencia — ${cat.percentage}% lo señala`);
    } else if (label.includes("liderazgo") || label.includes("gestión")) {
      recommendations.push(`Fortalecer capacitación de líderes — "${cat.category}" con ${cat.percentage}%`);
    } else {
      recommendations.push(`Atender "${cat.category}" — representa ${cat.percentage}% de las solicitudes de mejora`);
    }
  }

  if (metrics.detractorsPct > 15) {
    recommendations.push("Realizar entrevistas 1:1 con detractores para entender causas raíz");
  }
  if (recommendations.length === 0) {
    recommendations.push("Mantener las prácticas actuales que generan satisfacción");
  }

  return { positiveDrivers, painPoints, recommendations };
}

export function calculateAverageOfPeriodMetrics(data: ENPSRecord[]): MetricsSummary {
  const periods = getPeriods(data);
  if (periods.length === 0) return calculateMetrics([]);

  const periodMetrics = periods.map((p) => calculateMetrics(data.filter((r) => r.periodo === p)));
  const validMetrics = periodMetrics.filter((m) => m.totalResponses > 0);
  if (validMetrics.length === 0) return calculateMetrics([]);

  const avg = (fn: (m: MetricsSummary) => number) =>
    Math.round((validMetrics.reduce((s, m) => s + fn(m), 0) / validMetrics.length) * 10) / 10;

  return {
    enpsScore: Math.round(avg((m) => m.enpsScore)),
    promotersPct: Math.round(avg((m) => m.promotersPct)),
    passivesPct: Math.round(avg((m) => m.passivesPct)),
    detractorsPct: Math.round(avg((m) => m.detractorsPct)),
    totalResponses: validMetrics.reduce((s, m) => s + m.totalResponses, 0),
    avgMotivation: +avg((m) => m.avgMotivation).toFixed(1),
    avgManagerNPS: Math.round(avg((m) => m.avgManagerNPS)),
    avgTenure: +avg((m) => m.avgTenure).toFixed(1),
  };
}

export function getAreaTrendData(data: ENPSRecord[]): Array<{ area: string; period: string; enps: number; responses: number }> {
  const periods = getPeriods(data);
  const areas = getAreas(data);
  const result: Array<{ area: string; period: string; enps: number; responses: number }> = [];

  for (const area of areas) {
    for (const period of periods) {
      const records = data.filter((r) => r.area === area && r.periodo === period);
      if (records.length === 0) continue;
      const m = calculateMetrics(records);
      result.push({ area, period, enps: m.enpsScore, responses: m.totalResponses });
    }
  }

  return result;
}

export function buildDataContext(records: ENPSRecord[], metrics: MetricsSummary, periodo: string, area: string, subarea: string = "all"): string {
  const cats = getCategoryScores(records, "valoras");
  const mejoras = getCategoryScores(records, "mejoras");
  const insights = generateInsights(records, metrics);

  return `Contexto de datos eNPS de Bia:
Filtro: Período=${periodo === "all" ? "Todos" : periodo}, Área=${area === "all" ? "Todas" : area}, Subárea=${subarea === "all" ? "Todas" : subarea}
Total respuestas: ${metrics.totalResponses}
eNPS Score: ${metrics.enpsScore}
Promotores: ${metrics.promotersPct}%, Pasivos: ${metrics.passivesPct}%, Detractores: ${metrics.detractorsPct}%
Motivación promedio: ${metrics.avgMotivation}/10
NPS de liderazgo: ${metrics.avgManagerNPS}/10

Categorías de motivación: ${cats.map((c) => `${c.category}(${c.percentage}%, score ${c.avgScore})`).join(", ")}
Categorías de mejora: ${mejoras.map((c) => `${c.category}(${c.percentage}%)`).join(", ")}

Drivers positivos: ${insights.positiveDrivers.join("; ")}
Dolores principales: ${insights.painPoints.join("; ")}
Recomendaciones: ${insights.recommendations.join("; ")}

Comentarios representativos (muestra):
${records
  .slice(0, 15)
  .map((r) => `- [${r.area}] Score:${r.enpsScore} "${r.valorasTexto?.substring(0, 150)}..."`)
  .join("\n")}`;
}