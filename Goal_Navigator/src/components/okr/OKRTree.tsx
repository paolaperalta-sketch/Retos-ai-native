import { useState } from "react";
import { CompanyOKR, PersonalKR } from "@/types/okr";
import { OKRCard } from "./OKRCard";
import { KRListRow } from "./KRListRow";
import { BiaTag } from "@/components/bia";
import { AlertTriangle, Building2, Rocket } from "lucide-react";
import { OKR_ICONS } from "@/lib/okr-icons";

interface OKRTreeProps {
  data: CompanyOKR[];
  /** If set, only show KRs for this user and highlight them */
  highlightUser?: string;
  /** Render extra actions on each KR card */
  renderKRActions?: (kr: PersonalKR) => React.ReactNode;
  /** Use compact KR cards */
  compactKRs?: boolean;
}

export function OKRTree({ data, highlightUser, renderKRActions, compactKRs = false }: OKRTreeProps) {
  return (
    <div className="space-y-4">
      {data.map(co => (
        <CompanyNode key={co.id} co={co} highlightUser={highlightUser} renderKRActions={renderKRActions} compactKRs={compactKRs} />
      ))}
    </div>
  );
}

function CompanyNode({ co, highlightUser, renderKRActions, compactKRs }: {
  co: CompanyOKR; highlightUser?: string; renderKRActions?: (kr: PersonalKR) => React.ReactNode; compactKRs: boolean;
}) {
  const hasRelevant = highlightUser
    ? co.areaOkrs.some(ao => ao.krs.some(kr => kr.owner === highlightUser))
    : co.areaOkrs.length > 0;

  const [open, setOpen] = useState(hasRelevant);
  const Icon = OKR_ICONS[co.name] || Rocket;

  return (
    <div className={hasRelevant ? "" : "opacity-60"}>
      <OKRCard
        name={co.name}
        progress={co.progress}
        icon={<Icon className="h-5 w-5" />}
        tags={co.areaOkrs.length > 0 ? [{ label: `${co.areaOkrs.length} área${co.areaOkrs.length !== 1 ? "s" : ""}` }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        level={0}
      >
        <div className="space-y-1">
          {co.areaOkrs.map(ao => (
            <AreaNode key={ao.id} ao={ao} highlightUser={highlightUser} renderKRActions={renderKRActions} compactKRs={compactKRs} />
          ))}
        </div>
      </OKRCard>
    </div>
  );
}

function AreaNode({ ao, highlightUser, renderKRActions, compactKRs }: {
  ao: CompanyOKR["areaOkrs"][0]; highlightUser?: string; renderKRActions?: (kr: PersonalKR) => React.ReactNode; compactKRs: boolean;
}) {
  const userKRs = highlightUser ? ao.krs.filter(kr => kr.owner === highlightUser) : ao.krs;
  const [open, setOpen] = useState(highlightUser ? userKRs.length > 0 : false);
  const weightSum = userKRs.reduce((s, kr) => s + kr.weight, 0);

  if (userKRs.length === 0 && highlightUser) return null;

  return (
    <div className="ml-4 border-l-2 border-primary/20 pl-4 animate-fade-in">
      <OKRCard
        name={ao.name}
        progress={ao.progress}
        icon={<Building2 className="h-4 w-4" />}
        tags={[{ label: ao.area, color: "info" }]}
        expanded={open}
        onToggle={() => setOpen(!open)}
        level={1}
      >
        <div className="space-y-3">
          {highlightUser && weightSum !== 100 && (
            <div className="flex items-center gap-2 text-xs text-warning-foreground bg-warning-bg rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              Los pesos suman {weightSum}% (deben sumar 100%)
            </div>
          )}
          <div className="rounded-xl border border-border bg-card px-5">
            {userKRs.map(kr => (
              <KRListRow key={kr.id} kr={kr} />
            ))}
          </div>
        </div>
      </OKRCard>
    </div>
  );
}
