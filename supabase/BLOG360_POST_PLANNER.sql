-- ============================================
-- BLOG VIDA 360º — Planejador de postagens (admin)
-- ============================================
-- Execute no SQL Editor do Supabase após outras migrações blog360_*.
-- Idempotente: pode rodar mais de uma vez.
-- ============================================

CREATE OR REPLACE FUNCTION public.blog360_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.blog360_post_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'planned', 'in_progress', 'published', 'skipped')),
  category TEXT NOT NULL DEFAULT 'geral',
  title TEXT NOT NULL DEFAULT '',
  idea TEXT NOT NULL DEFAULT '',
  narrative_beat TEXT NOT NULL DEFAULT '',
  planned_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  linked_article_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog360_post_plan_user_sort
  ON public.blog360_post_plan_items (user_id, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_blog360_post_plan_user_status
  ON public.blog360_post_plan_items (user_id, status);

COMMENT ON TABLE public.blog360_post_plan_items IS 'Fila editorial / fio narrativo no painel admin do blog';

-- Trigger updated_at (função blog360_updated_at em BLOG360_SITE_SETTINGS.sql ou TABELAS_COMPLETO)
DROP TRIGGER IF EXISTS trg_blog360_post_plan_updated ON public.blog360_post_plan_items;
CREATE TRIGGER trg_blog360_post_plan_updated
  BEFORE UPDATE ON public.blog360_post_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.blog360_updated_at();

ALTER TABLE public.blog360_post_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog360_post_plan: select own" ON public.blog360_post_plan_items;
CREATE POLICY "blog360_post_plan: select own"
  ON public.blog360_post_plan_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog360_post_plan: insert own" ON public.blog360_post_plan_items;
CREATE POLICY "blog360_post_plan: insert own"
  ON public.blog360_post_plan_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog360_post_plan: update own" ON public.blog360_post_plan_items;
CREATE POLICY "blog360_post_plan: update own"
  ON public.blog360_post_plan_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog360_post_plan: delete own" ON public.blog360_post_plan_items;
CREATE POLICY "blog360_post_plan: delete own"
  ON public.blog360_post_plan_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
