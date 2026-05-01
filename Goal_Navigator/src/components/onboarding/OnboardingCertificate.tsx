import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { Download, Award, Zap } from "lucide-react";

interface Props {
  name: string;
  finalScore: number;
  quiz1Best: number;
  quiz1Attempts: number;
  quiz2Best: number;
  quiz2Attempts: number;
}

function getScoreStyle(score: number) {
  if (score >= 90) return { color: "#FFD700", label: "¡Sobresaliente! ⭐" };
  if (score >= 80) return { color: "hsl(var(--primary))", label: "¡Muy bien! ✓" };
  return { color: "#FFFFFF", label: "Aprobado ✓" };
}

const BADGES = [
  { label: "ADAPT-\nA-BILITY", bg: "linear-gradient(135deg, #F5A623, #E8890A)", border: "#8B4513" },
  { label: "A⚡ TEAM\nPLAYER", bg: "linear-gradient(135deg, #E91E8C, #C2185B)", border: "#880E4F" },
  { label: "USER\nCENTRIC", bg: "#0D0B2E", border: "#7B5EE8", round: true },
  { label: "SELF ⚡\nMANAGEMENT", bg: "linear-gradient(135deg, #00BCD4, #0097A7)", border: "#006064" },
  { label: "PROBLEM\nSOLVER", bg: "linear-gradient(135deg, #8BC34A, #689F38)", border: "#33691E" },
];

export function OnboardingCertificate({ name, finalScore, quiz1Best, quiz1Attempts, quiz2Best, quiz2Attempts }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const scoreStyle = getScoreStyle(finalScore);

  const handleDownload = useCallback(async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      width: 1010,
      height: 780,
      windowWidth: 1010,
      windowHeight: 780,
    });
    const link = document.createElement("a");
    link.download = `Certificado_Bia_${name.replace(/ /g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [name]);

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <div className="max-w-md mx-auto rounded-xl border border-primary/20 bg-card p-6 space-y-4 text-center">
        <h2 className="text-lg font-bold text-foreground">🎯 Resumen de tu proceso</h2>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">Evaluación #1: <span className="text-foreground font-semibold">{quiz1Best}%</span> (mejor de {quiz1Attempts} intentos)</p>
          <p className="text-muted-foreground">Evaluación #2: <span className="text-foreground font-semibold">{quiz2Best}%</span> (mejor de {quiz2Attempts} intentos)</p>
          <hr className="border-border/50 my-2" />
          <p className="text-foreground font-bold text-lg">Puntaje final: <span style={{ color: scoreStyle.color }}>{finalScore}%</span></p>
          <p className="text-sm font-medium" style={{ color: scoreStyle.color }}>{scoreStyle.label}</p>
        </div>
      </div>

      {/* Certificate (fixed size, scrollable wrapper) */}
      <div className="overflow-x-auto pb-4">
        <div className="mx-auto" style={{ width: 1010 }}>
          <div
            ref={certRef}
            style={{
              width: 1010, height: 780, position: "relative", overflow: "hidden",
              background: "radial-gradient(ellipse at center top, #2d1b69 0%, #1a0a2e 40%, #0a0a1a 100%)",
              fontFamily: "'Montserrat', 'Inter', sans-serif",
            }}
          >
            {/* Stars */}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                width: 2, height: 2, borderRadius: "50%", background: "#fff",
                opacity: 0.4 + Math.random() * 0.4,
                left: (i * 29) % 980 + 15, top: (i * 23 + i * i * 7) % 750 + 15,
              }} />
            ))}

            {/* Medal */}
            <div style={{ position: "absolute", top: 40, left: 40 }}>
              <Award style={{ width: 60, height: 60, color: "#08DDBC" }} />
            </div>

            {/* Logo */}
            <div style={{ position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8 }}>
              <Zap style={{ width: 36, height: 36, color: "#08DDBC" }} />
              <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>Bia</span>
            </div>

            {/* Otorga a */}
            <div style={{ position: "absolute", top: 200, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 300, color: "#fff" }}>Otorga a:</p>
            </div>

            {/* Name pill */}
            <div style={{ position: "absolute", top: 235, left: "50%", transform: "translateX(-50%)" }}>
              <div style={{
                background: "#7B5EE8", borderRadius: 50, padding: "12px 40px", minWidth: 280, textAlign: "center"
              }}>
                <span style={{ fontSize: 20, fontWeight: 500, color: "#fff" }}>{name}</span>
              </div>
            </div>

            {/* El certificado */}
            <div style={{ position: "absolute", top: 295, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
              <p style={{ fontSize: 56, fontWeight: 700, color: "#fff", textShadow: "0 0 40px rgba(8,221,188,0.3)" }}>El certificado</p>
            </div>

            {/* Description */}
            <div style={{ position: "absolute", top: 380, left: "50%", transform: "translateX(-50%)", textAlign: "center", maxWidth: 520 }}>
              <p style={{ fontSize: 15, fontWeight: 400, color: "#fff", lineHeight: 1.6 }}>
                por completar el proceso de inmersión. Has dominado las reglas del juego, las tarifas y la arquitectura de datos de nuestro sector.
              </p>
            </div>

            {/* Score */}
            <div style={{ position: "absolute", top: 455, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: scoreStyle.color }}>
                Puntaje del proceso: {finalScore}%
              </p>
            </div>

            {/* Badges */}
            <div style={{ position: "absolute", top: 510, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 12 }}>
              {BADGES.map((b, i) => (
                <div key={i} style={{
                  width: b.round ? 65 : 155, height: 65,
                  borderRadius: b.round ? "50%" : 12,
                  background: b.bg, border: `3px solid ${b.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 6,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: "#fff", textAlign: "center", textTransform: "uppercase", whiteSpace: "pre-line", lineHeight: 1.3 }}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.8)" }}>
                Bienvenido: ya eres parte de la compañía que impulsa la inteligencia energética en Colombia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" /> Descargar Certificado
        </button>
      </div>
    </div>
  );
}
