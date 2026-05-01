import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IMAGE_MODELS = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyJson = await req.json();
    const { prompt, format: formatParam } = bodyJson;
    const formatKey = typeof formatParam === "string" && formatParam.trim()
      ? formatParam.trim()
      : "1:1";

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "O campo 'prompt' é obrigatório (descrição da imagem)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const FORMAT_MAP: Record<string, { hint: string; aspectRatio: string }> = {
      "1:1": {
        hint: "Proporção QUADRADA 1:1 (feed Instagram/Facebook). Componha em quadrado.",
        aspectRatio: "1:1",
      },
      "4:5": {
        hint:
          "Proporção VERTICAL 4:5 (feed Instagram — retrato clássico). Componha em retrato; sujeito principal na área central segura.",
        aspectRatio: "4:5",
      },
      "9:16": {
        hint: "Proporção VERTICAL 9:16 (Stories ou Reels). Componha em retrato.",
        aspectRatio: "9:16",
      },
      "16:9": {
        hint: "Proporção HORIZONTAL 16:9 (wide). Componha em paisagem.",
        aspectRatio: "16:9",
      },
    };

    const resolved = FORMAT_MAP[formatKey] ?? FORMAT_MAP["1:1"];
    const formatHint = resolved.hint;

    const GEMINI_API = Deno.env.get("GEMINI_API");
    if (!GEMINI_API) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemInstruction = `Você gera imagens para o blog Vida 360º (saúde, bem-estar, vida equilibrada no Brasil).

REGRA — EVITE TEXTO LONGO NA IMAGEM:
- NÃO inclua parágrafos, hashtags nem frases longas (modelos erram ortografia em português).
- Prefira imagem SEM texto ou só palavras mínimas se indispensável.
- Cena: acolhedora, luminosa, estilo limpo; cores suaves; temas: natureza, autocuidado, pessoas em momentos de calma, hábitos saudáveis, bem-estar mental (sem violência ou conteúdo sensível).`;

    const userPrompt = `Gere uma imagem que represente este tema (cena visual, sem texto longo).

${formatHint}

Tema: ${prompt.trim()}`;

    const aspectRatio = resolved.aspectRatio;

    const body = {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio },
      },
    };

    let response: Response | null = null;

    for (const model of IMAGE_MODELS) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (response.ok) break;
      const errText = await response.text();
      console.warn(`Gemini image model ${model} failed:`, response.status, errText);
      if (response.status !== 404 && response.status !== 400) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de requisições. Tente em alguns minutos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        throw new Error(`API: ${response.status}`);
      }
    }

    if (!response || !response.ok) {
      return new Response(
        JSON.stringify({
          error: "Geração de imagem não disponível",
          details: "Verifique a chave Gemini ou use a descrição em Canva ou outro gerador.",
          suggestion: prompt.trim(),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    let imageBase64: string | null = null;
    let textPart = "";

    for (const part of parts) {
      if (part.inlineData?.data) {
        imageBase64 = part.inlineData.data;
        break;
      }
      if (part.text) textPart += part.text;
    }

    if (!imageBase64) {
      return new Response(
        JSON.stringify({
          error: "Nenhuma imagem retornada",
          details: "O modelo não gerou imagem. Use a descrição em outra ferramenta.",
          suggestion: textPart || prompt.trim(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mimeType =
      data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { mimeType?: string } }) => p.inlineData?.data)
        ?.inlineData?.mimeType || "image/png";

    return new Response(
      JSON.stringify({
        imageBase64,
        mimeType,
        prompt: prompt.trim(),
        format: formatKey,
        aspectRatio,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("generate-blog-studio-image error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar imagem", details: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
