-- ============================================
-- BLOG VIDA 360º - Todas as tabelas (um único projeto Supabase)
-- ============================================
-- Use apenas o prefixo blog360_ para não interferir em outros apps.
-- Execute no SQL Editor do Supabase (Project Settings > SQL Editor).
-- Pode rodar mais de uma vez (usa IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================

-- ============================================
-- 1. blog360_leads (newsletter / formulário do blog)
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  interesses TEXT[] DEFAULT '{}',
  score INTEGER DEFAULT 0,
  origem TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog360_leads_email ON public.blog360_leads(email);
CREATE INDEX IF NOT EXISTS idx_blog360_leads_created_at ON public.blog360_leads(created_at);

-- ============================================
-- 2. blog360_posts (artigos do editor)
-- ============================================
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_status ON public.blog360_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_slug ON public.blog360_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_categoria ON public.blog360_posts(categoria);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_published_at ON public.blog360_posts(published_at DESC);

-- Se a tabela já existir com colunas antigas, adicionar as que faltam
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog360_posts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog360_posts' AND column_name = 'conteudo') THEN
      ALTER TABLE public.blog360_posts ADD COLUMN conteudo TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog360_posts' AND column_name = 'autor') THEN
      ALTER TABLE public.blog360_posts ADD COLUMN autor TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blog360_posts' AND column_name = 'status') THEN
      ALTER TABLE public.blog360_posts ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. blog360_campaigns (campanhas de email - admin)
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  sender_name TEXT,
  sender_email TEXT,
  segment TEXT,
  template TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog360_campaigns_status ON public.blog360_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_blog360_campaigns_sent_at ON public.blog360_campaigns(sent_at DESC);

-- ============================================
-- 4. blog360_analytics (eventos opcionais)
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento TEXT NOT NULL,
  pagina TEXT,
  user_id UUID,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog360_analytics_evento ON public.blog360_analytics(evento);
CREATE INDEX IF NOT EXISTS idx_blog360_analytics_created_at ON public.blog360_analytics(created_at);

-- ============================================
-- 5. blog360_newsletter_subscriptions (inscrições)
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.blog360_leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  fonte TEXT,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog360_newsletter_lead_id ON public.blog360_newsletter_subscriptions(lead_id);

-- ============================================
-- 6. blog360_affiliate_links (opcional - links de afiliados)
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  produto_nome TEXT NOT NULL,
  categoria TEXT,
  descricao TEXT,
  imagem_url TEXT,
  preco DECIMAL(10, 2),
  moeda TEXT DEFAULT 'BRL',
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog360_affiliate_links_ativo ON public.blog360_affiliate_links(ativo);

-- ============================================
-- 7. Função e triggers updated_at (apenas tabelas blog360_)
-- ============================================
CREATE OR REPLACE FUNCTION public.blog360_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog360_leads_updated_at ON public.blog360_leads;
CREATE TRIGGER blog360_leads_updated_at BEFORE UPDATE ON public.blog360_leads
  FOR EACH ROW EXECUTE FUNCTION public.blog360_updated_at();

DROP TRIGGER IF EXISTS blog360_posts_updated_at ON public.blog360_posts;
CREATE TRIGGER blog360_posts_updated_at BEFORE UPDATE ON public.blog360_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog360_updated_at();

DROP TRIGGER IF EXISTS blog360_campaigns_updated_at ON public.blog360_campaigns;
CREATE TRIGGER blog360_campaigns_updated_at BEFORE UPDATE ON public.blog360_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.blog360_updated_at();

DROP TRIGGER IF EXISTS blog360_affiliate_links_updated_at ON public.blog360_affiliate_links;
CREATE TRIGGER blog360_affiliate_links_updated_at BEFORE UPDATE ON public.blog360_affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.blog360_updated_at();

-- ============================================
-- 8. RLS (Row Level Security) – só tabelas blog360_*
-- ============================================
ALTER TABLE public.blog360_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog360_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog360_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog360_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog360_newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog360_affiliate_links ENABLE ROW LEVEL SECURITY;

-- Leads: qualquer um pode inserir (formulário público)
DROP POLICY IF EXISTS "blog360_leads_insert" ON public.blog360_leads;
CREATE POLICY "blog360_leads_insert" ON public.blog360_leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "blog360_leads_select_authenticated" ON public.blog360_leads;
CREATE POLICY "blog360_leads_select_authenticated" ON public.blog360_leads FOR SELECT TO authenticated USING (true);

-- Posts: leitura pública só publicados; autenticados gerenciam
DROP POLICY IF EXISTS "blog360_posts_select_published" ON public.blog360_posts;
CREATE POLICY "blog360_posts_select_published" ON public.blog360_posts FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "blog360_posts_all_authenticated" ON public.blog360_posts;
CREATE POLICY "blog360_posts_all_authenticated" ON public.blog360_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Campanhas: só autenticados
DROP POLICY IF EXISTS "blog360_campaigns_authenticated" ON public.blog360_campaigns;
CREATE POLICY "blog360_campaigns_authenticated" ON public.blog360_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Analytics: qualquer um pode inserir
DROP POLICY IF EXISTS "blog360_analytics_insert" ON public.blog360_analytics;
CREATE POLICY "blog360_analytics_insert" ON public.blog360_analytics FOR INSERT WITH CHECK (true);

-- Newsletter: inserir e ler (autenticados leem)
DROP POLICY IF EXISTS "blog360_newsletter_insert" ON public.blog360_newsletter_subscriptions;
CREATE POLICY "blog360_newsletter_insert" ON public.blog360_newsletter_subscriptions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "blog360_newsletter_select_authenticated" ON public.blog360_newsletter_subscriptions;
CREATE POLICY "blog360_newsletter_select_authenticated" ON public.blog360_newsletter_subscriptions FOR SELECT TO authenticated USING (true);

-- Afiliados: leitura pública só ativos
DROP POLICY IF EXISTS "blog360_affiliate_select" ON public.blog360_affiliate_links;
CREATE POLICY "blog360_affiliate_select" ON public.blog360_affiliate_links FOR SELECT USING (ativo = true);

-- ============================================
-- FIM – Apenas objetos blog360_ foram criados
-- ============================================
