// Public OKR API — exposes pillars, area OKRs, individual OKRs and key results.
// No auth required (verify_jwt = false). Read-only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const pillarFilter = url.searchParams.get("pillar"); // pillar name or id
    const areaFilter = url.searchParams.get("area");     // area name (e.g. SALES)
    const userEmail = url.searchParams.get("user_email");
    const includeKRs = url.searchParams.get("include_krs") !== "false";

    // 1. Pillars
    let pillarsQ = supabase
      .from("okr_pillars")
      .select("id, name, description, sort_order")
      .order("sort_order", { ascending: true });
    const { data: pillars, error: pErr } = await pillarsQ;
    if (pErr) throw pErr;

    let filteredPillars = pillars ?? [];
    if (pillarFilter) {
      filteredPillars = filteredPillars.filter(
        (p) => p.id === pillarFilter || p.name.toLowerCase() === pillarFilter.toLowerCase(),
      );
    }
    const pillarIds = filteredPillars.map((p) => p.id);

    // 2. Area OKRs
    let areasQ = supabase
      .from("okr_areas")
      .select("id, name, area, pillar_id, progress")
      .in("pillar_id", pillarIds.length ? pillarIds : ["00000000-0000-0000-0000-000000000000"]);
    if (areaFilter) areasQ = areasQ.eq("area", areaFilter);
    const { data: areaOkrs, error: aErr } = await areasQ;
    if (aErr) throw aErr;

    const areaIds = (areaOkrs ?? []).map((a) => a.id);

    // 3. Individual OKRs
    const { data: individualOkrs, error: iErr } = areaIds.length
      ? await supabase
          .from("okr_individual")
          .select("id, name, user_id, area_okr_id, period, status")
          .in("area_okr_id", areaIds)
      : { data: [], error: null };
    if (iErr) throw iErr;

    // 4. Key Results
    const okrIds = (individualOkrs ?? []).map((o) => o.id);
    const { data: krs, error: kErr } = includeKRs && okrIds.length
      ? await supabase
          .from("key_results")
          .select("id, name, okr_id, user_id, baseline, target, current_value, weight, status, rating")
          .in("okr_id", okrIds)
      : { data: [], error: null };
    if (kErr) throw kErr;

    // 5. Profiles (for owner names)
    const userIds = Array.from(
      new Set([...(individualOkrs ?? []).map((o) => o.user_id), ...(krs ?? []).map((k) => k.user_id)]),
    );
    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, full_name, email, area, subarea, cargo")
          .in("user_id", userIds)
      : { data: [] };
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    // Optional user_email filter (post-query since profiles join is in-memory)
    let allowedUserIds: Set<string> | null = null;
    if (userEmail) {
      allowedUserIds = new Set(
        (profiles ?? [])
          .filter((p) => p.email?.toLowerCase() === userEmail.toLowerCase())
          .map((p) => p.user_id),
      );
    }

    // 6. Assemble nested structure
    const result = filteredPillars.map((pillar) => {
      const pAreas = (areaOkrs ?? [])
        .filter((a) => a.pillar_id === pillar.id)
        .map((area) => {
          const aOkrs = (individualOkrs ?? [])
            .filter((o) => o.area_okr_id === area.id)
            .filter((o) => !allowedUserIds || allowedUserIds.has(o.user_id))
            .map((okr) => {
              const owner = profileMap.get(okr.user_id);
              const oKRs = includeKRs
                ? (krs ?? [])
                    .filter((k) => k.okr_id === okr.id)
                    .map((k) => ({
                      id: k.id,
                      name: k.name,
                      baseline: k.baseline,
                      target: k.target,
                      current_value: k.current_value,
                      weight: k.weight,
                      status: k.status,
                      rating: k.rating,
                    }))
                : undefined;
              return {
                id: okr.id,
                name: okr.name,
                period: okr.period,
                status: okr.status,
                owner: owner
                  ? { full_name: owner.full_name, email: owner.email, cargo: owner.cargo, area: owner.area, subarea: owner.subarea }
                  : null,
                key_results: oKRs,
              };
            });
          return {
            id: area.id,
            name: area.name,
            area: area.area,
            progress: area.progress,
            individual_okrs: aOkrs,
          };
        })
        .filter((a) => !allowedUserIds || a.individual_okrs.length > 0);
      return {
        id: pillar.id,
        name: pillar.name,
        description: pillar.description,
        area_okrs: pAreas,
      };
    });

    return json({
      generated_at: new Date().toISOString(),
      filters: { pillar: pillarFilter, area: areaFilter, user_email: userEmail, include_krs: includeKRs },
      pillars: result,
    });
  } catch (e) {
    console.error("okr-api error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
