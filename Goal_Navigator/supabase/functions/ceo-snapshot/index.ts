// CEO Snapshot — endpoint REST público (token-protected) que devuelve
// avance de OKRs (compañía / área / KR) + proyectos AI (automatización)
// Uso: GET /ceo-snapshot?token=XXX  o  Authorization: Bearer XXX

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const CEO_TOKEN = Deno.env.get("CEO_SNAPSHOT_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!CEO_TOKEN) return json({ error: "CEO_SNAPSHOT_TOKEN no configurado" }, 500);
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Backend no configurado" }, 500);

    // Token via query (?token=) o Authorization: Bearer
    const url = new URL(req.url);
    const queryToken = url.searchParams.get("token");
    const authHeader = req.headers.get("authorization") ?? "";
    const bearer = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;
    const provided = queryToken ?? bearer;
    if (!provided || provided !== CEO_TOKEN) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // -------- Carga paralela --------
    const [
      pillarsRes,
      companyOkrsRes,
      krsRes,
      profilesRes,
      periodRes,
      tasksRes,
      checkinsRes,
    ] = await Promise.all([
      supabase.from("okr_pillars").select("id,name,sort_order").order("sort_order"),
      supabase.from("company_okrs").select("id,name,area,pillar_id,activo").eq("activo", true),
      supabase
        .from("key_results")
        .select(
          "id,name,company_okr_id,user_id,assigned_email,assigned_full_name,weight,target,baseline,current_value,status,closing_month,kr_type"
        ),
      supabase.from("profiles").select("user_id,email,full_name,area,subarea,cargo"),
      supabase.from("okr_periods").select("*").eq("activo", true).maybeSingle(),
      supabase.from("operational_tasks").select("*"),
      supabase
        .from("monthly_checkins")
        .select("kr_id,month,progress_percent,status_rating,flow_status,leader_adjusted_percent"),
    ]);

    const errs = [pillarsRes, companyOkrsRes, krsRes, profilesRes, tasksRes, checkinsRes]
      .filter((r) => r.error)
      .map((r) => r.error?.message);
    if (errs.length) return json({ error: "DB error", details: errs }, 500);

    const pillars = pillarsRes.data ?? [];
    const companyOkrs = companyOkrsRes.data ?? [];
    const krs = krsRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const period = periodRes.data;
    const tasks = (tasksRes.data ?? []) as any[];
    const checkins = checkinsRes.data ?? [];

    // -------- Helpers --------
    const profileByUser = new Map(profiles.map((p) => [p.user_id, p]));
    const profileByEmail = new Map(profiles.map((p) => [p.email?.toLowerCase(), p]));

    const krProgress = (kr: any): number => {
      const t = Number(kr.target ?? 0);
      const b = Number(kr.baseline ?? 0);
      const c = Number(kr.current_value ?? 0);
      if (t === b) return c >= t ? 100 : 0;
      const pct = ((c - b) / (t - b)) * 100;
      return Math.max(0, Math.min(100, pct));
    };

    // -------- KRs enriquecidos --------
    const krsEnriched = krs.map((kr) => {
      const owner =
        (kr.user_id && profileByUser.get(kr.user_id)) ||
        (kr.assigned_email && profileByEmail.get(kr.assigned_email.toLowerCase())) ||
        null;
      return {
        id: kr.id,
        name: kr.name,
        company_okr_id: kr.company_okr_id,
        owner_email: owner?.email ?? kr.assigned_email ?? null,
        owner_name: owner?.full_name ?? kr.assigned_full_name ?? null,
        area: owner?.area ?? null,
        weight: Number(kr.weight ?? 0),
        baseline: Number(kr.baseline ?? 0),
        target: Number(kr.target ?? 0),
        current_value: Number(kr.current_value ?? 0),
        progress_pct: Math.round(krProgress(kr) * 10) / 10,
        status: kr.status ?? "on_track",
        closing_month: kr.closing_month,
        kr_type: kr.kr_type,
      };
    });

    // -------- Avance OKR compañía --------
    const okrSummaries = companyOkrs.map((okr) => {
      const okrKrs = krsEnriched.filter((k) => k.company_okr_id === okr.id);
      const totalWeight = okrKrs.reduce((a, k) => a + (k.weight || 0), 0);
      const weighted =
        totalWeight > 0
          ? okrKrs.reduce((a, k) => a + k.progress_pct * (k.weight || 0), 0) / totalWeight
          : okrKrs.length
            ? okrKrs.reduce((a, k) => a + k.progress_pct, 0) / okrKrs.length
            : 0;
      const pillar = pillars.find((p) => p.id === okr.pillar_id);
      return {
        id: okr.id,
        name: okr.name,
        area: okr.area,
        pillar: pillar?.name ?? null,
        kr_count: okrKrs.length,
        progress_pct: Math.round(weighted * 10) / 10,
        krs: okrKrs,
      };
    });

    const globalOkrPct =
      okrSummaries.length > 0
        ? Math.round(
            (okrSummaries.reduce((a, o) => a + o.progress_pct, 0) / okrSummaries.length) * 10
          ) / 10
        : 0;

    // Por pilar
    const byPillar = pillars.map((p) => {
      const items = okrSummaries.filter((o) => o.pillar === p.name);
      const pct = items.length
        ? items.reduce((a, o) => a + o.progress_pct, 0) / items.length
        : 0;
      return {
        pillar: p.name,
        okr_count: items.length,
        progress_pct: Math.round(pct * 10) / 10,
      };
    });

    // Por área (basado en KRs)
    const areaMap = new Map<string, { total: number; count: number; krs: number }>();
    krsEnriched.forEach((k) => {
      const area = k.area ?? "SIN_AREA";
      const cur = areaMap.get(area) ?? { total: 0, count: 0, krs: 0 };
      cur.total += k.progress_pct;
      cur.count += 1;
      cur.krs += 1;
      areaMap.set(area, cur);
    });
    const byArea = [...areaMap.entries()].map(([area, v]) => ({
      area,
      kr_count: v.krs,
      progress_pct: Math.round((v.total / Math.max(1, v.count)) * 10) / 10,
    }));

    // -------- Proyectos AI (operational_tasks) --------
    const FREQ_MULT: Record<string, number> = {
      Diaria: 22,
      Semanal: 4,
      Quincenal: 2,
      Mensual: 1,
      Eventual: 0.5,
    };
    const taskHasEvidence = (t: any) =>
      ((t.evidencia_url && t.evidencia_url.trim()) ||
        (t.herramienta_usada && t.herramienta_usada.trim())) &&
      typeof t.horas_ahorradas_semana === "number";

    const automatizadas = tasks.filter((t) => t.estado === "automatizada");
    const automatizadasValidas = automatizadas.filter(taskHasEvidence);
    const horasAhorradasMes =
      automatizadasValidas.reduce((acc, t) => {
        const mult = FREQ_MULT[t.frecuencia] ?? 0.5;
        return acc + (t.tiempo_minutos || 0) * mult;
      }, 0) / 60;
    const horasSemanaReportadas = automatizadasValidas.reduce(
      (a, t) => a + (Number(t.horas_ahorradas_semana) || 0),
      0
    );

    // AI por persona
    const aiByPersonMap = new Map<string, any>();
    tasks.forEach((t) => {
      const email = (t.assigned_email ?? "").toLowerCase();
      if (!email) return;
      const cur = aiByPersonMap.get(email) ?? {
        email,
        full_name: profileByEmail.get(email)?.full_name ?? null,
        area: profileByEmail.get(email)?.area ?? null,
        total: 0,
        automatizadas: 0,
        validas: 0,
        horas_ahorradas_semana: 0,
      };
      cur.total += 1;
      if (t.estado === "automatizada") cur.automatizadas += 1;
      if (taskHasEvidence(t)) {
        cur.validas += 1;
        cur.horas_ahorradas_semana += Number(t.horas_ahorradas_semana) || 0;
      }
      aiByPersonMap.set(email, cur);
    });
    const aiByPerson = [...aiByPersonMap.values()]
      .map((p) => ({
        ...p,
        pct_automatizacion:
          p.total > 0 ? Math.round((p.validas / p.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.pct_automatizacion - a.pct_automatizacion);

    // AI por área
    const aiAreaMap = new Map<string, any>();
    aiByPerson.forEach((p) => {
      const area = p.area ?? "SIN_AREA";
      const cur = aiAreaMap.get(area) ?? {
        area,
        personas: 0,
        total_tareas: 0,
        automatizadas_validas: 0,
        horas_ahorradas_semana: 0,
      };
      cur.personas += 1;
      cur.total_tareas += p.total;
      cur.automatizadas_validas += p.validas;
      cur.horas_ahorradas_semana += p.horas_ahorradas_semana;
      aiAreaMap.set(area, cur);
    });
    const aiByArea = [...aiAreaMap.values()].map((a) => ({
      ...a,
      pct_automatizacion:
        a.total_tareas > 0
          ? Math.round((a.automatizadas_validas / a.total_tareas) * 1000) / 10
          : 0,
    }));

    // -------- Check-ins último mes --------
    const lastMonth = checkins.length
      ? checkins.map((c) => c.month).sort().reverse()[0]
      : null;
    const lastMonthCheckins = checkins.filter((c) => c.month === lastMonth);
    const checkinsCompletados = lastMonthCheckins.filter(
      (c) => c.flow_status === "approved" || c.flow_status === "submitted"
    ).length;

    // -------- Respuesta --------
    return json({
      generated_at: new Date().toISOString(),
      period: period
        ? {
            id: period.id,
            nombre: period.nombre,
            fecha_inicio: period.fecha_inicio,
            fecha_fin: period.fecha_fin,
            meta_porcentaje: period.meta_porcentaje,
          }
        : null,
      okrs: {
        global_progress_pct: globalOkrPct,
        total_okrs: okrSummaries.length,
        total_krs: krsEnriched.length,
        by_pillar: byPillar,
        by_area: byArea.sort((a, b) => b.progress_pct - a.progress_pct),
        details: okrSummaries.sort((a, b) => b.progress_pct - a.progress_pct),
      },
      ai_projects: {
        total_tareas: tasks.length,
        total_automatizadas: automatizadas.length,
        automatizadas_con_evidencia: automatizadasValidas.length,
        pct_global:
          tasks.length > 0
            ? Math.round((automatizadasValidas.length / tasks.length) * 1000) / 10
            : 0,
        horas_ahorradas_mes: Math.round(horasAhorradasMes * 10) / 10,
        horas_ahorradas_semana_reportadas: Math.round(horasSemanaReportadas * 10) / 10,
        by_area: aiByArea.sort((a, b) => b.pct_automatizacion - a.pct_automatizacion),
        by_person: aiByPerson,
      },
      monthly_checkins: {
        last_month: lastMonth,
        total: lastMonthCheckins.length,
        completados: checkinsCompletados,
      },
    });
  } catch (e) {
    console.error("ceo-snapshot error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
