import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Loader2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getEffectiveRole } from "@/lib/rbac";
import {
  loadENPSData,
  filterData,
  getPeriods,
  getAreas,
  getAvailableAreas,
  getAvailableSubareas,
  calculateMetrics,
  getCategoryScores,
  getComments,
  buildDataContext,
  type ENPSRecord,
} from "@/lib/enpsData";
import { loadRawResponses, filterRaw, buildEnrichedContext, type RawResponse } from "@/lib/rawDataContext";
import { DashboardFilters } from "@/components/enps/DashboardFilters";
import { MetricsCards } from "@/components/enps/MetricsCards";
import { CategoryAnalysis } from "@/components/enps/CategoryAnalysis";
import { CommentsSection } from "@/components/enps/CommentsSection";
import { AIChatButton } from "@/components/enps/AIChatButton";
import { AreaRanking } from "@/components/enps/AreaRanking";
import { SalaryChart } from "@/components/enps/SalaryChart";
import { NpsMotivationChart } from "@/components/enps/NpsMotivationChart";
import { ValoresChart } from "@/components/enps/ValoresChart";
import { loadValoresData, type ValoresRecord } from "@/lib/valoresData";
import { AreaComparisonChart } from "@/components/enps/AreaComparisonChart";
import { CultureAnalysis } from "@/components/enps/CultureAnalysis";
import { LeadershipAnalysis } from "@/components/enps/LeadershipAnalysis";

function extractYear(periodo: string): string {
  const match = periodo.match(/\d{4}/);
  return match ? match[0] : "";
}

export default function EnpsDashboard() {
  const { user, role } = useAuth();
  const effectiveRole = useMemo(() => getEffectiveRole(user?.email, role), [user?.email, role]);
  const userArea = useMemo(() => {
    // For team_leader / global_leader, detect their area from profile
    // This is simplified — area filtering happens via allowedAreas
    return null as string | null;
  }, []);

  const [data, setData] = useState<ENPSRecord[]>([]);
  const [rawData, setRawData] = useState<RawResponse[]>([]);
  const [valoresData, setValoresData] = useState<ValoresRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedSubarea, setSelectedSubarea] = useState("all");

  const [commentTypeFilter, setCommentTypeFilter] = useState<string | undefined>();
  const [commentCategoryFilter, setCommentCategoryFilter] = useState<string | undefined>();
  const [commentsVisible, setCommentsVisible] = useState(false);
  const commentsSectionRef = useRef<HTMLDivElement>(null);

  const allowedAreas: string[] | null = null;
  const effectiveArea = selectedArea;

  useEffect(() => {
    Promise.all([loadENPSData(), loadRawResponses(), loadValoresData()]).then(([d, raw, val]) => {
      setData(d);
      setRawData(raw);
      setValoresData(val);
      const allPeriods = getPeriods(d);
      if (allPeriods.length > 0) {
        const latest = allPeriods[allPeriods.length - 1];
        const latestYear = latest.match(/\d{4}/)?.[0] || "all";
        setSelectedYear(latestYear);
        setSelectedPeriod(latest);
      }
      setLoading(false);
    });
  }, []);

  const periods = useMemo(() => getPeriods(data), [data]);
  const areas = useMemo(() => getAreas(data), [data]);

  const years = useMemo(() => {
    const yrs = [...new Set(periods.map(extractYear).filter(Boolean))].sort();
    return yrs;
  }, [periods]);

  const periodsForYear = useMemo(() => {
    return periods.filter((p) => extractYear(p) === selectedYear);
  }, [periods, selectedYear]);

  const availableAreas = useMemo(() => {
    if (selectedPeriod !== "all") return getAvailableAreas(data, selectedPeriod);
    if (selectedYear !== "all") {
      const yearData = data.filter((r) => extractYear(r.periodo) === selectedYear);
      return [...new Set(yearData.map((r) => r.area).filter(Boolean))].sort();
    }
    return getAreas(data);
  }, [data, selectedPeriod, selectedYear]);
  const availableSubareas = useMemo(() => getAvailableSubareas(data, selectedPeriod, effectiveArea), [data, selectedPeriod, effectiveArea]);

  const filtered = useMemo(() => {
    let result = filterData(data, selectedPeriod, effectiveArea, selectedSubarea);
    if (selectedPeriod === "all" && selectedYear !== "all") {
      result = result.filter((r) => extractYear(r.periodo) === selectedYear);
    }
    return result;
  }, [data, selectedPeriod, effectiveArea, selectedSubarea, selectedYear]);

  const companyData = useMemo(() => {
    let result = filterData(data, selectedPeriod, "all", "all");
    if (selectedPeriod === "all" && selectedYear !== "all") {
      result = result.filter((r) => extractYear(r.periodo) === selectedYear);
    }
    return result;
  }, [data, selectedPeriod, selectedYear]);

  const metrics = useMemo(() => calculateMetrics(filtered), [filtered]);

  const previousFiltered = useMemo(() => {
    if (selectedPeriod === "all") return null;
    const idx = periods.indexOf(selectedPeriod);
    if (idx <= 0) return null;
    const prev = filterData(data, periods[idx - 1], effectiveArea, selectedSubarea);
    if (prev.length === 0) return null;
    return prev;
  }, [data, selectedPeriod, effectiveArea, selectedSubarea, periods]);

  const previousMetrics = useMemo(() => {
    if (!previousFiltered) return null;
    return calculateMetrics(previousFiltered);
  }, [previousFiltered]);

  const motivacionCats = useMemo(() => getCategoryScores(filtered, "valoras"), [filtered]);
  const mejorasCats = useMemo(() => getCategoryScores(filtered, "mejoras"), [filtered]);
  const comments = useMemo(() => getComments(filtered), [filtered]);
  
  const filteredRaw = useMemo(() => filterRaw(rawData, selectedPeriod, effectiveArea, selectedSubarea, selectedYear, allowedAreas), [rawData, selectedPeriod, effectiveArea, selectedSubarea, selectedYear, allowedAreas]);
  const dataContext = useMemo(() => {
    const base = buildDataContext(filtered, metrics, selectedPeriod, effectiveArea, selectedSubarea);
    const enriched = buildEnrichedContext(filteredRaw, selectedPeriod, effectiveArea, selectedSubarea);
    return `${base}\n\n═══ DATOS DETALLADOS DE RESPUESTAS CRUDAS ═══\n${enriched}`;
  }, [filtered, metrics, selectedPeriod, effectiveArea, selectedSubarea, filteredRaw]);

  const salaryData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filtered) {
      if (r.salarioSatisfecho) {
        counts[r.salarioSatisfecho] = (counts[r.salarioSatisfecho] || 0) + 1;
      }
    }
    const order = ["Si.", "Parcialmente.", "No."];
    return order.filter((k) => counts[k]).map((k) => ({ name: k, value: counts[k] }));
  }, [filtered]);

  const salaryBreakdown = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const useSubarea = effectiveArea !== "all";
    for (const r of filtered) {
      const key = useSubarea ? r.subarea : r.area;
      if (r.salarioSatisfecho && key) {
        if (!map[r.salarioSatisfecho]) map[r.salarioSatisfecho] = {};
        map[r.salarioSatisfecho][key] = (map[r.salarioSatisfecho][key] || 0) + 1;
      }
    }
    return map;
  }, [filtered, effectiveArea]);

  useEffect(() => {
    if (selectedYear !== "all") {
      const matching = periods.filter((p) => extractYear(p) === selectedYear);
      if (matching.length === 1 && selectedPeriod !== matching[0]) {
        setSelectedPeriod(matching[0]);
      }
    }
  }, [selectedYear, periods, selectedPeriod]);

  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year);
    setSelectedPeriod("all");
    setSelectedArea("all");
    setSelectedSubarea("all");
  }, []);

  const handleAreaChange = useCallback((area: string) => {
    setSelectedArea(area);
    setSelectedSubarea("all");
  }, []);

  const handleCategoryClick = useCallback((type: "valoras" | "mejoras", category: string) => {
    setCommentTypeFilter(type);
    setCommentCategoryFilter(category);
    setCommentsVisible(true);
    setTimeout(() => {
      commentsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, []);

  const handleSalaryClick = useCallback((answer: string) => {
    setCommentTypeFilter("salary:" + answer);
    setCommentCategoryFilter(undefined);
  }, []);

  const handleClearExternalFilter = useCallback(() => {
    setCommentTypeFilter(undefined);
    setCommentCategoryFilter(undefined);
  }, []);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="shrink-0 border-b border-border bg-card z-50">
              <div className="max-w-7xl mx-auto" style={{ padding: "var(--header-padding-top) var(--header-padding-x) var(--header-padding-bottom)" }}>
                <div>
                  <h1 className="page-title">eNPS Dashboard</h1>
                  <p className="page-subtitle" style={{ marginTop: "var(--header-title-mb)" }}>Insights ejecutivos · Bia</p>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto max-w-7xl mx-auto w-full px-8 py-6 space-y-5">
              <div className="people-metrics-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="people-card animate-pulse h-28 bg-muted/30" />
                ))}
              </div>
              <div className="people-card animate-pulse h-80 bg-muted/30" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="people-card animate-pulse h-64 bg-muted/30" />
                <div className="people-card animate-pulse h-64 bg-muted/30" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="shrink-0 border-b border-border bg-card z-50">
            <div className="max-w-7xl mx-auto page-header-row" style={{ padding: "var(--header-padding-top) var(--header-padding-x) var(--header-padding-bottom)" }}>
              <div className="page-header-text">
                <h1 className="page-title">eNPS Dashboard</h1>
                <p className="page-subtitle">Insights ejecutivos · Bia</p>
              </div>
              <div className="page-header-controls">
                <DashboardFilters
                  years={years}
                  selectedYear={selectedYear}
                  onYearChange={handleYearChange}
                  periodsForYear={periodsForYear}
                  areas={areas}
                  availableAreas={availableAreas}
                  availableSubareas={availableSubareas}
                  selectedPeriod={selectedPeriod}
                  selectedArea={effectiveArea}
                  selectedSubarea={selectedSubarea}
                  onPeriodChange={setSelectedPeriod}
                  onAreaChange={handleAreaChange}
                  onSubareaChange={setSelectedSubarea}
                  allowedAreas={allowedAreas}
                  showPeriod={true}
                  showArea={true}
                  showSubarea={effectiveArea !== "all"}
                />
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto">

          <main className="max-w-7xl mx-auto px-8 py-6 space-y-5">
            <MetricsCards current={metrics} previous={previousMetrics} isOverview={false} />

            <NpsMotivationChart data={companyData} allowedAreas={allowedAreas} selectedArea={effectiveArea} selectedSubarea={selectedSubarea} />

            {selectedPeriod === "Q1 2026" && effectiveArea === "all" && (
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="group w-full flex items-center justify-between card-metric px-5 py-3 cursor-pointer hover:bg-muted/40 transition-colors text-left">
                  <span className="font-semibold text-foreground">Ver detalle comparativo por área</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <AreaComparisonChart data={data} allowedAreas={allowedAreas} />
                </CollapsibleContent>
              </Collapsible>
            )}

            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="group w-full flex items-center justify-between card-metric px-5 py-3 cursor-pointer hover:bg-muted/40 transition-colors text-left">
                <span className="font-semibold text-foreground">Ver ranking por área</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <AreaRanking data={data} selectedPeriod={selectedPeriod} selectedArea={effectiveArea} />
              </CollapsibleContent>
            </Collapsible>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalaryChart data={salaryData} areaBreakdown={salaryBreakdown} onSliceClick={handleSalaryClick} breakdownLabel={effectiveArea !== "all" ? "subárea" : "área"} />
              {selectedPeriod === "Q1 2026" && (
                <ValoresChart data={valoresData} selectedArea={effectiveArea} selectedSubarea={selectedSubarea} allowedAreas={allowedAreas} />
              )}
            </div>

            <CategoryAnalysis
              motivacionCategories={motivacionCats}
              mejorasCategories={mejorasCats}
              onCategoryClick={handleCategoryClick}
            />

            <div ref={commentsSectionRef}>
              <button
                onClick={() => setCommentsVisible((v) => !v)}
                className="w-full flex items-center justify-between card-metric px-5 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Comentarios</span>
                  <span className="text-xs text-muted-foreground">({comments.length})</span>
                </div>
                {commentsVisible ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {commentsVisible && (
                <div className="mt-2">
                  <CommentsSection
                    comments={comments}
                    externalTypeFilter={commentTypeFilter}
                    externalCategoryFilter={commentCategoryFilter}
                    onClearExternalFilter={handleClearExternalFilter}
                  />
                </div>
              )}
            </div>

            <LeadershipAnalysis
              filtered={filtered}
              companyData={companyData}
              previousFiltered={previousFiltered}
              selectedArea={effectiveArea}
              selectedSubarea={selectedSubarea}
            />

            <CultureAnalysis
              data={data}
              rawData={rawData}
              selectedPeriod={selectedPeriod}
              selectedArea={effectiveArea}
              selectedSubarea={selectedSubarea}
              selectedYear={selectedYear}
              allowedAreas={allowedAreas}
            />

          </main>

          <AIChatButton dataContext={dataContext} userRole={effectiveRole} userArea={effectiveArea !== "all" ? effectiveArea : undefined} />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}