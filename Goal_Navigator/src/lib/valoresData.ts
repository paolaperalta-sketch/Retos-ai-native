import Papa from "papaparse";

export interface ValoresRecord {
  periodo: string;
  area: string;
  subarea: string;
  antiguedad: string;
  valorRespuesta: string;
  valorIdentificado: string;
}

let cachedValores: ValoresRecord[] | null = null;
let valoresPromise: Promise<ValoresRecord[]> | null = null;

export async function loadValoresData(): Promise<ValoresRecord[]> {
  if (cachedValores) return cachedValores;
  if (valoresPromise) return valoresPromise;
  valoresPromise = (async () => {
    const res = await fetch("/data/valores_bia.csv");
    const text = await res.text();
    const { data } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
    });
    cachedValores = (data as Record<string, string>[])
      .filter((r) => r["Valor_Identificado"]?.trim())
      .map((r) => ({
        periodo: (r["Periodo"] || "").trim(),
        area: (r["Area"] || "").trim(),
        subarea: (r["Subarea"] || "").trim(),
        antiguedad: (r["Antiguedad"] || "").trim(),
        valorRespuesta: (r["Valores_Respuesta"] || "").trim(),
        valorIdentificado: (r["Valor_Identificado"] || "").trim(),
      }));
    return cachedValores;
  })();
  return valoresPromise;
}

export function filterValores(
  data: ValoresRecord[],
  area: string,
  subarea: string,
  allowedAreas?: string[] | null
): ValoresRecord[] {
  let result = data;
  if (allowedAreas) {
    result = result.filter((r) => allowedAreas.includes(r.area));
  }
  if (area !== "all") {
    result = result.filter((r) => r.area === area);
  }
  if (subarea !== "all") {
    result = result.filter((r) => r.subarea === subarea);
  }
  return result;
}

export function getValoresCounts(data: ValoresRecord[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const r of data) {
    const v = r.valorIdentificado;
    counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}