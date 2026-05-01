import { useMemo } from "react";
import { OKR_ICONS } from "@/lib/okr-icons";
import { progressToStatus } from "@/lib/okr-utils";
import { Rocket } from "lucide-react";
import type { CompanyOKR } from "@/types/okr";

interface FlywheelMapProps {
  okrs: CompanyOKR[];
  onSelectOKR: (id: string) => void;
}

const STATUS_COLORS: Record<string, { line: string; glow: string }> = {
  on_track: { line: "stroke-[#7C3AED]", glow: "drop-shadow(0 0 4px rgba(124,58,237,0.5))" },
  at_risk: { line: "stroke-warning", glow: "drop-shadow(0 0 4px rgba(234,179,8,0.4))" },
  off_track: { line: "stroke-danger", glow: "drop-shadow(0 0 4px rgba(239,68,68,0.4))" },
};

const STATUS_LINE_HEX: Record<string, string> = {
  on_track: "#7C3AED",
  at_risk: "#EAB308",
  off_track: "#EF4444",
};

export function FlywheelMap({ okrs, onSelectOKR }: FlywheelMapProps) {
  const centerOKR = okrs.find(o => o.name === "AI NATIVE");
  const orbitalOKRs = okrs.filter(o => o.name !== "AI NATIVE");

  const cx = 280;
  const cy = 240;
  const radius = 170;

  const orbitalPositions = useMemo(() => {
    return orbitalOKRs.map((okr, i) => {
      const angle = (2 * Math.PI * i) / orbitalOKRs.length - Math.PI / 2;
      return {
        okr,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }, [orbitalOKRs]);

  const CenterIcon = centerOKR ? (OKR_ICONS[centerOKR.name] || Rocket) : Rocket;
  const centerStatus = centerOKR ? progressToStatus(centerOKR.progress) : "off_track";

  return (
    <div className="w-full flex justify-center">
      <div className="relative" style={{ width: 560, height: 480 }}>
        <svg width="560" height="480" className="absolute inset-0">
          {/* Connection lines */}
          {orbitalPositions.map(({ okr, x, y }) => {
            const status = progressToStatus(okr.progress);
            const color = STATUS_LINE_HEX[status];
            const strokeW = status === "on_track" ? 2.5 : 1;
            return (
              <line
                key={okr.id}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke={color}
                strokeWidth={strokeW}
                strokeOpacity={status === "off_track" ? 0.5 : 0.7}
                strokeDasharray={status === "off_track" ? "4 4" : "none"}
              />
            );
          })}
        </svg>

        {/* Center node */}
        {centerOKR && (
          <button
            onClick={() => onSelectOKR(centerOKR.id)}
            className="absolute flex flex-col items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50 transition-all cursor-pointer border-none hover:scale-105"
            style={{
              width: 100,
              height: 100,
              left: cx - 50,
              top: cy - 50,
            }}
          >
            <CenterIcon className="h-7 w-7 mb-1" />
            <span className="text-[9px] font-bold leading-tight text-center px-1">AI NATIVE</span>
            <span className="text-[8px] font-medium opacity-80 mt-0.5">{centerOKR.progress}%</span>
          </button>
        )}

        {/* Orbital nodes */}
        {orbitalPositions.map(({ okr, x, y }) => {
          const status = progressToStatus(okr.progress);
          const Icon = OKR_ICONS[okr.name] || Rocket;
          const isOnTrack = status === "on_track";
          const isOffTrack = status === "off_track";

          const dotColor = isOnTrack
            ? "bg-success"
            : isOffTrack
            ? "bg-danger"
            : "bg-warning";

          return (
            <button
              key={okr.id}
              onClick={() => onSelectOKR(okr.id)}
              className="absolute flex flex-col items-center justify-center rounded-2xl bg-card border border-border hover:border-[#7C3AED]/50 transition-all cursor-pointer hover:shadow-md hover:scale-105 group"
              style={{
                width: 110,
                height: 72,
                left: x - 55,
                top: y - 36,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#7C3AED] transition-colors" />
                <span className={`h-2 w-2 rounded-full ${dotColor} shrink-0`} />
              </div>
              <span className="text-[9px] font-semibold text-foreground leading-tight text-center px-2 line-clamp-2">
                {okr.name}
              </span>
              <span className="text-[8px] text-muted-foreground mt-0.5 font-medium">{okr.progress}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
