import { useState, useCallback, useMemo } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { type ENPSRecord } from "@/lib/enpsData";
import { type RawResponse } from "@/lib/rawDataContext";

interface Props {
  data: ENPSRecord[];
  rawData: RawResponse[];
  selectedPeriod: string;
  selectedArea: string;
  selectedSubarea: string;
  selectedYear: string;
  allowedAreas: string[] | null;
}

function extractYear(p: string) {
  return p.match(/\d{4}/)?.[0] || "";
}

function buildMejorasContext(
  data: ENPSRecord[],
  rawData: RawResponse[],
  currentPeriod: string,
  prevPeriod: string,
  area: string,
  subarea: string,
  allowedAreas: string[] | null
): string {
  const filterRecords = <T extends { periodo?: string; area?: string; subarea?: string }>(
    records: T[],
    periodo: string
  ): T[] => {
    return records.filter((r: any) => {
      if (r.periodo !== periodo) return false;
      if (subarea !== "all" && r.subarea !== subarea) return false;
      if (subarea === "all" && area !== "all" && r.area !== area) return false;
      if (allowedAreas && allowedAreas.length > 1 && area === "all") {
        return allowedAreas.includes(r.area);
      }
      return true;
    });
  };

  const getCatFreq = (records: ENPSRecord[]) => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      if (r.mejorasCategoria) {
        counts[r.mejorasCategoria] = (counts[r.mejorasCategoria] || 0) + 1;
      }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .map(([cat, count]) => ({ cat, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  };

  const currCSV = filterRecords(data, currentPeriod);
  const prevCSV = filterRecords(data, prevPeriod);
  const currFreq = getCatFreq(currCSV);
  const prevFreq = getCatFreq(prevCSV);

  const currRaw = filterRecords(rawData as any[], currentPeriod);
  const prevRaw = filterRecords(rawData as any[], prevPeriod);

  const getTexts = (records: any[]) =>
    records
      .map((r: any) => r.mejoras_comment || r.mejorasTexto || "")
      .filter((t: string) => t.length > 5);

  let ctx = `═══ PERIODO ACTUAL: ${currentPeriod} ═══\n`;
  ctx += `Frecuencia de Mejoras_Categoria:\n`;
  for (const f of currFreq) {
    ctx += `  - ${f.cat}: ${f.count} menciones (${f.pct}%)\n`;
  }
  ctx += `\nComentarios textuales (Mejoras_Texto) del periodo actual:\n`;
  for (const t of getTexts(currRaw).slice(0, 40)) {
    ctx += `  • "${t}"\n`;
  }

  ctx += `\n═══ PERIODO ANTERIOR: ${prevPeriod} ═══\n`;
  ctx += `Frecuencia de Mejoras_Categoria:\n`;
  for (const f of prevFreq) {
    ctx += `  - ${f.cat}: ${f.count} menciones (${f.pct}%)\n`;
  }
  ctx += `\nComentarios textuales (Mejoras_Texto) del periodo anterior:\n`;
  for (const t of getTexts(prevRaw).slice(0, 40)) {
    ctx += `  • "${t}"\n`;
  }

  return ctx;
}

export function CultureAnalysis({ data, rawData, selectedPeriod, selectedArea, selectedSubarea, selectedYear, allowedAreas }: Props) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const filterKey = `${selectedPeriod}-${selectedArea}-${selectedSubarea}-${selectedYear}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setAnalysis("");
    setHasLoaded(false);
  }

  const { currentPeriod, prevPeriod } = useMemo(() => {
    const parseP = (p: string) => {
      const m = p.match(/Q(\d)\s+(\d{4})/);
      return m ? parseInt(m[2]) * 10 + parseInt(m[1]) : 0;
    };

    const areaFilteredData = data.filter((r) => {
      if (selectedSubarea !== "all" && r.subarea !== selectedSubarea) return false;
      if (selectedSubarea === "all" && selectedArea !== "all" && r.area !== selectedArea) return false;
      if (allowedAreas && allowedAreas.length > 1 && selectedArea === "all") {
        return allowedAreas.includes(r.area);
      }
      return true;
    });
    const areaPeriods = [...new Set(areaFilteredData.map((r) => r.periodo))].sort((a, b) => parseP(a) - parseP(b));

    if (areaPeriods.length < 2) return { currentPeriod: areaPeriods[areaPeriods.length - 1] || "", prevPeriod: null };

    let curr: string;
    if (selectedPeriod !== "all") {
      curr = areaPeriods.includes(selectedPeriod) ? selectedPeriod : areaPeriods[areaPeriods.length - 1];
    } else if (selectedYear !== "all") {
      const yearPeriods = areaPeriods.filter((p) => extractYear(p) === selectedYear);
      curr = yearPeriods.length > 0 ? yearPeriods[yearPeriods.length - 1] : areaPeriods[areaPeriods.length - 1];
    } else {
      curr = areaPeriods[areaPeriods.length - 1];
    }

    const prevCandidates = areaPeriods.filter((p) => parseP(p) < parseP(curr));
    const prev = prevCandidates.length > 0 ? prevCandidates[prevCandidates.length - 1] : null;

    return { currentPeriod: curr, prevPeriod: prev };
  }, [data, selectedPeriod, selectedYear, selectedArea, selectedSubarea, allowedAreas]);

  const fetchAnalysis = useCallback(async () => {
    if (!prevPeriod) return;
    setLoading(true);
    setAnalysis("");
    setHasLoaded(true);

    const mejorasData = buildMejorasContext(data, rawData, currentPeriod, prevPeriod, selectedArea, selectedSubarea, allowedAreas);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/culture-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ mejorasData }),
        }
      );

      if (!resp.ok || !resp.body) {
        setAnalysis("Error al generar el análisis. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAnalysis(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("Culture analysis error:", err);
      setAnalysis("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [data, rawData, currentPeriod, prevPeriod, selectedArea, selectedSubarea, allowedAreas]);

  const sections = useMemo(() => {
    if (!analysis) return null;
    const victorias = analysis.match(/## ✅[^\n]*\n([\s\S]*?)(?=## ⚠️|$)/)?.[1]?.trim() || "";
    const dolores = analysis.match(/## ⚠️[^\n]*\n([\s\S]*?)(?=## 💡|$)/)?.[1]?.trim() || "";
    const recomendaciones = analysis.match(/## 💡[^\n]*\n([\s\S]*?)$/)?.[1]?.trim() || "";
    return { victorias, dolores, recomendaciones };
  }, [analysis]);

  const mdClasses = "prose prose-sm max-w-none text-foreground [&_ul]:space-y-1.5 [&_li]:text-sm [&_li]:text-muted-foreground [&_strong]:text-foreground";

  if (!prevPeriod) return null;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="card-metric p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Análisis de Cultura Organizacional</h3>
              <p className="text-[10px] text-muted-foreground">{currentPeriod} vs {prevPeriod} · Áreas de Mejora</p>
            </div>
          </div>
          <button
            onClick={fetchAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analizando…
              </>
            ) : hasLoaded ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerar
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generar análisis
              </>
            )}
          </button>
        </div>
      </div>

      {!hasLoaded && !loading && (
        <p className="text-sm text-muted-foreground italic text-center py-4">
          Haz clic en "Generar análisis" para obtener un diagnóstico experto de la evolución cultural.
        </p>
      )}

      {loading && !sections && (
        <div className="card-metric p-5 flex items-center gap-2 justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Analizando comentarios de {currentPeriod} vs {prevPeriod}…</span>
        </div>
      )}

      {sections && (sections.victorias || sections.dolores) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-metric p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-base">✅</span> Lo que hemos avanzado
            </h3>
            <div className={mdClasses}>
              <ReactMarkdown>{sections.victorias}</ReactMarkdown>
            </div>
          </div>

          <div className="card-metric p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-base">⚠️</span> Lo que aún nos duele
            </h3>
            <div className={mdClasses}>
              <ReactMarkdown>{sections.dolores}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {sections && sections.recomendaciones && (
        <div className="card-metric p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-base">💡</span> Recomendaciones Estratégicas
          </h3>
          <div className={mdClasses}>
            <ReactMarkdown>{sections.recomendaciones}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}