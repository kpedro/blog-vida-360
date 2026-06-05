/**
 * Geração de texto do Blog Vida 360º com cadeia de fallbacks:
 * 1) Vários modelos Gemini (evita 404 quando um modelo sai do ar)
 * 2) OpenAI (se OPENAI_API_KEY existir)
 * 3) Webhook n8n opcional (BLOG360_N8N_STUDIO_WEBHOOK_URL) — alternativa, não obrigatório
 */

export type Blog360TextGenInput = {
  systemPrompt: string;
  userText: string;
  userParts?: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  temperature?: number;
  maxOutputTokens?: number;
  /** Metadado opcional enviado ao n8n */
  contentType?: string;
};

export type Blog360TextGenResult = {
  text: string;
  provider: "gemini" | "openai" | "n8n";
  model?: string;
};

function uniqueModels(): string[] {
  const fromEnv = Deno.env.get("BLOG360_GEMINI_MODEL")?.trim();
  const chain = [
    fromEnv,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ].filter((m): m is string => Boolean(m && m.trim()));
  return [...new Set(chain)];
}

function extractN8nReply(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const d = body as Record<string, unknown>;
  const direct = d.reply ?? d.message ?? d.text ?? d.output ?? d.response ?? d.result;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const json = d.json as Record<string, unknown> | undefined;
  if (json && typeof json === "object") {
    const nested = json.output ?? json.message ?? json.text ?? json.reply;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return "";
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  input: Blog360TextGenInput,
): Promise<string | null> {
  const parts =
    input.userParts && input.userParts.length
      ? input.userParts
      : [{ text: input.userText }];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        systemInstruction: { parts: [{ text: input.systemPrompt }] },
        generationConfig: {
          temperature: input.temperature ?? 0.8,
          maxOutputTokens: input.maxOutputTokens ?? 8192,
        },
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`[blog360TextGenerate] Gemini ${model}:`, res.status, errText.slice(0, 400));
    if (res.status === 429) throw new Error("RATE_LIMIT");
    return null;
  }

  const data = await res.json();
  const text = String(data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
  return text || null;
}

async function callOpenAI(input: Blog360TextGenInput): Promise<string | null> {
  const key = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: Deno.env.get("BLOG360_OPENAI_MODEL")?.trim() || "gpt-4o-mini",
      temperature: input.temperature ?? 0.8,
      max_tokens: Math.min(input.maxOutputTokens ?? 8192, 16384),
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userText },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn("[blog360TextGenerate] OpenAI:", res.status, errText.slice(0, 400));
    if (res.status === 429) throw new Error("RATE_LIMIT");
    return null;
  }

  const data = await res.json();
  const text = String(data.choices?.[0]?.message?.content || "").trim();
  return text || null;
}

async function callN8nStudio(input: Blog360TextGenInput): Promise<string | null> {
  const url = Deno.env.get("BLOG360_N8N_STUDIO_WEBHOOK_URL")?.trim();
  if (!url) return null;

  const apiKey = Deno.env.get("BLOG360_N8N_STUDIO_WEBHOOK_API_KEY")?.trim() || "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers["X-API-Key"] = apiKey;
  }

  const message =
    `[blog360_studio_task:generate_text]\n` +
    `contentType: ${input.contentType || "article_copy"}\n\n` +
    `SYSTEM:\n${input.systemPrompt}\n\n` +
    `USER:\n${input.userText}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        message,
        sessionId: `blog360_studio_${Date.now()}`,
        source: "blog-vida-360-studio",
        contentType: input.contentType || "article_copy",
        miniPortalMode: "studio_fallback",
      }),
    });
    const raw = await res.text();
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      /* texto puro */
    }
    if (!res.ok) {
      console.warn("[blog360TextGenerate] n8n:", res.status, raw.slice(0, 400));
      return null;
    }
    const text = extractN8nReply(parsed);
    return text || (typeof parsed === "string" ? parsed.trim() : null);
  } catch (e) {
    console.warn("[blog360TextGenerate] n8n error:", e);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateBlog360Text(
  input: Blog360TextGenInput,
): Promise<Blog360TextGenResult> {
  const geminiKey = Deno.env.get("GEMINI_API")?.trim();
  const errors: string[] = [];

  if (geminiKey) {
    for (const model of uniqueModels()) {
      try {
        const text = await callGeminiModel(geminiKey, model, input);
        if (text) return { text, provider: "gemini", model };
        errors.push(`Gemini ${model}: sem resposta ou indisponível`);
      } catch (e) {
        if (e instanceof Error && e.message === "RATE_LIMIT") throw e;
        errors.push(`Gemini ${model}: erro`);
      }
    }
  } else {
    errors.push("GEMINI_API não configurado");
  }

  try {
    const openaiText = await callOpenAI(input);
    if (openaiText) {
      return {
        text: openaiText,
        provider: "openai",
        model: Deno.env.get("BLOG360_OPENAI_MODEL")?.trim() || "gpt-4o-mini",
      };
    }
    if (Deno.env.get("OPENAI_API_KEY")?.trim()) {
      errors.push("OpenAI: sem resposta");
    }
  } catch (e) {
    if (e instanceof Error && e.message === "RATE_LIMIT") throw e;
    errors.push("OpenAI: erro");
  }

  const n8nText = await callN8nStudio(input);
  if (n8nText) {
    return { text: n8nText, provider: "n8n", model: "webhook" };
  }
  if (Deno.env.get("BLOG360_N8N_STUDIO_WEBHOOK_URL")?.trim()) {
    errors.push("n8n: webhook respondeu vazio ou com erro");
  }

  throw new Error(
    `Nenhum motor de IA disponível. ${errors.join("; ")}. ` +
      `Configure GEMINI_API no Supabase, opcionalmente OPENAI_API_KEY ou BLOG360_N8N_STUDIO_WEBHOOK_URL.`,
  );
}
