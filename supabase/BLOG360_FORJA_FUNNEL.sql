-- ============================================
-- Fase 4 — Funil Blog Vida 360º → Sistema Forja Campeã
-- Execute no SQL Editor do Supabase (projeto blog360).
-- ============================================

-- Atribuição UTM e estado de sync com fc_contato_leads
ALTER TABLE public.blog360_leads
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS fc_sync_status text,
  ADD COLUMN IF NOT EXISTS fc_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS fc_lead_id uuid;

CREATE INDEX IF NOT EXISTS idx_blog360_leads_utm_source
  ON public.blog360_leads (utm_source)
  WHERE utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog360_leads_origem_forja
  ON public.blog360_leads (origem)
  WHERE origem IN ('form_forja_sistema', 'form_forja_interesse');

CREATE INDEX IF NOT EXISTS idx_blog360_analytics_forja_clicks
  ON public.blog360_analytics (created_at DESC)
  WHERE evento IN ('forja_cta_click', 'forja_bridge_view');

COMMENT ON COLUMN public.blog360_leads.fc_sync_status IS 'Estado sync CRM Forja: pending | synced | failed | skipped';
COMMENT ON COLUMN public.blog360_leads.fc_lead_id IS 'UUID em fc_contato_leads quando sincronizado';

-- Admin pode ler analytics (funil Forja no painel)
DROP POLICY IF EXISTS "blog360_analytics_select_authenticated" ON public.blog360_analytics;
CREATE POLICY "blog360_analytics_select_authenticated"
  ON public.blog360_analytics
  FOR SELECT
  TO authenticated
  USING (true);
