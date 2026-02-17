-- ============================================
-- Migração: blog360_posts para o editor de artigos
-- Blog Vida 360º - Execute no SQL Editor do Supabase
-- ============================================
-- Garante tabela blog360_posts com colunas usadas pelo editor:
-- titulo, slug, conteudo, resumo, categoria, tags, imagem_destaque, autor, status, published_at
-- ============================================

-- Criar tabela se não existir (compatível com editor)
CREATE TABLE IF NOT EXISTS public.blog360_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    conteudo TEXT NOT NULL DEFAULT '',
    resumo TEXT,
    categoria TEXT NOT NULL DEFAULT 'artigo',
    tags TEXT[] DEFAULT '{}',
    imagem_destaque TEXT,
    autor TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    visualizacoes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_blog360_posts_status ON public.blog360_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_slug ON public.blog360_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_categoria ON public.blog360_posts(categoria);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_published_at ON public.blog360_posts(published_at DESC);

-- Se a tabela já existir com colunas antigas (conteudo_markdown, publicado), adicionar as novas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog360_posts' AND column_name = 'conteudo') THEN
        ALTER TABLE public.blog360_posts ADD COLUMN IF NOT EXISTS conteudo TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog360_posts' AND column_name = 'autor') THEN
        ALTER TABLE public.blog360_posts ADD COLUMN IF NOT EXISTS autor TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog360_posts' AND column_name = 'status') THEN
        ALTER TABLE public.blog360_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog360_posts' AND column_name = 'slug') THEN
        ALTER TABLE public.blog360_posts ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
    END IF;
END $$;

-- RLS
ALTER TABLE public.blog360_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog360: Posts publicados visíveis a todos" ON public.blog360_posts;
CREATE POLICY "Blog360: Posts publicados visíveis a todos"
    ON public.blog360_posts FOR SELECT
    USING (status = 'published');

DROP POLICY IF EXISTS "Blog360: Autenticados gerenciam posts" ON public.blog360_posts;
CREATE POLICY "Blog360: Autenticados gerenciam posts"
    ON public.blog360_posts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.blog360_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blog360_posts_updated_at ON public.blog360_posts;
CREATE TRIGGER trigger_blog360_posts_updated_at
    BEFORE UPDATE ON public.blog360_posts
    FOR EACH ROW EXECUTE PROCEDURE public.blog360_posts_updated_at();
