import { useState } from "react";
import { Award, Download, Linkedin, PartyPopper } from "lucide-react";
import { LINKEDIN_SHARE_TEXT } from "@/lib/probation-utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface BiaLegendCelebrationProps {
  open: boolean;
  onClose: () => void;
  collaboratorName: string;
}

export function BiaLegendCelebration({ open, onClose, collaboratorName }: BiaLegendCelebrationProps) {
  const nameUpper = collaboratorName.toUpperCase();

  const handleDownloadCertificate = () => {
    // Generate certificate as canvas → download
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, "#1a0a3e");
    gradient.addColorStop(0.5, "#2d1b69");
    gradient.addColorStop(1, "#472bef");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative border
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1000, 1000);
    ctx.strokeRect(55, 55, 970, 970);

    // Top accent line
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(340, 120, 400, 3);

    // Certificate label
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "600 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "8px";
    ctx.fillText("CERTIFICADO DE EXCELENCIA", 540, 180);

    // BIA logo text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Inter, sans-serif";
    ctx.fillText("BIA", 540, 290);

    // Subtitle
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "300 18px Inter, sans-serif";
    ctx.fillText("ENERGY · PEOPLE SPACE", 540, 330);

    // Divider
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(340, 380, 400, 2);

    // Award icon area
    ctx.fillStyle = "rgba(167, 139, 250, 0.2)";
    ctx.beginPath();
    ctx.arc(540, 470, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a78bfa";
    ctx.font = "40px serif";
    ctx.fillText("★", 540, 485);

    // Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Inter, sans-serif";
    const nameParts = nameUpper.split(" ");
    if (nameParts.length > 3) {
      const mid = Math.ceil(nameParts.length / 2);
      ctx.fillText(nameParts.slice(0, mid).join(" "), 540, 580);
      ctx.fillText(nameParts.slice(mid).join(" "), 540, 625);
    } else {
      ctx.fillText(nameUpper, 540, 600);
    }

    // Legend title
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillText("BIA LEGEND", 540, 710);

    // Description
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "300 16px Inter, sans-serif";
    ctx.fillText("Ha superado exitosamente el periodo de prueba", 540, 770);
    ctx.fillText("demostrando compromiso y excelencia.", 540, 795);

    // Date
    const date = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "300 14px Inter, sans-serif";
    ctx.fillText(date, 540, 870);

    // Bottom accent
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(340, 930, 400, 3);

    // Download
    const link = document.createElement("a");
    link.download = `Certificado_BiaLegend_${nameUpper.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://bia.energy")}&summary=${LINKEDIN_SHARE_TEXT}`,
      "_blank"
    );
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <PartyPopper className="h-6 w-6 text-warning" />
            ¡Felicidades!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-6">
            <Award className="h-12 w-12 text-primary mx-auto mb-3" />
            <p className="text-lg font-bold text-foreground">
              ¡Ya eres oficialmente un Bia Legend!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {nameUpper} ha superado exitosamente el periodo de prueba.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownloadCertificate}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-none cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Descargar Certificado de Excelencia
            </button>
            <button
              onClick={handleShareLinkedIn}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-[#0a66c2] text-primary-foreground hover:bg-[#0a66c2]/90 transition-colors border-none cursor-pointer"
            >
              <Linkedin className="h-4 w-4" />
              Compartir en LinkedIn
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
