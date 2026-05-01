import { useState, useRef, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarMap } from "@/data/avatarMap";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Home, ChevronDown, Target, AlertCircle, Network } from "lucide-react";
import { sentenceCaseTitle } from "@/lib/text-utils";
import { calcWeightedProgress } from "@/lib/okr-utils";
import { countReports, type TeamNode } from "@/data/teamHierarchy";
import type { PersonalKR } from "@/types/okr";
import { cn } from "@/lib/utils";

interface OrgChartTreeProps {
  root: TeamNode;
  allKRs: PersonalKR[];
  pendingApprovals: Record<string, number>;
  onDrillLeader?: (name: string) => void;
}

// Layout constants
const NODE_W = 180;
const NODE_H = 72;
const H_GAP = 24;       // horizontal gap between sibling nodes
const V_GAP = 90;       // vertical gap between levels

interface PositionedNode {
  node: TeamNode;
  x: number;       // center x
  y: number;       // top y
  width: number;   // subtree width
  parent?: PositionedNode;
}

/**
 * Compute layout for a node + its visible (expanded) children.
 * Returns subtree width and positions of all visible nodes.
 */
function layoutTree(
  node: TeamNode,
  expanded: Set<string>,
  level = 0,
  startX = 0,
): { width: number; nodes: PositionedNode[] } {
  const isExpanded = expanded.has(node.name);
  const children = isExpanded ? node.directReports || [] : [];

  if (children.length === 0) {
    const positioned: PositionedNode = {
      node,
      x: startX + NODE_W / 2,
      y: level * (NODE_H + V_GAP),
      width: NODE_W,
    };
    return { width: NODE_W, nodes: [positioned] };
  }

  const childResults = [];
  let cursor = startX;
  for (const child of children) {
    const sub = layoutTree(child, expanded, level + 1, cursor);
    childResults.push(sub);
    cursor += sub.width + H_GAP;
  }
  const totalChildrenW = cursor - startX - H_GAP;
  const width = Math.max(NODE_W, totalChildrenW);
  // Center current node above its children
  const firstChildCenter = childResults[0].nodes[0].x;
  const lastChildCenter = childResults[childResults.length - 1].nodes[0].x;
  const centerX = (firstChildCenter + lastChildCenter) / 2;

  const positioned: PositionedNode = {
    node,
    x: centerX,
    y: level * (NODE_H + V_GAP),
    width,
  };

  // If subtree wider than this node alone, shift to center
  return {
    width,
    nodes: [positioned, ...childResults.flatMap((r) => r.nodes)],
  };
}

function buildPath(root: TeamNode, target: string): TeamNode[] {
  if (root.name === target) return [root];
  for (const child of root.directReports || []) {
    const p = buildPath(child, target);
    if (p.length) return [root, ...p];
  }
  return [];
}

export function OrgChartTree({ root, allKRs, pendingApprovals, onDrillLeader }: OrgChartTreeProps) {
  // Expanded leaders — start with root expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set([root.name]));
  const [selected, setSelected] = useState<TeamNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset when root changes
  useEffect(() => {
    setExpanded(new Set([root.name]));
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [root.name]);

  /**
   * Toggle expand/collapse. RULE: only one branch per level expanded at a time
   * (clean spider behavior). When opening a sibling, close other siblings.
   */
  const toggle = (node: TeamNode, parentChain: TeamNode[]) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(node.name)) {
        // Collapse — also collapse descendants
        const collapseDeep = (n: TeamNode) => {
          next.delete(n.name);
          (n.directReports || []).forEach(collapseDeep);
        };
        collapseDeep(node);
      } else {
        // Close sibling branches at the same level
        const parent = parentChain[parentChain.length - 1];
        if (parent) {
          (parent.directReports || []).forEach((sib) => {
            if (sib.name !== node.name) {
              const collapseDeep = (n: TeamNode) => {
                next.delete(n.name);
                (n.directReports || []).forEach(collapseDeep);
              };
              collapseDeep(sib);
            }
          });
        }
        next.add(node.name);
      }
      return next;
    });
  };

  const layout = useMemo(() => {
    const result = layoutTree(root, expanded, 0, 0);
    return result;
  }, [root, expanded]);

  // Build edges (parent → visible children)
  const edges = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    layout.nodes.forEach((n) => map.set(n.node.name, n));
    const list: { from: PositionedNode; to: PositionedNode }[] = [];
    layout.nodes.forEach((p) => {
      if (!expanded.has(p.node.name)) return;
      (p.node.directReports || []).forEach((child) => {
        const c = map.get(child.name);
        if (c) list.push({ from: p, to: c });
      });
    });
    return list;
  }, [layout, expanded]);

  const canvasW = layout.width + 100;
  const canvasH = layout.nodes.reduce((m, n) => Math.max(m, n.y + NODE_H), 0) + 40;

  // Pan handlers
  const onMouseDown = (e: React.MouseEvent) => {
    // Only start drag on canvas background
    if ((e.target as HTMLElement).closest("[data-org-node]")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      setPan({
        x: dragStart.current.panX + (e.clientX - dragStart.current.x),
        y: dragStart.current.panY + (e.clientY - dragStart.current.y),
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setExpanded(new Set([root.name]));
  };

  // Selected person KR data
  const selectedProgress = selected
    ? Math.round(calcWeightedProgress(allKRs.filter((kr) => kr.owner === selected.name)))
    : 0;
  const selectedKRsCount = selected
    ? allKRs.filter((kr) => kr.owner === selected.name).length
    : 0;
  const selectedPath = selected ? buildPath(root, selected.name) : [];

  return (
    <div className="relative w-full">
      {/* Breadcrumb top-left */}
      <div className="flex items-center justify-between mb-3 px-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={resetView}
                className="cursor-pointer hover:text-foreground inline-flex items-center gap-1"
              >
                <Home className="h-3.5 w-3.5" />
                {sentenceCaseTitle(root.name.split(" ")[0])}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {selectedPath.slice(1).map((p, i) => (
              <span key={p.name} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {i === selectedPath.length - 2 ? (
                    <BreadcrumbPage>{sentenceCaseTitle(p.name.split(" ").slice(0, 2).join(" "))}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => setSelected(p)}
                    >
                      {sentenceCaseTitle(p.name.split(" ").slice(0, 2).join(" "))}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-muted/20 to-background",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{ height: "min(70vh, 640px)" }}
        onMouseDown={onMouseDown}
      >
        <div
          className="absolute top-0 left-1/2 origin-top transition-transform duration-200"
          style={{
            transform: `translate(calc(-50% + ${pan.x}px), ${pan.y + 20}px) scale(${zoom})`,
          }}
        >
          <div
            className="relative"
            style={{ width: canvasW, height: canvasH }}
          >
            {/* SVG curves layer */}
            <svg
              width={canvasW}
              height={canvasH}
              className="absolute inset-0 pointer-events-none"
              style={{ overflow: "visible" }}
            >
              {edges.map(({ from, to }, i) => {
                const x1 = from.x;
                const y1 = from.y + NODE_H;
                const x2 = to.x;
                const y2 = to.y;
                const midY = (y1 + y2) / 2;
                const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth={1.5}
                    className="animate-fade-in"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {layout.nodes.map((p) => {
              const isExpanded = expanded.has(p.node.name);
              const hasChildren = (p.node.directReports?.length || 0) > 0;
              const isSelected = selected?.name === p.node.name;
              const progress = Math.round(
                calcWeightedProgress(allKRs.filter((kr) => kr.owner === p.node.name)),
              );
              const pending = pendingApprovals[p.node.name] || 0;
              const teamSize = countReports(p.node);
              const parentChain = buildPath(root, p.node.name).slice(0, -1);

              const isCritical = progress > 0 && progress < 50;

              return (
                <div
                  key={p.node.name}
                  data-org-node
                  className={cn(
                    "absolute group rounded-xl border bg-card transition-all duration-200 cursor-pointer animate-fade-in",
                    "hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border/60",
                  )}
                  style={{
                    left: p.x - NODE_W / 2,
                    top: p.y,
                    width: NODE_W,
                    height: NODE_H,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(p.node);
                  }}
                >
                  <div className="flex items-center gap-2.5 h-full px-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={avatarMap[p.node.name]}
                        alt={p.node.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {p.node.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] text-foreground truncate"
                        style={{ fontWeight: 500 }}
                      >
                        {sentenceCaseTitle(
                          p.node.name.split(" ").slice(0, 2).join(" "),
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {sentenceCaseTitle(p.node.role)}
                      </p>
                    </div>
                  </div>

                  {/* Critical / pending badge — only when relevant */}
                  {(isCritical || pending > 0) && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-1.5 flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                        isCritical
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700",
                      )}
                      style={{ opacity: isCritical || pending > 0 ? 1 : undefined }}
                    >
                      <AlertCircle className="h-2.5 w-2.5" />
                      {isCritical ? `${progress}%` : pending}
                    </span>
                  )}

                  {/* Expand chevron */}
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(p.node, parentChain);
                      }}
                      className={cn(
                        "absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full border bg-card flex items-center justify-center shadow-sm transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary cursor-pointer",
                        isExpanded ? "border-primary text-primary" : "border-border text-muted-foreground",
                      )}
                      title={`${teamSize} ${teamSize === 1 ? "persona" : "personas"}`}
                    >
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isExpanded ? "rotate-180" : "rotate-0",
                        )}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 bg-card border border-border rounded-lg shadow-sm p-1">
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
            title="Acercar"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
            title="Alejar"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={resetView}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
            title="Volver al inicio"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Person drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-center gap-4 mb-2">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarMap[selected.name]} alt={selected.name} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                      {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-base">{sentenceCaseTitle(selected.name)}</SheetTitle>
                    <SheetDescription className="text-xs mt-0.5">
                      {sentenceCaseTitle(selected.role)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Área</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{selected.area}</p>
                    <p className="text-[11px] text-muted-foreground">{selected.subarea}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Progreso OKRs</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedProgress}%</p>
                    <p className="text-[11px] text-muted-foreground">{selectedKRsCount} KRs</p>
                  </div>
                </div>

                {(selected.directReports?.length || 0) > 0 && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Equipo</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {countReports(selected)} {countReports(selected) === 1 ? "persona" : "personas"} a cargo
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Button className="w-full" onClick={() => { /* Hook to OKRs view */ }}>
                    <Target className="h-4 w-4 mr-2" />
                    Ver objetivos
                  </Button>
                  {(selected.directReports?.length || 0) > 0 && onDrillLeader && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        onDrillLeader(selected.name);
                        setSelected(null);
                      }}
                    >
                      <Network className="h-4 w-4 mr-2" />
                      Navegar a su equipo
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
