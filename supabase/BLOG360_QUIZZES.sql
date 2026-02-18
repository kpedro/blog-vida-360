-- ============================================
-- Quizzes para o blog (criar/editar no admin, exibir no blog)
-- Blog Vida 360º - Lógica: maioria A / B / C
-- ============================================

-- Quiz (título, slug, ativo)
CREATE TABLE IF NOT EXISTS public.blog360_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perguntas (uma por vez, ordem)
CREATE TABLE IF NOT EXISTS public.blog360_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.blog360_quizzes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opções por pergunta (sempre 3: A, B, C)
CREATE TABLE IF NOT EXISTS public.blog360_quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.blog360_quiz_questions(id) ON DELETE CASCADE,
  option_letter TEXT NOT NULL CHECK (option_letter IN ('A','B','C')),
  option_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, option_letter)
);

-- Resultados por letra (A, B, C) – título e mensagem
CREATE TABLE IF NOT EXISTS public.blog360_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.blog360_quizzes(id) ON DELETE CASCADE,
  result_letter TEXT NOT NULL CHECK (result_letter IN ('A','B','C')),
  title TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, result_letter)
);

CREATE INDEX IF NOT EXISTS idx_blog360_quizzes_slug ON public.blog360_quizzes(slug);
CREATE INDEX IF NOT EXISTS idx_blog360_quizzes_active ON public.blog360_quizzes(active);
CREATE INDEX IF NOT EXISTS idx_blog360_quiz_questions_quiz ON public.blog360_quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_blog360_quiz_options_question ON public.blog360_quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_blog360_quiz_results_quiz ON public.blog360_quiz_results(quiz_id);

-- RLS
ALTER TABLE public.blog360_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog360_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog360_quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog360_quiz_results ENABLE ROW LEVEL SECURITY;

-- Leitores: só quizzes ativos
DROP POLICY IF EXISTS "Blog360: Quizzes ativos visíveis" ON public.blog360_quizzes;
CREATE POLICY "Blog360: Quizzes ativos visíveis"
  ON public.blog360_quizzes FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Blog360: Perguntas visíveis se quiz ativo" ON public.blog360_quiz_questions;
CREATE POLICY "Blog360: Perguntas visíveis se quiz ativo"
  ON public.blog360_quiz_questions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.blog360_quizzes q WHERE q.id = quiz_id AND q.active = true)
  );

DROP POLICY IF EXISTS "Blog360: Opções visíveis" ON public.blog360_quiz_options;
CREATE POLICY "Blog360: Opções visíveis"
  ON public.blog360_quiz_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog360_quiz_questions qq
      JOIN public.blog360_quizzes q ON q.id = qq.quiz_id
      WHERE qq.id = question_id AND q.active = true
    )
  );

DROP POLICY IF EXISTS "Blog360: Resultados visíveis" ON public.blog360_quiz_results;
CREATE POLICY "Blog360: Resultados visíveis"
  ON public.blog360_quiz_results FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.blog360_quizzes q WHERE q.id = quiz_id AND q.active = true)
  );

-- Admin (autenticado) gerencia tudo
DROP POLICY IF EXISTS "Blog360: Admin gerencia quizzes" ON public.blog360_quizzes;
CREATE POLICY "Blog360: Admin gerencia quizzes"
  ON public.blog360_quizzes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Blog360: Admin gerencia perguntas" ON public.blog360_quiz_questions;
CREATE POLICY "Blog360: Admin gerencia perguntas"
  ON public.blog360_quiz_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Blog360: Admin gerencia opções" ON public.blog360_quiz_options;
CREATE POLICY "Blog360: Admin gerencia opções"
  ON public.blog360_quiz_options FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Blog360: Admin gerencia resultados" ON public.blog360_quiz_results;
CREATE POLICY "Blog360: Admin gerencia resultados"
  ON public.blog360_quiz_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE public.blog360_quizzes IS 'Quizzes do blog (ex.: suplementação); criados no admin.';
COMMENT ON TABLE public.blog360_quiz_questions IS 'Perguntas de cada quiz (ordem + texto).';
COMMENT ON TABLE public.blog360_quiz_options IS 'Opções A/B/C por pergunta.';
COMMENT ON TABLE public.blog360_quiz_results IS 'Resultado por maioria A, B ou C (título + mensagem).';
