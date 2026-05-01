import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Dimension, ReviewItem, WeightRow } from "@/lib/review-utils";

export function useReviewCatalog() {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [weights, setWeights] = useState<WeightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [d, i, w] = await Promise.all([
          supabase.from("review_dimensions").select("*").order("sort_order"),
          supabase.from("review_items").select("*").order("sort_order"),
          supabase.from("review_weights").select("*"),
        ]);
        if (!active) return;
        if (d.error) throw d.error;
        if (i.error) throw i.error;
        if (w.error) throw w.error;
        setDimensions(d.data as Dimension[]);
        setItems(i.data as ReviewItem[]);
        setWeights(w.data as WeightRow[]);
      } catch (e: any) {
        if (active) setError(e.message ?? "Error cargando catálogo");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { dimensions, items, weights, loading, error };
}
