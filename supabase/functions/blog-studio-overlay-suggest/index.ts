import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CONTENT_CHARS = 48000;

function stripJsonFence(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im.exec(t);
  if (fence) t = fence[1].trim();
  return t;
}

function parseSuggestPayload(text: string): { category: string; headline: string } | null {
  const cleaned = stripJsonFence(text);
  try {
    const obj = JSON.parse(cleaned);
    if (!obj || typeof obj !== "object") return null;
    const category = typeof obj.category === "string" ? obj.category.trim().slice(0, 80) : "";
    let headline = typeof obj.headline === "string" ? obj.headline.trim() : "";
    headline = headline.replace(/\r\n/g, "\n").slice(0, 2000);
    if (!category && !headline) return null;
    return { category, headline };
  } catch {
    return null;
  }
}

const SYSTEM = `Você sugere texto para CAPA de imagem estilo notícia/redes sociais do Blog Vida 360º (bem-estar integral, aromaterapia responsável, hábitos, sono, ansiedade leve, produtividade com equilíbrio).

O usuário envia o TEXTO JÁ GERADO (artigo em Markdown, legenda para Instagram, ou copy de landing).

Responda APENAS com um único objeto JSON válido em UTF-8 (sem markdown, sem texto antes ou depois), neste formato exato:
{"category":"...","headline":"..."}

Regras:
- category: selo curto em MAIÚSCULAS, 1 a 4 palavras (ex.: BEM-ESTAR, REDES, ROTINA, DICAS). Sem ponto final.
- headline: manchete para ler na imagem; use "\\n" (barra+n) dentro da string JSON para separar 2 a 5 linhas curtas com impacto. Português brasileiro. Sem hashtags, sem URLs, sem aspas internas.
- Baseie-se só no conteúdo enviado; não invente dados médicos nem promessas de cura.
- Se o texto for muito longo, sintetize o ângulo principal em poucas linhas.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const contentType =
      typeof body.contentType === "string" ? body.contentType.trim() : "article_copy";

    if (!content) {
      return new Response(
        JSON.stringify({ error: "O campo content é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const GEMINI_API = Deno.env.get("GEMINI_API");
    if (!GEMINI_API) {
      throw new Error("GEMINI_API não configurado");
    }

    const truncated = content.length > MAX_CONTENT_CHARS
      ? content.slice(0, MAX_CONTENT_CHARS) +
        "\n\n[… texto truncado para análise …]"
      : content;

    const userMessage =
      `Tipo de conteúdo no Estúdio (referência): ${contentType}\n\n---\n\nTEXTO:\n${truncated}`;

    const model = "gemini-2.0-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          systemInstruction: { parts: [{ text: SYSTEM }] },
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini overlay suggest:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições. Tente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`Gemini API: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText || typeof rawText !== "string") {
      throw new Error("Resposta vazia do modelo");
    }

    const parsed = parseSuggestPayload(rawText);
    if (!parsed) {
      console.error("JSON inválido do modelo:", rawText.slice(0, 500));
      return new Response(
        JSON.stringify({
          error: "A IA não devolveu JSON válido",
          details: rawText.slice(0, 400),
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        category: parsed.category,
        headline: parsed.headline,
        contentType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("blog-studio-overlay-suggest error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao sugerir texto da capa", details: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
