import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for the collaborator/leader OKR pages.
 * Mimics 3-4 collapsed OKR cards while data loads.
 */
export function OKRSkeleton() {
  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default OKRSkeleton;
