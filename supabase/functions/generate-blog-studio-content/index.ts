import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BLOG_VIDA360_CONTEXT = `O Blog Vida 360º é um blog brasileiro sobre saúde integral, bem-estar, saúde mental, produtividade com equilíbrio e hábitos saudáveis.

Público: leitores que buscam conteúdo acessível, acolhedor e baseado em boas práticas, sem sensacionalismo.
Temas: saúde mental, autocuidado, rotina, sono, alimentação consciente, relacionamentos, equilíbrio entre trabalho e vida pessoal, mentalidade e crescimento.
Tom: acolhedor, claro, respeitoso; português brasileiro correto; evitar promessas milagrosas ou linguagem médica que substitua profissional de saúde.`;

function getSystemPrompt(type: string): string {
  const base = `Você é um redator especializado em conteúdo para o blog Vida 360º. Crie textos em português brasileiro para artigos, redes sociais e materiais de divulgação do blog.

${BLOG_VIDA360_CONTEXT}

Diretrizes gerais:
- Linguagem clara, acolhedora e profissional
- Foco em valor real para o leitor (dicas práticas, reflexão, bem-estar)
- Evite exageros; seja convincente com benefícios honestos
- Ortografia e gramática impecáveis
`;

  switch (type) {
    case "landing":
      return (
        base +
        `
Para LANDING PAGE ou página de captura relacionada ao blog:
1. Título principal (headline) impactante e curto
2. Subtítulo que complemente o valor
3. 3 a 4 bullets de benefícios
4. Chamada para ação (CTA) principal
5. Opcional: seção "Para quem é" (2-3 frases)

No final, após o conteúdo, adicione exatamente este bloco (separado por ---):
---
SUGESTÃO DE IMAGEM
Descrição: [cena ou conceito visual ideal para hero/banner]
Dimensões: 1200x630 (Open Graph) ou 1920x1080 (hero)
Onde usar: banner, compartilhamento em redes

Formate com quebras de linha e **negrito** se ajudar. Não inclua HTML.`
      );
    case "social_post":
      return (
        base +
        `
Para POSTS DE REDES SOCIAIS (Instagram, Facebook, LinkedIn) sobre o blog:
- Gere 1 a 3 variações conforme o pedido (curta, média)
- Hashtags relevantes (#saude #bemestar #vidasaudavel etc.)
- Tom adequado à rede; emojis com moderação se fizer sentido
- Não invente URLs; use "link na bio" ou "acesse o blog" quando for CTA

No final, após o conteúdo, adicione exatamente este bloco (separado por ---):
---
SUGESTÃO DE IMAGEM
Descrição: [imagem ideal para o post]
Dimensões: 1080x1080 ou 1200x630
Onde usar: imagem do post, story`
      );
    case "article_copy":
      return (
        base +
        `
Para ARTIGOS, RASCUNHOS DE POST DO BLOG OU COPY LONGA:
- Estrutura clara: pode ser outline com H2 sugeridos, ou texto corrido com introdução, desenvolvimento e conclusão
- Tom informativo e acolhedor; parágrafos curtos para leitura em tela
- Se o usuário pedir Markdown, use # para títulos, **negrito**, listas com -
- Não invente dados científicos sem base; sugira "converse com um profissional" quando for tema de saúde clínica
- Opcional no final: --- e SUGESTÃO DE IMAGEM com descrição para ilustração

Não inclua HTML cru; Markdown ou texto puro com parágrafos separados por linha em branco.`
      );
    default:
      return (
        base +
        `
Gere conteúdo para o Blog Vida 360º conforme o pedido do usuário. Seja claro e profissional em português brasileiro.`
      );
  }
}

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

    const { type = "article_copy", prompt, temperature: tempIn } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "O campo 'prompt' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const GEMINI_API = Deno.env.get("GEMINI_API");
    if (!GEMINI_API) {
      throw new Error("GEMINI_API não configurado");
    }

    const systemPrompt = getSystemPrompt(type);
    const model = "gemini-2.0-flash";

    const temp = typeof tempIn === "number" && tempIn >= 0 && tempIn <= 2 ? tempIn : 0.8;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt.trim() }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: temp,
            maxOutputTokens: 8192,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições. Tente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`Gemini API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Nenhum conteúdo gerado pela IA");
    }

    return new Response(
      JSON.stringify({ content, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("generate-blog-studio-content error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar conteúdo", details: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
