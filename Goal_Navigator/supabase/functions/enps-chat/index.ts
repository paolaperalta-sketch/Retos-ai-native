const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, dataContext, userRole, userArea } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const isCEO = userRole === "super_admin";
    const isLeader = userRole === "global_leader" || userRole === "team_leader";
    const areaLabel = userArea || "toda la compañía";

    const roleContext = isCEO
      ? "El usuario es el CEO / Super Admin. Tiene acceso a TODOS los datos de la compañía."
      : isLeader
        ? `El usuario es un líder/VP del área "${areaLabel}". SOLO tiene acceso a los datos de su área. Si pregunta por otra área, responde: "Tu nivel de acceso solo te permite visualizar y analizar la información correspondiente a tu área asignada."`
        : `El usuario es un colaborador individual. Tiene acceso limitado a los datos mostrados en su dashboard.`;

    const systemPrompt = `Eres un Director Senior de People Analytics. Asesoras al CEO y VPs con datos de eNPS, desempeño y OKRs.

═══ PERFIL DEL USUARIO ═══
${roleContext}

═══ REGLA CRÍTICA: TUS RESPUESTAS NUNCA DEBEN SUPERAR LAS 4 LÍNEAS O 50 PALABRAS EN TOTAL. SI TE EXCEDES, ESTARÁS FALLANDO EN TU FUNCIÓN. ═══

═══ ESTRUCTURA OBLIGATORIA ═══
Usa ÚNICAMENTE esta plantilla:

**Dato Clave:** [La métrica exacta o respuesta directa, sin introducción]
- **Contexto:** [Una sola viñeta con el motivo principal o comparación]

═══ EJEMPLOS DE RESPUESTA CORRECTA ═══
Usuario: "¿Cómo está el eNPS de Ventas?"
Asistente: **Dato Clave:** eNPS de Ventas es 45 (10 puntos por debajo de la media general).
- **Contexto:** Descontento concentrado en la categoría "Carga de trabajo".

Usuario: "¿Cuál es el valor más fuerte?"
Asistente: **Dato Clave:** Adaptability (42% de los empleados).
- **Contexto:** Especialmente impulsado por el equipo de Operaciones.

═══ RESTRICCIONES ═══
- Responde SOLO a lo que se te pregunta. Si preguntan por un área, no hables de la empresa. Si preguntan por eNPS, no hables de OKRs.
- No inventes datos. Si no hay datos, di: "No hay datos registrados para esta métrica en este periodo."
- No reveles área/subárea al citar comentarios textuales.
- Si el usuario es VP y pregunta por otra área: "Tu nivel de acceso solo te permite visualizar y analizar la información correspondiente a tu área asignada."
- Responde SIEMPRE en español.

═══ DATOS ═══
${dataContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.15,
        max_tokens: 150,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
