import { useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Users, Crown, Handshake, Sparkles } from "lucide-react";
import { ReviewForm } from "@/components/review/ReviewForm";
import { ResultBreakdown } from "@/components/review/ResultBreakdown";
import { TeamReviewList, type ReportRow } from "@/components/review/TeamReviewList";
import { useReviewCatalog } from "@/hooks/useReviewCatalog";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions, getUserNode } from "@/lib/rbac";
import { findParent, teamHierarchy } from "@/data/teamHierarchy";
import {
  computeFinalScore,
  type EvaluatorRole,
  type ProfileType,
  type ResponseRow,
} from "@/lib/review-utils";
import { toast } from "sonner";

interface Props {
  context: "desempeno" | "equipo";
}

interface ActiveEvaluation {
  name: string;
  profileType: ProfileType;
  evaluatorRole: EvaluatorRole;
}

const PerformanceReviewPage = ({ context }: Props) => {
  const { user, role } = useAuth();
  const permissions = getUserPermissions(user?.email, role);
  const isLeader = permissions.canSeeTeam;

  const { dimensions, items, weights, loading } = useReviewCatalog();
  const [tab, setTab] = useState(context === "equipo" && isLeader ? "team" : "self");
  const [active, setActive] = useState<ActiveEvaluation | null>(null);
  const [showExample, setShowExample] = useState(true);

  // ─── Resolver jerarquía del usuario actual ───
  const userNode = getUserNode(user?.email);
  const userParent = userNode ? findParent(teamHierarchy, userNode.name) : null;
  const directReports = userNode?.directReports ?? [];

  const reports: ReportRow[] = useMemo(
    () =>
      directReports.map((r, idx) => ({
        name: r.name,
        role: r.role,
        contribucion: r.contribucion,
        state: idx === 0 ? "submitted" : idx === 1 ? "in_progress" : "pending",
        progress: idx === 0 ? 100 : idx === 1 ? 60 : 0,
      })),
    [directReports],
  );

  // Stakeholders: pares del equipo del manager (otros líderes que reportan al mismo jefe).
  // Para CEO directs (VPs), tomamos los otros C-levels/VPs como pares transversales.
  const stakeholders = useMemo(() => {
    if (!userNode) return [];
    if (!userParent?.directReports) return [];
    return userParent.directReports
      .filter((p) => p.name !== userNode.name)
      .slice(0, 4);
  }, [userParent, userNode]);

  // ─── Demo Paola Peralta (Líder) ───
  const demo = useMemo(() => {
    if (loading) return null;
    const itemByCode = new Map(items.map((i) => [i.code, i]));
    const raw: { code: string; role: EvaluatorRole; score: number }[] = [
      { code: "A1", role: "self", score: 4 }, { code: "A2", role: "self", score: 3 },
      { code: "B1", role: "self", score: 4 }, { code: "B2", role: "self", score: 3 },
      { code: "C1", role: "self", score: 3 }, { code: "C2", role: "self", score: 3 },
      { code: "A1", role: "leader", score: 4 }, { code: "A2", role: "leader", score: 3 },
      { code: "B1", role: "leader", score: 4 }, { code: "B2", role: "leader", score: 3 },
      { code: "C1", role: "leader", score: 3 }, { code: "C2", role: "leader", score: 3 },
      { code: "A1", role: "team", score: 4 }, { code: "A2", role: "team", score: 4 },
      { code: "B1", role: "team", score: 4 }, { code: "B2", role: "team", score: 4 },
      { code: "C1", role: "team", score: 3 }, { code: "C2", role: "team", score: 3 },
      { code: "PSS", role: "self", score: 4 }, { code: "SM", role: "self", score: 4 },
      { code: "ATP", role: "self", score: 3 }, { code: "AD", role: "self", score: 4 },
      { code: "UC", role: "self", score: 4 },
      { code: "PSS", role: "leader", score: 4 }, { code: "SM", role: "leader", score: 4 },
      { code: "ATP", role: "leader", score: 4 }, { code: "AD", role: "leader", score: 3 },
      { code: "UC", role: "leader", score: 4 },
      { code: "PSS", role: "stakeholder", score: 4 }, { code: "SM", role: "stakeholder", score: 4 },
      { code: "ATP", role: "stakeholder", score: 3 }, { code: "AD", role: "stakeholder", score: 4 },
      { code: "UC", role: "stakeholder", score: 4 },
      { code: "PSS", role: "team", score: 4 }, { code: "SM", role: "team", score: 4 },
      { code: "ATP", role: "team", score: 4 }, { code: "AD", role: "team", score: 4 },
      { code: "UC", role: "team", score: 4 },
      { code: "L1", role: "self", score: 3 }, { code: "L2", role: "self", score: 4 },
      { code: "L3", role: "self", score: 4 }, { code: "L4", role: "self", score: 3 },
      { code: "L1", role: "leader", score: 4 }, { code: "L2", role: "leader", score: 4 },
      { code: "L3", role: "leader", score: 4 }, { code: "L4", role: "leader", score: 3 },
      { code: "L1", role: "team", score: 4 }, { code: "L2", role: "team", score: 4 },
      { code: "L3", role: "team", score: 4 }, { code: "L4", role: "team", score: 4 },
      { code: "OKR", role: "leader", score: 4 },
      { code: "PRJ", role: "leader", score: 4 },
      { code: "CMP1", role: "self", score: 4 }, { code: "CMP2", role: "self", score: 4 },
      { code: "CMP3", role: "self", score: 4 }, { code: "CMP4", role: "self", score: 4 },
      { code: "CMP1", role: "leader", score: 4 }, { code: "CMP2", role: "leader", score: 3 },
      { code: "CMP3", role: "leader", score: 4 }, { code: "CMP4", role: "leader", score: 3 },
      { code: "CMP1", role: "team", score: 4 }, { code: "CMP2", role: "team", score: 4 },
      { code: "CMP3", role: "team", score: 4 }, { code: "CMP4", role: "team", score: 4 },
    ];
    const responses: ResponseRow[] = raw
      .map((r) => {
        const item = itemByCode.get(r.code);
        if (!item) return null;
        return {
          item_id: item.id,
          score: r.score,
          evidence: null,
          evaluator_role: r.role,
        } as ResponseRow;
      })
      .filter(Boolean) as ResponseRow[];

    const result = computeFinalScore({
      profileType: "leader",
      dimensions,
      items,
      weights,
      responses,
    });

    const evidences = [
      {
        itemCode: "B1",
        question: itemByCode.get("B1")?.question ?? "",
        evidence:
          "Lideró la implementación del módulo Bia Native con AI sin que estuviera en su roadmap, generando 2x adopción interna en 30 días.",
        evaluator: "Líder",
      },
      {
        itemCode: "L2",
        question: itemByCode.get("L2")?.question ?? "",
        evidence:
          "Sostuvo conversaciones de feedback difíciles con 3 personas del equipo, todas terminaron con planes de acción concretos.",
        evaluator: "Equipo",
      },
      {
        itemCode: "OKR",
        question: itemByCode.get("OKR")?.question ?? "",
        evidence: "Cerró Q1 con 92% de cumplimiento de KRs y entregó el proyecto Performance Review en tiempo.",
        evaluator: "Líder",
      },
    ];

    return { result, evidences };
  }, [loading, dimensions, items, weights]);

  // ─── Render ───
  const handleOpen = (name: string, profileType: ProfileType, evaluatorRole: EvaluatorRole) => {
    setActive({ name, profileType, evaluatorRole });
    setShowExample(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader section="Performance Review · Q1 2026" sticky />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-5xl mx-auto">
              {active ? (
                <div className="space-y-4">
                  <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                  <ReviewForm
                    evaluatedName={active.name.toUpperCase()}
                    profileType={active.profileType}
                    evaluatorRole={active.evaluatorRole}
                    onSave={async (_a, submit) => {
                      toast.success(submit ? "Evaluación enviada." : "Borrador guardado.");
                      if (submit) setActive(null);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">Performance Review Q1 2026</h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        {permissions.userName ?? user?.email} · {isLeader ? "Líder" : "Contribuidor Individual"}
                      </p>
                    </div>
                    {isLeader && (
                      <Button
                        variant={showExample ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowExample((v) => !v)}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-2" />
                        {showExample ? "Ocultar" : "Ver"} ejemplo Paola
                      </Button>
                    )}
                  </div>

                  {showExample && demo && (
                    <div className="mb-8 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.02] p-6">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-4">
                        🎬 Ejemplo de salida — Paola Andrea Peralta Vargas (Líder)
                      </p>
                      <ResultBreakdown
                        evaluatedName="PAOLA ANDREA PERALTA VARGAS"
                        profileType="leader"
                        totalScore={demo.result.totalScore}
                        classification={demo.result.classification}
                        dimensionScores={demo.result.dimensionScores}
                        evidences={demo.evidences}
                      />
                    </div>
                  )}

                  <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList className={isLeader ? "grid grid-cols-4 w-full max-w-2xl" : "grid grid-cols-3 w-full max-w-xl"}>
                      <TabsTrigger value="self" className="text-xs">
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        Autoevaluación
                      </TabsTrigger>
                      {isLeader && (
                        <TabsTrigger value="team" className="text-xs">
                          <Users className="h-3.5 w-3.5 mr-1.5" />
                          Mi Equipo
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="leader" className="text-xs">
                        <Crown className="h-3.5 w-3.5 mr-1.5" />
                        Mi Líder
                      </TabsTrigger>
                      <TabsTrigger value="stakeholders" className="text-xs">
                        <Handshake className="h-3.5 w-3.5 mr-1.5" />
                        Stakeholders
                      </TabsTrigger>
                    </TabsList>

                    {/* AUTOEVALUACIÓN */}
                    <TabsContent value="self" className="mt-6">
                      <div className="rounded-xl border border-border/60 bg-card p-5 mb-4">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Tu autoevaluación
                        </p>
                        <h3 className="text-base font-bold text-foreground mt-1">
                          {(permissions.userName ?? "Tú").toUpperCase()}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Califica tu propio desempeño con honestidad. Esta nota se pondera con la del líder, equipo y stakeholders.
                        </p>
                        <Button
                          className="mt-3"
                          size="sm"
                          onClick={() =>
                            handleOpen(
                              permissions.userName ?? "Mi autoevaluación",
                              isLeader ? "leader" : "individual",
                              "self",
                            )
                          }
                        >
                          Comenzar autoevaluación
                          <ArrowLeft className="h-3.5 w-3.5 ml-2 rotate-180" />
                        </Button>
                      </div>
                    </TabsContent>

                    {/* MI EQUIPO */}
                    {isLeader && (
                      <TabsContent value="team" className="mt-6">
                        <div className="mb-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Tus reportes directos
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Evalúa a cada persona de tu equipo. El sistema consolida con auto, equipo y stakeholders.
                          </p>
                        </div>
                        <TeamReviewList
                          reports={reports}
                          onOpen={(name) => {
                            const r = directReports.find((x) => x.name === name);
                            const profileType: ProfileType = r?.contribucion === "LÍDER" ? "leader" : "individual";
                            handleOpen(name, profileType, "leader");
                          }}
                        />
                      </TabsContent>
                    )}

                    {/* MI LÍDER */}
                    <TabsContent value="leader" className="mt-6">
                      {userParent ? (
                        <div className="rounded-xl border border-border/60 bg-card p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-warning-bg grid place-items-center">
                              <Crown className="h-4 w-4 text-warning-foreground" />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Tu líder directo
                              </p>
                              <h3 className="text-sm font-bold text-foreground">
                                {userParent.name.toUpperCase()}
                              </h3>
                              <p className="text-[11px] text-muted-foreground">{userParent.role}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            Evalúa a tu líder en AI Mindset, Cultura, Liderazgo y Competencias. Esta nota representa el "voto del equipo" (60% en Liderazgo).
                          </p>
                          <Button size="sm" onClick={() => handleOpen(userParent.name, "leader", "team")}>
                            Evaluar a mi líder
                          </Button>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                          No tienes un líder asignado en la jerarquía.
                        </div>
                      )}
                    </TabsContent>

                    {/* STAKEHOLDERS */}
                    <TabsContent value="stakeholders" className="mt-6">
                      <div className="mb-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Pares y colaboradores transversales
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Evalúa a quienes trabajaron contigo este trimestre. Tu nota aporta a la dimensión de Cultura.
                        </p>
                      </div>
                      {stakeholders.length === 0 ? (
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                          No hay stakeholders asignados todavía.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {stakeholders.map((s) => (
                            <button
                              key={s.name}
                              onClick={() =>
                                handleOpen(
                                  s.name,
                                  s.contribucion === "LÍDER" ? "leader" : "individual",
                                  "stakeholder",
                                )
                              }
                              className="w-full text-left rounded-xl border border-border/60 bg-card hover:bg-muted/30 hover:border-primary/40 transition-all p-4 flex items-center gap-4 cursor-pointer"
                            >
                              <div className="h-10 w-10 rounded-full bg-warning-bg/40 grid place-items-center text-sm font-bold text-warning-foreground shrink-0">
                                {s.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {s.name.toUpperCase()}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">{s.role}</p>
                              </div>
                              <span className="text-[10px] font-semibold text-warning-foreground bg-warning-bg px-2 py-1 rounded-full">
                                Stakeholder
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PerformanceReviewPage;
