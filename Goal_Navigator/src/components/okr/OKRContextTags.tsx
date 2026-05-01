import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sentenceCaseTitle } from "@/lib/text-utils";

interface OKRContextTagsProps {
  companyOkrText?: string | null;
  areaOkrText?: string | null;
  /** When true, tags wrap to next row on tight widths (default true). */
  className?: string;
}

/**
 * Compact, responsive OKR context tags.
 * Each tag shows only the label ("OKR área" / "OKR compañía") and reveals the
 * full OKR text inside a tooltip on hover/focus/tap. Never overflows the card.
 */
export function OKRContextTags({ companyOkrText, areaOkrText, className = "" }: OKRContextTagsProps) {
  const hasArea = !!(areaOkrText && areaOkrText.trim());
  const hasCompany = !!(companyOkrText && companyOkrText.trim());
  if (!hasArea && !hasCompany) return null;

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 max-w-full ${className}`}>
      {hasArea && (
        <OKRTag label="OKR área" tone="soft" fullText={sentenceCaseTitle(areaOkrText!)} />
      )}
      {hasCompany && (
        <OKRTag label="OKR compañía" tone="solid" fullText={sentenceCaseTitle(companyOkrText!)} />
      )}
    </div>
  );
}

function OKRTag({ label, tone, fullText }: { label: string; tone: "soft" | "solid"; fullText: string }) {
  const cls =
    tone === "solid"
      ? "bg-primary/15 text-primary border border-primary/20"
      : "bg-primary/5 text-primary/80 border border-primary/15";
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1 max-w-full whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium leading-none cursor-help ${cls}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        sideOffset={6}
        className="max-w-[320px] text-xs leading-relaxed whitespace-pre-wrap break-words"
      >
        {fullText}
      </TooltipContent>
    </Tooltip>
  );
}
