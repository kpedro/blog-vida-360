import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você reescreve legendas curtas exibidas abaixo de um banner de produto no Blog Vida 360º (transparência, indicação comercial, disclaimers legais).

Regras:
- Português brasileiro, claro e profissional
- Preserve nomes de marcas e produtos quando existirem; não invente novos benefícios de saúde, curas ou promessas terapêuticas
- Pode melhorar fluidez e clareza sobre transparência (ex.: link de indicação, apoio ao blog sem custo extra para o leitor) quando fizer sentido
- Limite aproximado: até 320 caracteres; preferir uma ou duas frases curtas
- Responda APENAS com o texto reescrito, sem aspas envolvendo o texto, sem markdown, sem prefixos como "Legenda:" ou "Texto:"`;

function cleanModelOutput(s: string): string {
  let t = (s || "").trim();
  t = t.replace(/^["'`]+|["'`]+$/g, "");
  t = t.replace(/^(legenda|texto|resultado)\s*:\s*/i, "").trim();
  return t.slice(0, 500);
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
    const textIn = typeof body.text === "string" ? body.text.trim() : "";
    if (textIn.length < 5) {
      return new Response(
        JSON.stringify({ error: "Envie o campo «text» com a legenda atual (mínimo 5 caracteres)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const text = textIn.slice(0, 8000);

    const GEMINI_API = Deno.env.get("GEMINI_API");
    if (!GEMINI_API) {
      throw new Error("GEMINI_API is not configured");
    }

    const userMessage =
      `Reescreva a legenda abaixo seguindo as regras do sistema. Mantenha fidelidade ao produto mencionado.\n\n---\n${text}`;

    const model = "gemini-2.0-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 512,
          },
        }),
      },
    );

    if (!response.ok) {
      const errT = await response.text();
      console.error("blog-rewrite-banner-legenda Gemini:", response.status, errT);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições. Tente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`Gemini API: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw || typeof raw !== "string") {
      throw new Error("Resposta vazia da IA");
    }

    const out = cleanModelOutput(raw);
    if (out.length < 5) {
      throw new Error("Texto reescrito inválido");
    }

    return new Response(JSON.stringify({ text: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("blog-rewrite-banner-legenda:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro ao reescrever legenda",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
