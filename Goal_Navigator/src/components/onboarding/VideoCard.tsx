import { useState, useEffect, useRef } from "react";
import { Play, CheckCircle2, Target, Clock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { OnboardingVideo } from "@/data/onboardingData";

interface Props {
  video: OnboardingVideo;
  completed: boolean;
  onComplete: (id: string) => void;
}

export function VideoCard({ video, completed, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [canMark, setCanMark] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open && !completed) {
      timerRef.current = setTimeout(() => setCanMark(true), 5000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [open, completed]);

  const isPlaceholder = !video.url;

  return (
    <>
      <div className={`group rounded-xl border p-4 transition-all ${
        completed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border/50 bg-card hover:border-primary/30"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            completed ? "bg-emerald-500/20" : "bg-primary/10"
          }`}>
            {completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Play className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground">{video.title}</h4>
            <div className="flex items-start gap-1.5 mt-1.5">
              <Target className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">{video.objective}</p>
            </div>
          </div>
          <div className="shrink-0">
            {isPlaceholder ? (
              <button
                onClick={() => !completed && onComplete(video.id)}
                disabled={completed}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  completed
                    ? "bg-emerald-500/20 text-emerald-600"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {completed ? "✓ Revisado" : "Marcar como revisado"}
              </button>
            ) : (
              <button
                onClick={() => setOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                ▶ Ver video
              </button>
            )}
          </div>
        </div>
        {isPlaceholder && !completed && (
          <div className="mt-2 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Próximamente 🔜</span>
          </div>
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-card">
            <h3 className="text-sm font-bold text-foreground">{video.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{video.objective}</p>
          </div>
          {video.url && (
            <div className="aspect-video">
              <iframe
                src={video.url}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          )}
          <div className="p-4 flex justify-end gap-2">
            {!completed && (
              <button
                disabled={!canMark}
                onClick={() => { onComplete(video.id); setOpen(false); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  canMark
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {canMark ? "✓ Marcar como completado" : "Espera unos segundos..."}
              </button>
            )}
            {completed && (
              <span className="px-4 py-2 text-xs font-semibold text-emerald-500">✓ Completado</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
