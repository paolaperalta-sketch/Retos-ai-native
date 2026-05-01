import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import {
  CheckCircle2, ChevronDown, ChevronRight, Play, X, BookOpen,
} from "lucide-react";
import { PROGRAMS } from "@/data/academyData";
import type { AcademyModule } from "@/data/academyData";
import ModuleEvaluation from "@/components/academy/ModuleEvaluation";

const DAY_NUMBERS = ["01", "02", "03", "04"];

export default function BiaJourneyPage() {
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [passedEvals, setPassedEvals] = useState<Set<string>>(new Set());
  const [selectedProgram] = useState<string>("onboarding");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["dia-1"]));
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");

  const program = PROGRAMS.find(p => p.id === selectedProgram)!;

  const toggleSection = (id: string) => {
    setExpandedSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleModule = (id: string) => setExpandedModule(prev => (prev === id ? null : id));
  const toggleComplete = (key: string) => {
    setCompletedTopics(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const getModuleProgress = (mod: AcademyModule) => {
    const done = mod.topics.filter((_, i) => completedTopics.has(`${mod.id}-${i}`)).length;
    return { done, total: mod.topics.length, pct: mod.topics.length ? Math.round((done / mod.topics.length) * 100) : 0 };
  };

  const isModuleComplete = (mod: AcademyModule) => {
    if (mod.evaluationQuestions?.length) return passedEvals.has(mod.id);
    const p = getModuleProgress(mod);
    return p.done === p.total && p.total > 0;
  };

  const isModuleStarted = (mod: AcademyModule) => mod.topics.some((_, i) => completedTopics.has(`${mod.id}-${i}`));

  const allModules = program.sections.flatMap(s => s.modules);
  const totalTopics = allModules.reduce((s, m) => s + m.topics.length, 0);
  const totalDone = allModules.reduce((s, m) => m.topics.filter((_, i) => completedTopics.has(`${m.id}-${i}`)).length + s, 0);
  const overallPct = totalTopics ? Math.round((totalDone / totalTopics) * 100) : 0;

  const openVideo = (title: string, url: string) => { setVideoTitle(title); setVideoUrl(url); };

  const getModuleSection = (modId: string) => {
    for (const s of program.sections) {
      if (s.modules.some(m => m.id === modId)) return s;
    }
    return null;
  };

  const activeSectionIndex = expandedModule
    ? program.sections.findIndex(s => s.modules.some(m => m.id === expandedModule))
    : -1;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader section="Bia Academy" />

          <main className="flex-1 overflow-auto">
            <div className="flex flex-col lg:flex-row min-h-full">

              {/* ─── Sidebar ─── */}
              <aside className="w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-border bg-background p-4 md:p-5 shrink-0">
                {/* Program + progress */}
                <div className="rounded-xl border border-border bg-card p-4 mb-4 shadow-[0_1px_3px_hsla(0,0%,0%,0.04)]">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Programa</p>
                  <h2 className="text-sm font-bold text-foreground mb-3">{program.title}</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${overallPct}%`, backgroundColor: "hsl(var(--success))" }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-foreground tabular-nums">{overallPct}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{totalDone} de {totalTopics} lecciones</p>
                </div>

                {/* Day sections */}
                <nav className="space-y-0.5">
                  {program.sections.map((section, si) => {
                    const expanded = expandedSections.has(section.id);
                    const mods = section.modules;
                    const done = mods.filter(m => isModuleComplete(m)).length;
                    const allDone = done === mods.length;

                    return (
                      <div key={section.id} className="rounded-lg overflow-hidden">
                        {/* Day header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-none cursor-pointer text-left transition-colors ${
                            expanded ? "bg-muted/60" : "bg-transparent hover:bg-muted/40"
                          }`}
                        >
                          {expanded
                            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                          }
                          <span className="text-[10px] font-mono font-bold rounded px-1.5 py-0.5 shrink-0"
                            style={{ color: "hsl(var(--success-foreground))", backgroundColor: "hsl(var(--success-bg))" }}>
                            DÍA {DAY_NUMBERS[si]}
                          </span>
                          <span className="flex-1 text-xs font-semibold text-foreground truncate">{section.title}</span>
                          {allDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--success))" }} />
                          ) : (
                            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{done}/{mods.length}</span>
                          )}
                        </button>

                        {/* Modules inside day */}
                        {expanded && (
                          <div className="pb-1 animate-fade-in">
                            {mods.map(mod => {
                              const Icon = mod.icon;
                              const complete = isModuleComplete(mod);
                              const active = expandedModule === mod.id;
                              const prog = getModuleProgress(mod);

                              return (
                                <button
                                  key={mod.id}
                                  onClick={() => toggleModule(mod.id)}
                                  className={`w-full flex items-center gap-2.5 ml-3 px-3 py-2 border-none cursor-pointer text-left transition-all rounded-lg ${
                                    active
                                      ? "bg-card shadow-[0_1px_3px_hsla(0,0%,0%,0.06)] border border-border"
                                      : "bg-transparent hover:bg-muted/30 border border-transparent"
                                  }`}
                                >
                                  {/* Icon — same as detail header */}
                                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    complete
                                      ? ""
                                      : active ? "bg-primary/10" : "bg-muted"
                                  }`} style={complete ? { backgroundColor: "hsl(var(--success-bg))" } : undefined}>
                                    {complete
                                      ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "hsl(var(--success))" }} />
                                      : <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className={`block text-xs truncate ${active ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                                      {mod.title}
                                    </span>
                                    {active && (
                                      <span className="block text-[10px] text-muted-foreground truncate mt-0.5">{mod.description}</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{prog.done}/{prog.total}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </aside>

              {/* ─── Content Area ─── */}
              <div className="flex-1 p-4 md:p-6 lg:p-8 bg-secondary/20">
                {!expandedModule ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center animate-fade-in">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <BookOpen className="h-7 w-7 text-primary" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-base font-bold text-foreground mb-1">Selecciona un módulo</h2>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Elige un módulo del panel lateral para ver sus lecciones y comenzar tu aprendizaje.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const mod = allModules.find(m => m.id === expandedModule);
                    if (!mod) return null;
                    const Icon = mod.icon;
                    const prog = getModuleProgress(mod);
                    const allTopicsDone = prog.done === prog.total;
                    const complete = isModuleComplete(mod);
                    const section = getModuleSection(mod.id);

                    return (
                      <div className="max-w-2xl mx-auto animate-fade-in">
                        {/* Single unified card */}
                        <div className="rounded-xl border border-border bg-card shadow-[0_1px_3px_hsla(0,0%,0%,0.04)] overflow-hidden">

                          {/* Card header — mirrors sidebar exactly */}
                          <div className="px-5 pt-5 pb-4 border-b border-border">
                            {section && activeSectionIndex >= 0 && (
                              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                                style={{ color: "hsl(var(--success-foreground))" }}>
                                Día {DAY_NUMBERS[activeSectionIndex]} · {section.title}
                              </p>
                            )}
                            <div className="flex items-center gap-3">
                              {/* Same icon container as sidebar */}
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                complete ? "" : "bg-primary/10"
                              }`} style={complete ? { backgroundColor: "hsl(var(--success))" } : undefined}>
                                <Icon className={`h-[18px] w-[18px] ${complete ? "text-white" : "text-primary"}`} strokeWidth={1.5} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h2 className="text-sm font-bold text-foreground">{mod.title}</h2>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{mod.description}</p>
                              </div>
                              {complete && (
                                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                                  style={{ color: "hsl(var(--success))", backgroundColor: "hsl(var(--success-bg))" }}>
                                  Completado
                                </span>
                              )}
                            </div>

                            {/* Progress bar — emerald */}
                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${prog.pct}%`, backgroundColor: "hsl(var(--success))" }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground tabular-nums shrink-0">
                                {prog.done}/{prog.total}
                              </span>
                            </div>
                          </div>

                          {/* Lessons list */}
                          <div className="divide-y divide-border">
                            {mod.topics.map((topic, ti) => {
                              const key = `${mod.id}-${ti}`;
                              const done = completedTopics.has(key);
                              return (
                                <div
                                  key={ti}
                                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20 group"
                                >
                                  {/* Minimalist circle — thin stroke, fills emerald */}
                                  <button onClick={() => toggleComplete(key)} className="shrink-0 bg-transparent border-none cursor-pointer p-0">
                                    {done ? (
                                      <div className="h-[18px] w-[18px] rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: "hsl(var(--success))" }}>
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                          <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      </div>
                                    ) : (
                                      <div className="h-[18px] w-[18px] rounded-full border border-border hover:border-muted-foreground transition-colors" />
                                    )}
                                  </button>
                                  <span className={`flex-1 text-[13px] ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                    {topic.title}
                                  </span>
                                  <button
                                    onClick={() => openVideo(topic.title, topic.videoUrl)}
                                    className="shrink-0 p-1.5 rounded-md bg-transparent border-none cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    <Play className="h-4 w-4" strokeWidth={1.5} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Evaluation */}
                          {mod.evaluationQuestions?.length ? (
                            <div className="border-t border-border">
                              {allTopicsDone && !complete && (
                                <div className="p-5">
                                  <ModuleEvaluation
                                    questions={mod.evaluationQuestions}
                                    onPass={() => setPassedEvals(prev => new Set(prev).add(mod.id))}
                                  />
                                </div>
                              )}
                              {!allTopicsDone && (
                                <div className="px-5 py-4 text-center">
                                  <p className="text-xs text-muted-foreground">
                                    Completa todas las lecciones para desbloquear la evaluación
                                  </p>
                                </div>
                              )}
                              {complete && (
                                <div className="px-5 py-3 flex items-center gap-2 text-xs font-semibold"
                                  style={{ color: "hsl(var(--success))" }}>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Módulo aprobado
                                </div>
                              )}
                            </div>
                          ) : (
                            prog.done === prog.total && prog.total > 0 && (
                              <div className="border-t border-border px-5 py-3 flex items-center gap-2 text-xs font-semibold"
                                style={{ color: "hsl(var(--success))" }}>
                                <CheckCircle2 className="h-4 w-4" />
                                Módulo completado
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Video overlay */}
      {videoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setVideoUrl(null)}>
          <div className="relative w-[95vw] max-w-3xl bg-card rounded-xl overflow-hidden shadow-xl border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-xs font-bold text-foreground truncate">{videoTitle}</h3>
              <button onClick={() => setVideoUrl(null)} className="p-1 rounded-md hover:bg-muted transition-colors bg-transparent border-none cursor-pointer">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="aspect-video bg-muted">
              <iframe
                src={videoUrl}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                referrerPolicy="no-referrer"
                title={videoTitle}
              />
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
