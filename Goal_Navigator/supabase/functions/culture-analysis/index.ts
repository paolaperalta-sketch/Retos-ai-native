const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mejorasData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const systemPrompt = `Eres un Consultor Experto en Cultura Organizacional y People Analytics contratado por el CEO de Bia.

INSTRUCCIONES ESTRICTAS:
- Analiza la evolución de la experiencia del colaborador comparando los datos cualitativos del periodo más reciente frente al periodo inmediatamente anterior.
- Usa EXCLUSIVAMENTE las columnas Periodo, Mejoras_Categoria y Mejoras_Texto proporcionadas.
- Realiza un cruce de frecuencias y análisis semántico de los textos para identificar patrones de cambio.

FORMATO DE RESPUESTA (respeta esta estructura exacta, usa estas 3 secciones):

## ✅ Lo que hemos avanzado (Nuestras Victorias)

Identifica problemas que tuvieron alta mención en el periodo anterior pero que en el último periodo desaparecieron o disminuyeron significativamente.
- Analiza la caída en volumen de categorías específicas en Mejoras_Categoria.
- Menciona ejemplos concretos de lo que la gente pedía antes y que ya no pide ahora, citando frases reales de los comentarios antiguos.
- Formato: viñetas cortas, directas, con evidencia textual.

## ⚠️ Lo que aún nos duele (Focos de Atención)

Identifica problemas crónicos o que están empeorando:
- Quejas que se repiten sistemáticamente desde periodos pasados hasta el actual.
- Nuevos dolores que hayan surgido agresivamente en este último periodo y que antes no existían.
- Agrupa por Mejoras_Categoria principal y extrae la "raíz" del problema basándote en lo que la gente escribe.
- Formato: viñetas cortas con citas textuales reales.

## 💡 Recomendaciones Estratégicas

Como consultor experto, proporciona 3-5 recomendaciones accionables y concretas en bullet points simples:
- Solo indica QUÉ se debe hacer. NO incluyas quién es responsable ni por qué.
- Cada bullet debe ser una acción clara y directa, máximo una línea.
- Prioriza por impacto: empieza por lo que más duele.
- Sé específico, no genérico. Basa cada recomendación en evidencia de los comentarios.
- Recuerda que esto lo leerá el CEO y los VPs de área, mantén un tono ejecutivo.

REGLAS:
- Tono ejecutivo, directo, objetivo y orientado a la acción.
- Usa viñetas cortas.
- Evita lenguaje genérico; usa las palabras y contextos REALES de los colaboradores.
- NO inventes datos ni comentarios. Solo cita lo que está en los datos.
- NO menciones áreas ni subareas específicas para mantener anonimato.
- Responde SIEMPRE en español.
- Sé conciso: máximo 4-5 bullets por sección.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Aquí están los datos de Mejoras por periodo para tu análisis:\n\n${mejorasData}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
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
    console.error("culture-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
