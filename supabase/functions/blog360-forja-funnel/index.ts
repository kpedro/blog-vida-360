import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const since7 = daysAgoIso(7);
    const since30 = daysAgoIso(30);

    const { count: clicks7 } = await userClient
      .from("blog360_analytics")
      .select("*", { count: "exact", head: true })
      .eq("evento", "forja_cta_click")
      .gte("created_at", since7);

    const { count: clicks30 } = await userClient
      .from("blog360_analytics")
      .select("*", { count: "exact", head: true })
      .eq("evento", "forja_cta_click")
      .gte("created_at", since30);

    const { count: bridgeViews7 } = await userClient
      .from("blog360_analytics")
      .select("*", { count: "exact", head: true })
      .eq("evento", "forja_bridge_view")
      .gte("created_at", since7);

    const { count: leadsForjaTotal } = await userClient
      .from("blog360_leads")
      .select("*", { count: "exact", head: true })
      .eq("origem", "form_forja_sistema");

    const { count: leadsForja7 } = await userClient
      .from("blog360_leads")
      .select("*", { count: "exact", head: true })
      .eq("origem", "form_forja_sistema")
      .gte("created_at", since7);

    const { count: leadsSynced } = await userClient
      .from("blog360_leads")
      .select("*", { count: "exact", head: true })
      .eq("fc_sync_status", "synced");

    let fcLeadsBlog = 0;
    let fcLeadsBlog7 = 0;
    let fcServiceConfigured = !!serviceKey;

    if (serviceKey) {
      const service = createClient(supabaseUrl, serviceKey);
      const { count: fcTotal } = await service
        .from("fc_contato_leads")
        .select("*", { count: "exact", head: true })
        .eq("utm_source", "blog_vida360");
      const { count: fc7 } = await service
        .from("fc_contato_leads")
        .select("*", { count: "exact", head: true })
        .eq("utm_source", "blog_vida360")
        .gte("created_at", since7);
      fcLeadsBlog = fcTotal ?? 0;
      fcLeadsBlog7 = fc7 ?? 0;
    }

    const clickToLeadRate = (clicks7 ?? 0) > 0
      ? Math.round(((leadsForja7 ?? 0) / (clicks7 ?? 1)) * 1000) / 10
      : 0;

    return new Response(
      JSON.stringify({
        period_days: 7,
        blog: {
          forja_cta_clicks_7d: clicks7 ?? 0,
          forja_cta_clicks_30d: clicks30 ?? 0,
          forja_bridge_views_7d: bridgeViews7 ?? 0,
          leads_form_forja_total: leadsForjaTotal ?? 0,
          leads_form_forja_7d: leadsForja7 ?? 0,
          leads_synced_fc: leadsSynced ?? 0,
          click_to_lead_pct_7d: clickToLeadRate,
        },
        forja_crm: {
          service_role_configured: fcServiceConfigured,
          leads_utm_blog_total: fcLeadsBlog,
          leads_utm_blog_7d: fcLeadsBlog7,
        },
        links: {
          forja_admin_leads: "https://forjacampea.com.br/sistema/admin/leads",
          blog_produtos: "/produtos.html",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
