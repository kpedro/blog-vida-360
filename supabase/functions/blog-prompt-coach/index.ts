import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGES = 24;
const MAX_MSG_CHARS = 8000;

const SYSTEM_PROMPT = `Você é um assistente de engenharia de prompts para redatores do Blog Vida 360º (saúde integral, bem-estar, saúde mental, hábitos e equilíbrio).

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
- assistantMessage sempre preenchido.
- IMPORTANTE: dentro de strings JSON, use \\n para quebra de linha. Nunca coloque quebra de linha literal entre as aspas.`;

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

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

    let parsed: {
      phase?: string;
      assistantMessage?: string;
      suggestedTitle?: string;
      suggestedContent?: string;
    };
    const jsonCandidate = extractJsonObject(rawText) ?? stripJsonFence(rawText);
    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      const loose = parsePromptCoachLoose(rawText);
      if (loose && (loose.assistantMessage.trim() || loose.suggestedContent.trim())) {
        const phaseLoose = loose.phase === "deliver" ? "deliver" : "clarify";
        return new Response(
          JSON.stringify({
            phase: phaseLoose,
            assistantMessage: loose.assistantMessage,
            suggestedTitle: phaseLoose === "deliver" ? loose.suggestedTitle.trim() : "",
            suggestedContent: phaseLoose === "deliver" ? loose.suggestedContent.trim() : "",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          error: "parse_failed",
          rawText,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const phase = parsed.phase === "deliver" ? "deliver" : "clarify";
    const assistantMessage = typeof parsed.assistantMessage === "string"
      ? parsed.assistantMessage
      : "Não consegui formatar a resposta. Tente reformular ou continuar a conversa.";
    const suggestedTitle = typeof parsed.suggestedTitle === "string" ? parsed.suggestedTitle : "";
    const suggestedContent = typeof parsed.suggestedContent === "string" ? parsed.suggestedContent : "";

    return new Response(
      JSON.stringify({
        phase,
        assistantMessage,
        suggestedTitle: phase === "deliver" ? suggestedTitle.trim() : "",
        suggestedContent: phase === "deliver" ? suggestedContent.trim() : "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
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
