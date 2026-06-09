import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FORJA_SYNC_ORIGINS = new Set(["form_forja_sistema", "form_forja_interesse"]);

function trimField(value: unknown, max = 120): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().slice(0, max);
  return t || null;
}

function objetivoFromOrigem(origem: string): string {
  if (origem === "form_forja_sistema") {
    return "Interesse no Sistema Forja Campeã (formulário produtos.html no blog Vida 360º). Aguarda convite/orientação.";
  }
  return `Lead do blog Vida 360º — origem: ${origem}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const nome = String(body.nome || "").trim();
    const origem = String(body.origem || "").trim();
    const leadId = body.lead_id ? String(body.lead_id) : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "E-mail inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!FORJA_SYNC_ORIGINS.has(origem)) {
      return new Response(JSON.stringify({ synced: false, reason: "origem_nao_forja" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!serviceKey) {
      return new Response(
        JSON.stringify({
          synced: false,
          reason: "service_role_ausente",
          message: "Configure SUPABASE_SERVICE_ROLE_KEY nos secrets da Edge Function.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const service = createClient(supabaseUrl, serviceKey);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingFc } = await service
      .from("fc_contato_leads")
      .select("id")
      .eq("email", email)
      .eq("utm_source", "blog_vida360")
      .gte("created_at", weekAgo)
      .limit(1)
      .maybeSingle();

    if (existingFc?.id) {
      if (leadId) {
        await service.from("blog360_leads").update({
          fc_sync_status: "synced",
          fc_synced_at: new Date().toISOString(),
          fc_lead_id: existingFc.id,
        }).eq("id", leadId);
      }
      return new Response(
        JSON.stringify({ synced: true, fc_lead_id: existingFc.id, deduplicated: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const utm_source = trimField(body.utm_source) || "blog_vida360";
    const utm_medium = trimField(body.utm_medium) || "referral";
    const utm_campaign = trimField(body.utm_campaign) || "blog_bridge";
    const utm_content = trimField(body.utm_content);
    const utm_term = trimField(body.utm_term);

    const row: Record<string, string | null> = {
      nome: nome || email.split("@")[0] || "Visitante blog",
      empresa: "Blog Vida 360º",
      email,
      objetivo: objetivoFromOrigem(origem),
      source: "forja",
      status: "novo",
      utm_source,
      utm_medium,
      utm_campaign,
    };
    if (utm_content) row.utm_content = utm_content;
    if (utm_term) row.utm_term = utm_term;

    const adminNotes = [
      `Origem blog: ${origem}`,
      body.landing_path ? `Landing: ${String(body.landing_path).slice(0, 200)}` : null,
    ].filter(Boolean).join("\n");
    if (adminNotes) row.admin_notes = adminNotes;

    const { data: inserted, error: fcError } = await service
      .from("fc_contato_leads")
      .insert(row)
      .select("id")
      .single();

    if (fcError) {
      console.error("blog360-sync-forja-lead fc_contato_leads:", fcError.message);
      if (leadId) {
        await service.from("blog360_leads").update({ fc_sync_status: "failed" }).eq("id", leadId);
      }
      return new Response(
        JSON.stringify({ synced: false, error: fcError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fcLeadId = inserted?.id as string | undefined;

    if (leadId && fcLeadId) {
      await service.from("blog360_leads").update({
        fc_sync_status: "synced",
        fc_synced_at: new Date().toISOString(),
        fc_lead_id: fcLeadId,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
      }).eq("id", leadId);
    }

    return new Response(
      JSON.stringify({ synced: true, fc_lead_id: fcLeadId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("blog360-sync-forja-lead:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
