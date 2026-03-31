-- Histórico do Estúdio de conteúdo (Blog Vida 360º)
-- Execute no SQL Editor do Supabase do projeto do blog após deploy das Edge Functions.

CREATE TABLE IF NOT EXISTS public.blog360_studio_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('landing', 'social_post', 'article_copy')),
  prompt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  image_suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog360_studio_history_user_created
  ON public.blog360_studio_history (user_id, created_at DESC);

ALTER TABLE public.blog360_studio_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog360_studio: usuário vê o próprio histórico" ON public.blog360_studio_history;
CREATE POLICY "blog360_studio: usuário vê o próprio histórico"
  ON public.blog360_studio_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog360_studio: usuário insere o próprio histórico" ON public.blog360_studio_history;
CREATE POLICY "blog360_studio: usuário insere o próprio histórico"
  ON public.blog360_studio_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog360_studio: usuário remove o próprio histórico" ON public.blog360_studio_history;
CREATE POLICY "blog360_studio: usuário remove o próprio histórico"
  ON public.blog360_studio_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.blog360_studio_history IS 'Gerações do Estúdio de conteúdo (admin blog)';
