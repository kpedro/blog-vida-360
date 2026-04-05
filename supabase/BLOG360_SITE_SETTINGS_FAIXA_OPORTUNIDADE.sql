-- ============================================
-- BLOG VIDA 360º – Faixa de oportunidade (topo do site)
-- ============================================
-- Barra tipo "announcement" para CTA de parceria / distribuidor / oportunidade.
-- Execute no SQL Editor do Supabase após BLOG360_SITE_SETTINGS.sql.
-- ============================================

ALTER TABLE public.blog360_site_settings
  ADD COLUMN IF NOT EXISTS faixa_oportunidade_ativo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS faixa_oportunidade_texto TEXT,
  ADD COLUMN IF NOT EXISTS faixa_oportunidade_link TEXT,
  ADD COLUMN IF NOT EXISTS faixa_oportunidade_cta TEXT;

COMMENT ON COLUMN public.blog360_site_settings.faixa_oportunidade_texto IS 'Mensagem curta exibida na faixa (ex.: prospectar novos distribuidores).';
COMMENT ON COLUMN public.blog360_site_settings.faixa_oportunidade_link IS 'URL https do botão; opcional se só quiser texto informativo.';
COMMENT ON COLUMN public.blog360_site_settings.faixa_oportunidade_cta IS 'Rótulo do botão; padrão no front: Saiba mais.';
