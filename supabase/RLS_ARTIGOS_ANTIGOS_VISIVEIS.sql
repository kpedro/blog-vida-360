-- ============================================
-- RLS: Permitir que artigos apareçam na listagem
-- Blog Vida 360º - OBRIGATÓRIO executar no SQL Editor do Supabase
-- ============================================
-- Sem isso, a listagem pode vir vazia (só posts com status = 'published').
-- Este script: qualquer visitante pode LER posts que não sejam draft/private.
-- ============================================

-- Remover políticas antigas de SELECT (podem ter nomes diferentes)
DROP POLICY IF EXISTS "Blog360: Posts publicados visíveis a todos" ON public.blog360_posts;
DROP POLICY IF EXISTS "Blog360: Posts visíveis exceto draft/private" ON public.blog360_posts;

-- Criar política: visível quem não for draft nem private (inclui status null e published)
CREATE POLICY "Blog360: Posts visíveis exceto draft/private"
    ON public.blog360_posts FOR SELECT
    USING ( COALESCE(status, '') NOT IN ('draft', 'private') );
