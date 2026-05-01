import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { ONBOARDING_DAYS, QUIZ_1, QUIZ_2, getDayProgress, isDayComplete, getDayVideoIds } from "@/data/onboardingData";
import { VideoCard } from "@/components/onboarding/VideoCard";
import { BreakCard } from "@/components/onboarding/BreakCard";
import { QuizEngine } from "@/components/onboarding/QuizEngine";
import { OnboardingCertificate } from "@/components/onboarding/OnboardingCertificate";
import { Lock, CheckCircle2, Zap, BookOpen, Trophy, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type View = "day" | "quiz1" | "quiz2" | "certificate" | "progress";

export default function OnboardingPage() {
  const { user } = useAuth();
  const email = user?.email || "";
  const userName = user?.user_metadata?.full_name || email.split("@")[0];
  
  const { progress, markVideoComplete, markDayDone, saveQuizAttempt } = useOnboardingProgress(email, userName);
  const [activeDay, setActiveDay] = useState(0); // 0-indexed
  const [view, setView] = useState<View>("day");
  const [breakDone, setBreakDone] = useState(false);

  // Day unlock logic (merged days 2+3 into day2, so only 3 days)
  const isDayUnlocked = (idx: number): boolean => {
    if (idx === 0) return true;
    if (idx === 1) return isDayComplete(ONBOARDING_DAYS[0], progress.completedVideos);
    if (idx === 2) return isDayComplete(ONBOARDING_DAYS[1], progress.completedVideos) && progress.quiz1Passed;
    return false;
  };

  const currentDay = ONBOARDING_DAYS[activeDay];
  const dayProgress = getDayProgress(currentDay, progress.completedVideos);
  const dayComplete = isDayComplete(currentDay, progress.completedVideos);

  // Flatten all videos with section tracking for break logic
  const allDayVideos = useMemo(() => {
    let globalIdx = 0;
    return currentDay.sections.flatMap(section =>
      section.videos.map(v => ({ ...v, sectionTitle: section.title, globalIndex: globalIdx++ }))
    );
  }, [currentDay]);

  const breakAfterIdx = currentDay.hasBreak?.afterVideoIndex ?? -1;

  // Check if break is needed and not yet completed
  const needsBreak = breakAfterIdx >= 0 && !breakDone;
  const breakVideoIds = allDayVideos.slice(0, breakAfterIdx + 1).map(v => v.id);
  const preBreakDone = breakVideoIds.every(id => progress.completedVideos.includes(id));
  const showBreak = needsBreak && preBreakDone;

  // Overall progress
  const totalVideos = ONBOARDING_DAYS.flatMap(d => getDayVideoIds(d)).length;
  const completedCount = progress.completedVideos.length;
  const overallPct = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  const handleDayClick = (idx: number) => {
    if (isDayUnlocked(idx)) {
      setActiveDay(idx);
      setView("day");
      setBreakDone(false);
    }
  };

  const handleQuizComplete = (quizNum: 1 | 2, score: number) => {
    saveQuizAttempt(quizNum, score);
  };

  // Check for pending quiz
  const showQuizBanner = dayComplete && currentDay.quizAfter && !progress[`${currentDay.quizAfter}Passed` as keyof typeof progress];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 flex items-center border-b border-border bg-background px-4 md:px-6 justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-2 md:mr-4" />
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground">Talentos Bia</span>
              <span className="text-[10px] text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                Proceso de Inmersión
              </span>
            </div>
            <button
              onClick={() => setView(view === "progress" ? "day" : "progress")}
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Trophy className="h-3.5 w-3.5" /> Mi Progreso
            </button>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Day Navigation Sidebar */}
            <aside className="w-64 border-r border-border bg-card p-4 space-y-3 overflow-auto hidden md:block">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Días del proceso</p>
              {ONBOARDING_DAYS.map((day, idx) => {
                const unlocked = isDayUnlocked(idx);
                const dp = getDayProgress(day, progress.completedVideos);
                const done = isDayComplete(day, progress.completedVideos);
                const isActive = idx === activeDay && view === "day";
                return (
                  <button
                    key={day.id}
                    onClick={() => handleDayClick(idx)}
                    disabled={!unlocked}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : unlocked
                          ? "border-border/50 hover:border-border bg-background"
                          : "border-border/30 bg-muted/30 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-foreground">Día {day.id}</span>
                      {!unlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                      {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight mb-2">{day.title}</p>
                    {unlocked && (
                      <Progress value={dp} className="h-1" />
                    )}
                  </button>
                );
              })}

              {/* Quiz / Certificate shortcuts */}
              {progress.quiz1Passed && (
                <button
                  onClick={() => setView("quiz1")}
                  className="w-full text-left p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-foreground">Evaluación #1</span>
                    <span className="text-[10px] text-emerald-600 ml-auto">{progress.quiz1BestScore}%</span>
                  </div>
                </button>
              )}
              {progress.quiz2Passed && (
                <button
                  onClick={() => setView("quiz2")}
                  className="w-full text-left p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-foreground">Evaluación Final</span>
                    <span className="text-[10px] text-emerald-600 ml-auto">{progress.quiz2BestScore}%</span>
                  </div>
                </button>
              )}
              {progress.certificateUnlocked && (
                <button
                  onClick={() => setView("certificate")}
                  className="w-full text-left p-3 rounded-xl border border-primary/30 bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-primary">Ver Certificado</span>
                  </div>
                </button>
              )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto people-module-shell">
              {/* Progress View */}
              {view === "progress" && (
                <div className="max-w-md mx-auto space-y-6 py-8">
                  <h2 className="text-lg font-bold text-foreground text-center">Mi Progreso</h2>
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Videos completados</span>
                      <span className="text-sm font-bold text-foreground">{completedCount}/{totalVideos}</span>
                    </div>
                    <Progress value={overallPct} className="h-2" />
                    <div className="space-y-2 text-sm">
                      {ONBOARDING_DAYS.map((d, i) => (
                        <div key={d.id} className="flex justify-between">
                          <span className="text-muted-foreground">Día {d.id}</span>
                          <span className={isDayComplete(d, progress.completedVideos) ? "text-emerald-500 font-medium" : "text-muted-foreground"}>
                            {isDayComplete(d, progress.completedVideos) ? "✓ Completado" : `${getDayProgress(d, progress.completedVideos)}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                    {progress.quiz1Attempts.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">Evaluación #1: <span className="text-foreground font-semibold">{progress.quiz1BestScore}%</span> (mejor de {progress.quiz1Attempts.length} intentos)</p>
                      </div>
                    )}
                    {progress.quiz2Attempts.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Evaluación Final: <span className="text-foreground font-semibold">{progress.quiz2BestScore}%</span> (mejor de {progress.quiz2Attempts.length} intentos)</p>
                      </div>
                    )}
                    {progress.certificateUnlocked && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm font-bold text-foreground">Puntaje final del proceso: <span className="text-primary">{progress.finalAverageScore}%</span></p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quiz View */}
              {view === "quiz1" && (
                <QuizEngine
                  title="Evaluación #1"
                  questions={QUIZ_1}
                  onComplete={(s) => handleQuizComplete(1, s)}
                  attempts={progress.quiz1Attempts}
                  bestScore={progress.quiz1BestScore}
                  passed={progress.quiz1Passed}
                />
              )}
              {view === "quiz2" && (
                <QuizEngine
                  title="Evaluación Final"
                  questions={QUIZ_2}
                  onComplete={(s) => handleQuizComplete(2, s)}
                  attempts={progress.quiz2Attempts}
                  bestScore={progress.quiz2BestScore}
                  passed={progress.quiz2Passed}
                />
              )}

              {/* Certificate View */}
              {view === "certificate" && progress.certificateUnlocked && (
                <OnboardingCertificate
                  name={progress.name || userName}
                  finalScore={progress.finalAverageScore}
                  quiz1Best={progress.quiz1BestScore}
                  quiz1Attempts={progress.quiz1Attempts.length}
                  quiz2Best={progress.quiz2BestScore}
                  quiz2Attempts={progress.quiz2Attempts.length}
                />
              )}

              {/* Day Content View */}
              {view === "day" && (
                <div className="space-y-6 max-w-3xl">
                  {/* Day Banner */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Día {currentDay.id} — {currentDay.title}</h2>
                      <p className="text-xs text-muted-foreground mt-1">{currentDay.objective}</p>
                    </div>
                    <div className="ml-auto shrink-0 text-right">
                      <span className="text-lg font-bold text-primary">{dayProgress}%</span>
                      <Progress value={dayProgress} className="h-1 w-20 mt-1" />
                    </div>
                  </div>

                  {/* Sections */}
                  {currentDay.sections.map((section, sIdx) => {
                    // Check if this section is after break and break not done
                    const sectionStartIdx = currentDay.sections.slice(0, sIdx).reduce((sum, s) => sum + s.videos.length, 0);
                    const isAfterBreak = breakAfterIdx >= 0 && sectionStartIdx > breakAfterIdx;
                    const locked = isAfterBreak && needsBreak && !breakDone;

                    return (
                      <div key={sIdx} className={`space-y-3 ${locked ? "opacity-40 pointer-events-none" : ""}`}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{section.title}</h3>
                          {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        {section.videos.map(video => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            completed={progress.completedVideos.includes(video.id)}
                            onComplete={markVideoComplete}
                          />
                        ))}

                        {/* Break Card after section if applicable */}
                        {sIdx === 0 && showBreak && (
                          <BreakCard
                            label={currentDay.hasBreak!.label}
                            onComplete={() => setBreakDone(true)}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Quiz Banner */}
                  {dayComplete && currentDay.quizAfter && (
                    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/5 p-5 text-center space-y-3">
                      {progress[`${currentDay.quizAfter}Passed` as keyof typeof progress] ? (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                          <p className="text-sm font-bold text-foreground">
                            {currentDay.quizAfter === "quiz1" ? "Evaluación #1" : "Evaluación Final"} superada ✓
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Mejor puntaje: {currentDay.quizAfter === "quiz1" ? progress.quiz1BestScore : progress.quiz2BestScore}%
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-foreground">
                            ¡Completaste el Día {currentDay.id}! Ahora pon a prueba lo aprendido. ⚡
                          </p>
                          <button
                            onClick={() => setView(currentDay.quizAfter!)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                          >
                            Iniciar {currentDay.quizAfter === "quiz1" ? "Evaluación #1" : "Evaluación Final"} ⚡
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Certificate unlock */}
                  {progress.certificateUnlocked && activeDay === ONBOARDING_DAYS.length - 1 && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center space-y-3">
                      <Trophy className="h-8 w-8 text-primary mx-auto" />
                      <p className="text-sm font-bold text-foreground">¡Proceso completado! Tu certificado está listo.</p>
                      <button
                        onClick={() => setView("certificate")}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Ver mi Certificado ⚡
                      </button>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
