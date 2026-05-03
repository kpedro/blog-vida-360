import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGES = 28;
const MAX_MSG_CHARS = 12000;
const MAX_IMAGES_PER_MESSAGE = 4;
/** Tamanho aproximado do payload base64 por imagem (caracteres) */
const MAX_B64_CHARS_PER_IMAGE = 4_500_000;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

type ImagePart = { mimeType: string; dataBase64: string };
type NormMsg = { role: "user" | "assistant"; content: string; images?: ImagePart[] };

const SYSTEM_PADRAO = `Você é o assistente rápido do painel administrativo do Blog Vida 360º (bem-estar, hábitos, aromaterapia segura, negócio doTERRA quando aplicável).

Modo: respostas curtas e acionáveis em português brasileiro.
Ajude com: o que postar hoje, ideia de gancho, checklist antes de publicar, coerência leve com o post anterior, dúvidas sobre categorias ou calendário simples.
Não invente estudos clínicos nem promessas de cura; sugira profissional de saúde quando o caso for clínico.
Se o utilizador enviar capturas de ecrã ou imagens, descreva o que vê de forma objectiva e responda em função disso (interface, texto legível, gráficos).
Se o utilizador pedir texto longo ou um plano editorial completo, indique que pode mudar para o modo «IA dedicada» no painel para uma resposta mais profunda.`;

const SYSTEM_DEDICADO = `Você é o assistente estratégico do painel administrativo do Blog Vida 360º.

Objetivo: orientação editorial profunda — sequência de posts, arco narrativo ao longo de semanas, coerência entre categorias diferentes (ex.: aromaterapia + rotina + negócio), temas quando o autor «não sabe o que postar», e pontes entre artigos.
Práticas:
- Proponha trilhas (ex.: problema → educação leve → ferramenta → história → convite honesto) e como encaixar categorias sem quebrar a voz da marca.
- Use listas e passos quando ajudar; pode escrever rascunhos de ideias de título e ângulo, não precisa ser ultra-curto.
- Respeite limites: sem alegações médicas, sem garantir resultados de saúde; tom acolhedor e claro.
- Se o utilizador enviar capturas de ecrã ou imagens, analise o conteúdo visual (texto, UI, métricas) e incorpore isso na orientação.
- Se faltar contexto sobre o blog ou público, pergunte objectivamente antes de assumir.`;

function stripDataUrlBase64(raw: string): { mime: string; b64: string } | null {
  const s = String(raw || "").trim();
  const m = s.match(/^data:([^;]+);base64,([\s\S]+)$/i);
  if (m) {
    const mime = m[1].toLowerCase().split(";")[0].trim();
    return { mime, b64: m[2].replace(/\s/g, "") };
  }
  return null;
}

function normalizeImages(raw: unknown): ImagePart[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: ImagePart[] = [];
  for (const it of raw.slice(0, MAX_IMAGES_PER_MESSAGE)) {
    if (!it || typeof it !== "object") continue;
    const o = it as { mimeType?: string; dataBase64?: string };
    let mime = String(o.mimeType || "image/png").toLowerCase().split(";")[0].trim();
    let b64 = String(o.dataBase64 || "");
    const stripped = stripDataUrlBase64(b64);
    if (stripped) {
      mime = stripped.mime;
      b64 = stripped.b64;
    }
    if (!ALLOWED_MIME.has(mime)) continue;
    if (b64.length > MAX_B64_CHARS_PER_IMAGE) continue;
    if (b64.length < 80) continue;
    out.push({ mimeType: mime, dataBase64: b64 });
  }
  return out.length ? out : undefined;
}

function normalizeMessages(raw: unknown): NormMsg[] {
  if (!Array.isArray(raw)) return [];
  const out: NormMsg[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: string }).role === "assistant" ? "assistant" : "user";
    let content = String((m as { content?: string }).content || "").trim();
    if (content.length > MAX_MSG_CHARS) content = content.slice(0, MAX_MSG_CHARS);
    const images = role === "user" ? normalizeImages((m as { images?: unknown }).images) : undefined;
    if (!content && !images) continue;
    out.push({ role, content, images });
  }
  return out.slice(-MAX_MESSAGES);
}

function lastUserIndex(messages: NormMsg[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return i;
  }
  return -1;
}

/** Só a última mensagem do utilizador pode levar imagens à API (evita payload enorme). */
function stripImagesExceptLastUser(messages: NormMsg[]): NormMsg[] {
  const li = lastUserIndex(messages);
  return messages.map((m, i) => {
    if (m.role === "user" && i === li) return m;
    return { role: m.role, content: m.content };
  });
}

function buildContents(messages: NormMsg[]) {
  const li = lastUserIndex(messages);
  return messages.map((m, i) => {
    const role = m.role === "assistant" ? "model" : "user";
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (m.role === "assistant") {
      parts.push({ text: m.content || "…" });
      return { role, parts };
    }

    const isLastUser = i === li;
    const imgs = isLastUser && m.images && m.images.length ? m.images.slice(0, MAX_IMAGES_PER_MESSAGE) : [];

    let text = (m.content || "").trim();
    if (!text && imgs.length) {
      text = "Analise o print ou imagem em anexo. Responda em português do Brasil, de forma clara.";
    }
    if (!text && !imgs.length) {
      text = "…";
    }

    if (imgs.length) {
      parts.push({ text });
      for (const im of imgs) {
        parts.push({ inlineData: { mimeType: im.mimeType, data: im.dataBase64 } });
      }
    } else {
      parts.push({ text });
    }

    return { role, parts };
  });
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
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === "dedicado" ? "dedicado" : "padrao";
    const systemPrompt = mode === "dedicado" ? SYSTEM_DEDICADO : SYSTEM_PADRAO;

    const rawMessages = normalizeMessages(body.messages);
    const messages = stripImagesExceptLastUser(rawMessages);

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return new Response(JSON.stringify({ error: "Envie ao menos uma mensagem do utilizador." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const last = messages[messages.length - 1];
    if (!last.content.trim() && !(last.images && last.images.length)) {
      return new Response(JSON.stringify({ error: "Mensagem vazia." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API = Deno.env.get("GEMINI_API");
    if (!GEMINI_API) {
      throw new Error("GEMINI_API is not configured");
    }

    const modelPadrao = Deno.env.get("BLOG360_ADMIN_GEMINI_MODEL_PADRAO")?.trim() || "gemini-2.0-flash";
    const modelDedicado = Deno.env.get("BLOG360_ADMIN_GEMINI_MODEL_DEDICADO")?.trim() || "gemini-2.5-flash";
    const model = mode === "dedicado" ? modelDedicado : modelPadrao;

    const maxOut = mode === "dedicado" ? 8192 : 2048;
    const temperature = mode === "dedicado" ? 0.45 : 0.35;

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API}`;

    const payload = {
      contents: buildContents(messages),
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature,
        maxOutputTokens: maxOut,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("blog-admin-assistant Gemini:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: `Erro da API (${response.status}). Confirme o modelo e GEMINI_API.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const reply = String(data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    if (!reply) {
      throw new Error("Resposta vazia da IA");
    }

    return new Response(JSON.stringify({ reply, mode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("blog-admin-assistant:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
