-- ============================================
-- CORRIGIR POLÍTICAS RLS - blog360_leads
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE public.blog360_leads ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Blog360: Qualquer um pode criar lead" ON public.blog360_leads;
DROP POLICY IF EXISTS "Blog360: Leads podem ver seus próprios dados" ON public.blog360_leads;
DROP POLICY IF EXISTS "Blog360: Public read leads" ON public.blog360_leads;

-- 3. Criar política de INSERT (permite qualquer um criar lead)
CREATE POLICY "Blog360: Qualquer um pode criar lead"
  ON public.blog360_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Criar política de SELECT (permite qualquer um ler leads - opcional, para verificação)
-- Se você não quiser que qualquer um veja os leads, remova esta política
CREATE POLICY "Blog360: Qualquer um pode ler leads"
  ON public.blog360_leads
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'blog360_leads'
ORDER BY policyname;

-- ============================================
-- TESTE MANUAL (opcional)
-- ============================================
-- Descomente para testar se a inserção funciona:
-- INSERT INTO public.blog360_leads (email, origem, ativo)
-- VALUES ('teste-rls@exemplo.com', 'teste', true)
-- RETURNING *;
