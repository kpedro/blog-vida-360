import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateBlog360Text } from "../_shared/blog360TextGenerate.ts";
import {
  BLOG360_FORJA_CATEGORIES,
  blog360FullContext,
} from "../_shared/blog360ForjaContext.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSystemPrompt(type: string): string {
  const base = `Você é um redator especializado em conteúdo para o blog Vida 360º. Crie textos em português brasileiro para artigos, redes sociais e materiais de divulgação do blog.

${blog360FullContext()}

${BLOG360_FORJA_CATEGORIES}

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
Prioridade: INSTAGRAM (também pode incluir uma variante curta para Facebook/LinkedIn se o pedido pedir).

Estrutura sugerida da LEGENDA para Instagram (na ordem):
1) PRIMEIRA LINHA — gancho curto que pare na pré-visualização (sem click "ver mais" se possível).
2) CORPO — 2 a 6 linhas com valor, tom acolhedor, sem promessas milagrosas de saúde.
3) CTA — "link na bio", "comenta abaixo" ou convite honesto; não invente URLs nem links.
4) HASHTAGS — bloco final com 5 a 12 hashtags em português relevantes (#bemestar #vidasaudavel etc.), sem repetir dezenas.

Regras:
- Limite total da legenda: até 2200 caracteres (incluindo hashtags e emojis).
- Emojis só se combinarem com o tom; no máximo moderado.
- Gere 1 a 3 variações (curta / média / alternativa) quando o pedido não especificar.
- Não inclua HTML.

No final, após o conteúdo, adicione exatamente este bloco (separado por ---):
---
SUGESTÃO DE IMAGEM
Descrição: [cena visual ideal para o post — sem texto longo na arte]
Dimensões sugeridas: 1080x1350 (4:5 feed IG), 1080x1080 (1:1) ou 1080x1920 (9:16 Stories/Reels)
Onde usar: imagem principal do post ou story`
      );
    case "forja_bridge":
      return (
        base +
        `
Para ARTIGOS PONTE — série Sistema Forja Campeã no blog:
- Tom editorial Vida 360º; o texto explica e qualifica, não substitui a plataforma Forja.
- Temas: Plano 72h, duplicação (7 passos), liderança em camadas, disciplina/rotina para rede.
- Estrutura Markdown: # título, introdução, 3–4 ## subtítulos, listas práticas, conclusão.
- No final: CTA honesto para conhecer o Sistema Forja (página ponte do blog ou como-funciona na Forja) — sem inventar URL com token de convite.
- Não prometa renda; não venda marca de produto específica como foco principal.
- Sugira categoria editorial: sistema-forja, plano-72h, duplicacao ou lideranca conforme o ângulo.

Opcional no final: --- e SUGESTÃO DE IMAGEM com descrição para capa (estilo profissional, âmbar/lilás suave).`
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

    const temp = typeof tempIn === "number" && tempIn >= 0 && tempIn <= 2 ? tempIn : 0.8;

    const result = await generateBlog360Text({
      systemPrompt: getSystemPrompt(type),
      userText: prompt.trim(),
      temperature: temp,
      maxOutputTokens: 8192,
      contentType: type,
    });

    return new Response(
      JSON.stringify({
        content: result.text,
        type,
        provider: result.provider,
        model: result.model,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("generate-blog-studio-content error:", error);

    if (errMsg === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Limite de requisições. Tente em alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Erro ao gerar conteúdo", details: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
