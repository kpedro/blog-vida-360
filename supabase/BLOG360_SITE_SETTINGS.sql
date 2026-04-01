-- ============================================
-- BLOG VIDA 360º – Configurações do site (banner global na home)
-- ============================================
-- Execute no SQL Editor do Supabase (pode rodar mais de uma vez).
-- A função abaixo também existe em BLOG360_TABELAS_COMPLETO.sql; aqui
-- garantimos que o trigger de updated_at funcione se você rodar só este arquivo.
-- ============================================

CREATE OR REPLACE FUNCTION public.blog360_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.blog360_site_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  produto_banner_ativo BOOLEAN NOT NULL DEFAULT false,
  produto_banner_imagem_url TEXT,
  produto_banner_link TEXT,
  produto_banner_titulo TEXT,
  produto_banner_legenda TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.blog360_site_settings (id, produto_banner_ativo)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS blog360_site_settings_updated_at ON public.blog360_site_settings;
CREATE TRIGGER blog360_site_settings_updated_at
  BEFORE UPDATE ON public.blog360_site_settings
  FOR EACH ROW EXECUTE FUNCTION public.blog360_updated_at();

ALTER TABLE public.blog360_site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog360_site_settings_select_public" ON public.blog360_site_settings;
CREATE POLICY "blog360_site_settings_select_public"
  ON public.blog360_site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "blog360_site_settings_all_authenticated" ON public.blog360_site_settings;
CREATE POLICY "blog360_site_settings_all_authenticated"
  ON public.blog360_site_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
