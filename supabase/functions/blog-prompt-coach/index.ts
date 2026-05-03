import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGES = 24;
const MAX_MSG_CHARS = 8000;

const ARTICLE_SYSTEM_PROMPT = `Você é um assistente de engenharia de prompts para redatores do Blog Vida 360º (saúde integral, bem-estar, saúde mental, hábitos e equilíbrio).

Objetivo: ajudar o usuário a montar um PROMPT reutilizável para o Estúdio de conteúdo ou para outras ferramentas de IA (estrutura de artigo, tom, público, SEO, outline, seções).

Como conduzir a conversa:
- Seja cordial e objetivo em português brasileiro.
- Faça poucas perguntas por vez (1 ou 2).
- Esclareça: tema do artigo, público, tom (acolhedor/técnico), formato (lista, narrativa, guia), tamanho aproximado, o que evitar.
- Não invente dados médicos ou estudos; se faltar contexto, pergunte ou use placeholders ([INSERIR FONTE]).
- Após 2 a 8 trocas, quando houver informação suficiente, entregue o prompt final.

FORMATO DE RESPOSTA OBRIGATÓRIO — responda SOMENTE com um único objeto JSON válido (sem markdown, sem texto antes ou depois), com esta estrutura:
{
  "phase": "clarify" | "deliver",
  "assistantMessage": "texto em markdown leve para o usuário ler",
  "suggestedTitle": "título curto para identificar o modelo; vazio \"\" enquanto phase for clarify",
  "suggestedContent": "texto completo do prompt pronto para colar; vazio \"\" enquanto phase for clarify"
}

Regras do JSON:
- Se ainda precisar de informações: phase = "clarify", suggestedTitle e suggestedContent como "".
- Quando entregar o prompt pronto: phase = "deliver", preencha suggestedTitle e suggestedContent.
- CRÍTICO em phase = "deliver": suggestedContent DEVE ter no MÍNIMO 400 caracteres com o prompt completo (instruções para a IA do Estúdio: tema, público, tom, estrutura, tamanho, o que evitar, tom de divulgação sutil se o usuário pediu). NUNCA deixe suggestedContent vazio, "..." ou só uma frase. assistantMessage = no máximo 2 frases curtas de encerramento; o prompt longo vai SOMENTE em suggestedContent.
- É PROIBIDO dizer que "montou o prompt" sem preencher suggestedContent com o texto integral. Se faltar espaço, seja mais conciso no assistantMessage, nunca no suggestedContent.
- NUNCA use "---" ou blocos markdown no lugar de suggestedContent; o prompt integral vai na string suggestedContent.
- assistantMessage sempre preenchido.
- IMPORTANTE: dentro de strings JSON, use \\n para quebra de linha. Nunca coloque quebra de linha literal entre as aspas.
- Se o usuário pedir capas de destaque Instagram, ícones, arte para Canva, Midjourney, Firefly ou "prompt só para imagem": em phase = "deliver", após o prompt principal do Estúdio, acrescente em suggestedContent (separado por \\n\\n) um bloco cuja primeira linha seja exactamente «PROMPT PARA IA DE IMAGEM (Canva / outras)» e na linha seguinte uma descrição visual concisa (estilo, cores, composição, proporção sugerida); pode ser em inglês se for útil para essas ferramentas. O bloco do Estúdio (texto/copy) continua a cumprir o mínimo de caracteres em conjunto com esse extra.`;

const MARKETING_SYSTEM_PROMPT = `Você é um assistente de copywriting e divulgação para o time do Blog Vida 360º.

Objetivo: produzir TEXTO PRONTO PARA USO em materiais de marketing e divulgação: faixa no topo do site, banners curtos, convites por WhatsApp, chamadas para reunião de oportunidade (Zoom/Meet), legendas em redes sociais, rótulos de botão (CTA), trechos de newsletter ou e-mail de convite, folders digitais curtos.

Escopo permitido (NÃO recuse pedidos legítimos nesta área):
- Convites comerciais, parcerias, cadastro, lista de espera, eventos ao vivo ou online.
- Oportunidade de negócio, modelo de revenda ou distribuição, prospecção de novos consultores/parceiros — quando o usuário pedir, ajude com copy clara e respeitosa.
- Incluir menção a WhatsApp, link de reunião, horário, tom acolhedor ou profissional conforme pedido.

Cumprimento e limites éticos:
- Não prometa cura de doenças, resultados médicos garantidos nem "milagres" de saúde.
- Não garanta renda fixa ou lucro certo; evite números inventados de ganhos.
- Para produtos de bem-estar: tom de convite e informação, sem substituir orientação de profissional de saúde.
- Português brasileiro, ortografia correta.

Como conduzir:
- Faça 1 ou 2 perguntas objetivas se faltar canal (faixa / WhatsApp / rede), público, tom ou tamanho do texto.
- Quando houver contexto suficiente, entregue na primeira resposta útil possível (às vezes em 1 troca).

FORMATO DE RESPOSTA OBRIGATÓRIO — responda SOMENTE com um único objeto JSON válido (sem markdown fora do JSON), com esta estrutura:
{
  "phase": "clarify" | "deliver",
  "assistantMessage": "texto curto para o usuário (pergunta, feedback ou encerramento)",
  "suggestedTitle": "rótulo curto ex.: Faixa reunião | WhatsApp convite",
  "suggestedContent": "texto final pronto para colar; vazio \"\" enquanto phase for clarify"
}

Regras do JSON:
- Em phase = "deliver", suggestedContent é o TEXTO FINAL (não é prompt para outra IA). Pode ser curto (ex.: 25–120 caracteres para faixa do site) ou mais longo (WhatsApp, legenda).
- Se o usuário precisar de TEXTO DA FAIXA + TEXTO DO BOTÃO, use linhas assim dentro de suggestedContent:
TEXTO_DA_FAIXA: uma linha
TEXTO_DO_BOTAO: até 4 palavras
- NUNCA diga que só ajuda com "artigos do blog" ou recuse copy de oportunidade/parceria: este modo é especificamente para marketing e divulgação.
- assistantMessage sempre preenchido. Em deliver: no máximo 2 frases curtas; o conteúdo utilizável vai em suggestedContent.
- Dentro de strings JSON use \\n para quebra de linha.
- Se o usuário pedir APENAS prompt para IA de imagem (Canva, etc.) e não copy de marketing: em deliver, suggestedContent pode ser só esse prompt visual, com primeira linha «PROMPT PARA IA DE IMAGEM (Canva / outras)» e descrição abaixo (mínimo de caracteres do deliver continua a aplicar-se ao texto total).`;

type Msg = { role: string; content: string };

function normalizeMessages(raw: unknown): Msg[] {
  if (!Array.isArray(raw)) return [];
  const out: Msg[] = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") continue;
    const role = (m as Msg).role;
    const content = typeof (m as Msg).content === "string" ? (m as Msg).content.trim() : "";
    if (!content || (role !== "user" && role !== "assistant")) continue;
    if (content.length > MAX_MSG_CHARS) continue;
    out.push({ role, content });
  }
  return out;
}

function buildContents(messages: Msg[]) {
  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  return contents;
}

/** Se o modelo colocou o prompt só na mensagem ou após "---", recupera para suggestedContent. */
function recoverSuggestedContent(
  assistantMessage: string,
  suggestedContent: string,
): string {
  const sc = (suggestedContent || "").trim();
  if (sc.length >= 40) return sc;

  const am = (assistantMessage || "").trim();
  if (!am) return sc;

  const afterSep = am.match(/\n-{3,}\n([\s\S]+)/);
  if (afterSep && afterSep[1].trim().length >= 40) {
    return afterSep[1].trim();
  }

  let body = am
    .replace(/^[\s\S]*?(?:prompt pronto|aqui está o prompt|segue (?:o prompt|abaixo)|use o prompt abaixo)[^\n]*\n+/i, "")
    .replace(/^---+[\s\n]*/m, "")
    .trim();

  if (body.length >= 40) return body;
  if (am.length >= 120) return am;
  return sc;
}

type CoachMode = "article" | "marketing";

function finalizeCoachResponse(
  phaseIn: "clarify" | "deliver",
  assistantMessage: string,
  suggestedTitle: string,
  suggestedContent: string,
  opts?: { minDeliverChars?: number; mode?: CoachMode },
) {
  const minDeliver = opts?.minDeliverChars ?? 40;
  const mode = opts?.mode ?? "article";
  let phase: "clarify" | "deliver" = phaseIn;
  let am = typeof assistantMessage === "string" ? assistantMessage : "";
  let st = typeof suggestedTitle === "string" ? suggestedTitle : "";
  let sc = typeof suggestedContent === "string" ? suggestedContent : "";

  const recovered = recoverSuggestedContent(am, sc);
  if (phase === "deliver" && recovered.trim().length > sc.trim().length) {
    sc = recovered.trim();
  }
  if (phase === "deliver" && sc.trim().length >= 80 && am.length > 500) {
    am = mode === "marketing"
      ? "Texto pronto abaixo. Use «Copiar» na Central de marketing para colar no site ou no WhatsApp."
      : "Prompt pronto. Use o botão «Aplicar ao campo de comando» para colar o texto completo no Estúdio.";
  }
  if (phase === "deliver" && sc.trim().length < minDeliver) {
    phase = "clarify";
  }

  return {
    phase,
    assistantMessage: am,
    suggestedTitle: phase === "deliver" ? st.trim() : "",
    suggestedContent: phase === "deliver" ? sc.trim() : "",
  };
}

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const coachMode: CoachMode = body.mode === "marketing" ? "marketing" : "article";
    const systemPromptText = coachMode === "marketing"
      ? MARKETING_SYSTEM_PROMPT
      : ARTICLE_SYSTEM_PROMPT;
    const minDeliverChars = coachMode === "marketing" ? 22 : 40;
    const minRepairChars = coachMode === "marketing" ? 45 : 120;

    const messages = normalizeMessages(body.messages);
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return new Response(JSON.stringify({ error: "Envie ao menos uma mensagem do usuário." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API = Deno.env.get("GEMINI_API");
    if (!GEMINI_API) {
      throw new Error("GEMINI_API is not configured");
    }

    const contents = buildContents(messages);

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API}`;

    const payloadWithJsonSchema = {
      contents,
      systemInstruction: { parts: [{ text: systemPromptText }] },
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            phase: { type: "string", enum: ["clarify", "deliver"] },
            assistantMessage: { type: "string" },
            suggestedTitle: { type: "string" },
            suggestedContent: { type: "string" },
          },
          required: ["phase", "assistantMessage", "suggestedTitle", "suggestedContent"],
        },
      },
    };

    const payloadPlain = {
      contents,
      systemInstruction: { parts: [{ text: systemPromptText }] },
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 8192,
      },
    };

    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithJsonSchema),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const retryPlain = response.status === 400 &&
        /responseSchema|responseMimeType|JsonSchema|schema/i.test(errorText);
      if (retryPlain) {
        console.warn("blog-prompt-coach: retry sem JSON schema");
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadPlain),
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("blog-prompt-coach Gemini:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!rawText) {
      throw new Error("Resposta vazia da IA");
    }

    const stripJsonFence = (s: string) => {
      const t = s.trim();
      const m = t.match(/^```(?:json)?\s*([\s\S]*?)```/im);
      if (m) return m[1].trim();
      return t;
    };

    const extractJsonObject = (s: string): string | null => {
      const t = stripJsonFence(s);
      const start = t.indexOf("{");
      if (start < 0) return null;
      let depth = 0;
      let inStr = false;
      let esc = false;
      for (let i = start; i < t.length; i++) {
        const c = t[i];
        if (inStr) {
          if (esc) esc = false;
          else if (c === "\\") esc = true;
          else if (c === "\"") inStr = false;
          continue;
        }
        if (c === "\"") {
          inStr = true;
          continue;
        }
        if (c === "{") depth++;
        else if (c === "}") {
          depth--;
          if (depth === 0) return t.slice(start, i + 1);
        }
      }
      return null;
    };

    const extractJsonStringLoose = (raw: string, key: string): string | null => {
      const re = new RegExp(`"${key}"\\s*:\\s*"`);
      const m = re.exec(raw);
      if (!m) return null;
      let i = m.index + m[0].length;
      let out = "";
      while (i < raw.length) {
        const c = raw[i];
        if (c === "\\") {
          if (i + 1 >= raw.length) {
            out += c;
            break;
          }
          const n = raw[i + 1];
          if (n === "n") out += "\n";
          else if (n === "r") out += "\r";
          else if (n === "t") out += "\t";
          else if (n === '"' || n === "\\" || n === "/") out += n;
          else out += n;
          i += 2;
          continue;
        }
        if (c === '"') {
          const trimmedRest = raw.slice(i + 1).trimStart();
          if (trimmedRest.startsWith(",") || trimmedRest.startsWith("}")) return out;
          out += c;
          i++;
          continue;
        }
        out += c;
        i++;
      }
      const t = out.trim();
      return t.length ? t : null;
    };

    const parsePromptCoachLoose = (raw: string): {
      phase: "clarify" | "deliver";
      assistantMessage: string;
      suggestedTitle: string;
      suggestedContent: string;
    } | null => {
      const trimmed = stripJsonFence(raw);
      const jsonSlice = extractJsonObject(trimmed) ?? (trimmed.startsWith("{") ? trimmed : null);
      if (jsonSlice) {
        try {
          const o = JSON.parse(jsonSlice) as Record<string, unknown>;
          const am = o.assistantMessage;
          const sc = o.suggestedContent;
          const st = o.suggestedTitle;
          const ph = o.phase;
          if (typeof am === "string" || typeof sc === "string") {
            return {
              phase: ph === "deliver" ? "deliver" : "clarify",
              assistantMessage: typeof am === "string" ? am : "",
              suggestedTitle: typeof st === "string" ? st : "",
              suggestedContent: typeof sc === "string" ? sc : "",
            };
          }
        } catch {
          /* loose */
        }
      }
      const assistantMessage = extractJsonStringLoose(trimmed, "assistantMessage") ?? "";
      const suggestedContent = extractJsonStringLoose(trimmed, "suggestedContent") ?? "";
      const suggestedTitle = extractJsonStringLoose(trimmed, "suggestedTitle") ?? "";
      const phaseRaw = extractJsonStringLoose(trimmed, "phase") ?? "";
      if (!assistantMessage.trim() && !suggestedContent.trim()) return null;
      return {
        phase: phaseRaw === "deliver" ? "deliver" : "clarify",
        assistantMessage,
        suggestedTitle,
        suggestedContent,
      };
    };

    type CoachParsed = {
      phase?: string;
      assistantMessage?: string;
      suggestedTitle?: string;
      suggestedContent?: string;
    };

    async function runRepairIfNeeded(p: CoachParsed): Promise<CoachParsed> {
      const sc0 = typeof p.suggestedContent === "string" ? p.suggestedContent.trim() : "";
      if (p.phase !== "deliver" || sc0.length >= minRepairChars) return p;

      const repairText = coachMode === "marketing"
        ? `CORREÇÃO OBRIGATÓRIA: phase era "deliver" mas suggestedContent está vazio ou muito curto.

Responda APENAS um único objeto JSON no formato do sistema, com:
- phase: "deliver"
- assistantMessage: no máximo 2 frases curtas
- suggestedTitle: rótulo curto
- suggestedContent: o TEXTO FINAL de divulgação pronto para colar (faixa, WhatsApp, legenda, etc.), mínimo ${minRepairChars} caracteres, reunindo o que o usuário pediu.`
        : `CORREÇÃO OBRIGATÓRIA: Na última resposta, phase era "deliver" mas suggestedContent está vazio ou com menos de ${minRepairChars} caracteres (ou só frases genéricas sem o prompt).

Responda APENAS um único objeto JSON no formato do sistema, com:
- phase: "deliver"
- assistantMessage: no máximo 2 frases curtas de encerramento
- suggestedTitle: rótulo curto do modelo
- suggestedContent: o texto INTEGRAL do prompt para colar na IA do Estúdio, reunindo TUDO que o usuário já disse (tema, público, tom, formato, extensão, restrições de marca/sigilo). Mínimo ${minRepairChars} caracteres.`;

      const repairContents = [
        ...contents,
        { role: "user", parts: [{ text: repairText }] },
      ];

      const repairPayload = {
        contents: repairContents,
        systemInstruction: { parts: [{ text: systemPromptText }] },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              phase: { type: "string", enum: ["clarify", "deliver"] },
              assistantMessage: { type: "string" },
              suggestedTitle: { type: "string" },
              suggestedContent: { type: "string" },
            },
            required: ["phase", "assistantMessage", "suggestedTitle", "suggestedContent"],
          },
        },
      };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(repairPayload),
        });
        if (!res.ok) return p;
        const d = await res.json();
        const rt = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!rt) return p;
        let p2: CoachParsed;
        try {
          const jc = extractJsonObject(rt) ?? stripJsonFence(rt);
          p2 = JSON.parse(jc) as CoachParsed;
        } catch {
          const loose = parsePromptCoachLoose(rt);
          if (!loose) return p;
          p2 = {
            phase: loose.phase,
            assistantMessage: loose.assistantMessage,
            suggestedTitle: loose.suggestedTitle,
            suggestedContent: loose.suggestedContent,
          };
        }
        const sc2 = typeof p2.suggestedContent === "string" ? p2.suggestedContent.trim() : "";
        if (sc2.length > sc0.length && sc2.length >= minDeliverChars) return p2;
      } catch (e) {
        console.warn("blog-prompt-coach repair:", e);
      }
      return p;
    }

    let parsed: CoachParsed;
    const jsonCandidate = extractJsonObject(rawText) ?? stripJsonFence(rawText);
    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      const loose = parsePromptCoachLoose(rawText);
      if (loose && (loose.assistantMessage.trim() || loose.suggestedContent.trim())) {
        let pLoose: CoachParsed = {
          phase: loose.phase,
          assistantMessage: loose.assistantMessage,
          suggestedTitle: loose.suggestedTitle,
          suggestedContent: loose.suggestedContent,
        };
        pLoose = await runRepairIfNeeded(pLoose);
        const phaseLoose = pLoose.phase === "deliver" ? "deliver" : "clarify";
        const out = finalizeCoachResponse(
          phaseLoose,
          pLoose.assistantMessage ?? "",
          pLoose.suggestedTitle ?? "",
          pLoose.suggestedContent ?? "",
          { minDeliverChars, mode: coachMode },
        );
        return new Response(JSON.stringify(out), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          phase: "clarify",
          assistantMessage: coachMode === "marketing"
            ? "A resposta da IA veio em formato inesperado. Envie de novo pedindo o texto final de divulgação em JSON (phase deliver + suggestedContent)."
            : "A resposta da IA veio em formato inesperado. Envie de novo: «Gere o JSON final com phase deliver e suggestedContent contendo o prompt completo para o Estúdio.»",
          suggestedTitle: "",
          suggestedContent: "",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    parsed = await runRepairIfNeeded(parsed);

    const phase: "clarify" | "deliver" = parsed.phase === "deliver" ? "deliver" : "clarify";
    const assistantMessage = typeof parsed.assistantMessage === "string"
      ? parsed.assistantMessage
      : "Não consegui formatar a resposta. Tente reformular ou continuar a conversa.";
    const suggestedTitle = typeof parsed.suggestedTitle === "string" ? parsed.suggestedTitle : "";
    const suggestedContent = typeof parsed.suggestedContent === "string" ? parsed.suggestedContent : "";

    const out = finalizeCoachResponse(phase, assistantMessage, suggestedTitle, suggestedContent, {
      minDeliverChars,
      mode: coachMode,
    });
    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("blog-prompt-coach:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro no assistente de prompt",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
