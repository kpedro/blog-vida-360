-- ============================================
-- Schema Supabase - Blog Vida 360º
-- ============================================
-- ⚠️ IMPORTANTE: Este schema usa prefixo "blog360_" para evitar conflitos
-- com outros projetos no mesmo Supabase
-- Execute no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. TABELA: blog360_leads
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  interesses TEXT[] DEFAULT '{}',
  score INTEGER DEFAULT 0,
  origem TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_blog360_leads_email ON public.blog360_leads(email);
CREATE INDEX IF NOT EXISTS idx_blog360_leads_ativo ON public.blog360_leads(ativo);
CREATE INDEX IF NOT EXISTS idx_blog360_leads_created_at ON public.blog360_leads(created_at);

-- ============================================
-- 2. TABELA: blog360_posts
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  conteudo_markdown TEXT NOT NULL,
  resumo TEXT,
  categoria TEXT,
  tags TEXT[] DEFAULT '{}',
  meta_description TEXT,
  meta_keywords TEXT[] DEFAULT '{}',
  tempo_leitura INTEGER,
  imagem_destaque TEXT,
  publicado BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_blog360_posts_slug ON public.blog360_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_publicado ON public.blog360_posts(publicado);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_categoria ON public.blog360_posts(categoria);
CREATE INDEX IF NOT EXISTS idx_blog360_posts_published_at ON public.blog360_posts(published_at);

-- ============================================
-- 3. TABELA: blog360_affiliate_links
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  produto_nome TEXT NOT NULL,
  categoria TEXT,
  descricao TEXT,
  imagem_url TEXT,
  preco DECIMAL(10, 2),
  moeda TEXT DEFAULT 'BRL',
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  receita_total DECIMAL(10, 2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  destacado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_blog360_affiliate_links_ativo ON public.blog360_affiliate_links(ativo);
CREATE INDEX IF NOT EXISTS idx_blog360_affiliate_links_categoria ON public.blog360_affiliate_links(categoria);
CREATE INDEX IF NOT EXISTS idx_blog360_affiliate_links_destacado ON public.blog360_affiliate_links(destacado);

-- ============================================
-- 4. TABELA: blog360_email_campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'newsletter', 'nurturing', 'promocional', 're-engajamento'
  template_id TEXT,
  assunto TEXT NOT NULL,
  conteudo_html TEXT,
  segmento TEXT, -- 'todos', 'interesse_bem_estar', etc.
  enviados INTEGER DEFAULT 0,
  entregues INTEGER DEFAULT 0,
  abertos INTEGER DEFAULT 0,
  clicados INTEGER DEFAULT 0,
  rejeitados INTEGER DEFAULT 0,
  enviado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_blog360_email_campaigns_tipo ON public.blog360_email_campaigns(tipo);
CREATE INDEX IF NOT EXISTS idx_blog360_email_campaigns_enviado_em ON public.blog360_email_campaigns(enviado_em);

-- ============================================
-- 5. TABELA: blog360_analytics
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento TEXT NOT NULL, -- 'page_view', 'click', 'form_submit', 'email_open', 'email_click'
  pagina TEXT,
  user_id UUID,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_blog360_analytics_evento ON public.blog360_analytics(evento);
CREATE INDEX IF NOT EXISTS idx_blog360_analytics_pagina ON public.blog360_analytics(pagina);
CREATE INDEX IF NOT EXISTS idx_blog360_analytics_created_at ON public.blog360_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_blog360_analytics_user_id ON public.blog360_analytics(user_id);

-- ============================================
-- 6. TABELA: blog360_newsletter_subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog360_newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.blog360_leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'
  fonte TEXT, -- 'form_topo', 'form_meio', 'popup', etc.
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_blog360_newsletter_lead_id ON public.blog360_newsletter_subscriptions(lead_id);
CREATE INDEX IF NOT EXISTS idx_blog360_newsletter_status ON public.blog360_newsletter_subscriptions(status);

-- ============================================
-- 7. FUNÇÕES: Atualizar updated_at automaticamente
-- ============================================
-- Verificar se função já existe antes de criar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'blog360_update_updated_at_column'
  ) THEN
    CREATE FUNCTION public.blog360_update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  END IF;
END $$;

-- Triggers para updated_at (DROP IF EXISTS para evitar erros)
DROP TRIGGER IF EXISTS update_blog360_leads_updated_at ON public.blog360_leads;
CREATE TRIGGER update_blog360_leads_updated_at 
  BEFORE UPDATE ON public.blog360_leads
  FOR EACH ROW EXECUTE FUNCTION public.blog360_update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog360_posts_updated_at ON public.blog360_posts;
CREATE TRIGGER update_blog360_posts_updated_at 
  BEFORE UPDATE ON public.blog360_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog360_update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog360_affiliate_links_updated_at ON public.blog360_affiliate_links;
CREATE TRIGGER update_blog360_affiliate_links_updated_at 
  BEFORE UPDATE ON public.blog360_affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.blog360_update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog360_email_campaigns_updated_at ON public.blog360_email_campaigns;
CREATE TRIGGER update_blog360_email_campaigns_updated_at 
  BEFORE UPDATE ON public.blog360_email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.blog360_update_updated_at_column();

-- ============================================
-- 8. RLS (Row Level Security)
-- ============================================
-- Habilitar RLS apenas se ainda não estiver habilitado (não afeta outras tabelas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'blog360_leads'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.blog360_leads ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'blog360_posts'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.blog360_posts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'blog360_affiliate_links'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.blog360_affiliate_links ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'blog360_email_campaigns'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.blog360_email_campaigns ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'blog360_analytics'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.blog360_analytics ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'blog360_newsletter_subscriptions'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.blog360_newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Políticas: DROP IF EXISTS antes de criar (evita conflitos)
DROP POLICY IF EXISTS "Blog360: Posts públicos são visíveis a todos" ON public.blog360_posts;
CREATE POLICY "Blog360: Posts públicos são visíveis a todos"
  ON public.blog360_posts FOR SELECT
  USING (publicado = true);

DROP POLICY IF EXISTS "Blog360: Links ativos são visíveis a todos" ON public.blog360_affiliate_links;
CREATE POLICY "Blog360: Links ativos são visíveis a todos"
  ON public.blog360_affiliate_links FOR SELECT
  USING (ativo = true);

DROP POLICY IF EXISTS "Blog360: Qualquer um pode criar lead" ON public.blog360_leads;
CREATE POLICY "Blog360: Qualquer um pode criar lead"
  ON public.blog360_leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Blog360: Qualquer um pode registrar analytics" ON public.blog360_analytics;
CREATE POLICY "Blog360: Qualquer um pode registrar analytics"
  ON public.blog360_analytics FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Blog360: Qualquer um pode se inscrever na newsletter" ON public.blog360_newsletter_subscriptions;
CREATE POLICY "Blog360: Qualquer um pode se inscrever na newsletter"
  ON public.blog360_newsletter_subscriptions FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 9. VIEWS ÚTEIS (com prefixo blog360_)
-- ============================================
-- View: Estatísticas de leads
CREATE OR REPLACE VIEW public.vw_blog360_lead_stats AS
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as leads_30d,
  COUNT(*) FILTER (WHERE ativo = true) as leads_ativos,
  AVG(score) as score_medio
FROM public.blog360_leads;

-- View: Estatísticas de posts
CREATE OR REPLACE VIEW public.vw_blog360_post_stats AS
SELECT 
  COUNT(*) FILTER (WHERE publicado = true) as posts_publicados,
  SUM(views) as total_views,
  AVG(views) as media_views
FROM public.blog360_posts;

-- View: Top produtos (afiliados)
CREATE OR REPLACE VIEW public.vw_blog360_top_products AS
SELECT 
  produto_nome,
  categoria,
  clicks,
  conversions,
  CASE 
    WHEN clicks > 0 THEN (conversions::DECIMAL / clicks * 100) 
    ELSE 0 
  END as taxa_conversao,
  receita_total
FROM public.blog360_affiliate_links
WHERE ativo = true
ORDER BY clicks DESC
LIMIT 10;

-- ============================================
-- FIM DO SCHEMA
-- ============================================
-- ✅ Todas as tabelas, funções, triggers e views usam prefixo "blog360_"
-- ✅ Nenhuma alteração em tabelas existentes de outros projetos
-- ✅ Seguro para executar em Supabase compartilhado
