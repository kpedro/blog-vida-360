-- Histórico da Central de marketing (Blog Vida 360º)
-- Execute no SQL Editor do Supabase após autenticação admin estar ativa.

CREATE TABLE IF NOT EXISTS public.blog360_marketing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT,
  prompt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog360_marketing_history_user_created
  ON public.blog360_marketing_history (user_id, created_at DESC);

ALTER TABLE public.blog360_marketing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog360_marketing: select own" ON public.blog360_marketing_history;
CREATE POLICY "blog360_marketing: select own"
  ON public.blog360_marketing_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog360_marketing: insert own" ON public.blog360_marketing_history;
CREATE POLICY "blog360_marketing: insert own"
  ON public.blog360_marketing_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog360_marketing: delete own" ON public.blog360_marketing_history;
CREATE POLICY "blog360_marketing: delete own"
  ON public.blog360_marketing_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.blog360_marketing_history IS 'Histórico da Central de marketing (copy gerada ou guardada manualmente)';
