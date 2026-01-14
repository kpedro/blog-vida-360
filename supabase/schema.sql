-- ============================================
-- Schema Supabase - Blog Vida 360º
-- ============================================
-- Este arquivo contém todas as tabelas necessárias
-- Execute no SQL Editor do Supabase

-- ============================================
-- 1. TABELA: leads
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
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
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_ativo ON leads(ativo);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- ============================================
-- 2. TABELA: posts
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
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
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_publicado ON posts(publicado);
CREATE INDEX IF NOT EXISTS idx_posts_categoria ON posts(categoria);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);

-- ============================================
-- 3. TABELA: affiliate_links
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_links (
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
CREATE INDEX IF NOT EXISTS idx_affiliate_links_ativo ON affiliate_links(ativo);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_categoria ON affiliate_links(categoria);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_destacado ON affiliate_links(destacado);

-- ============================================
-- 4. TABELA: email_campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
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
CREATE INDEX IF NOT EXISTS idx_email_campaigns_tipo ON email_campaigns(tipo);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_enviado_em ON email_campaigns(enviado_em);

-- ============================================
-- 5. TABELA: analytics
-- ============================================
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento TEXT NOT NULL, -- 'page_view', 'click', 'form_submit', 'email_open', 'email_click'
  pagina TEXT,
  user_id UUID,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_analytics_evento ON analytics(evento);
CREATE INDEX IF NOT EXISTS idx_analytics_pagina ON analytics(pagina);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);

-- ============================================
-- 6. TABELA: newsletter_subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'
  fonte TEXT, -- 'form_topo', 'form_meio', 'popup', etc.
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_newsletter_lead_id ON newsletter_subscriptions(lead_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriptions(status);

-- ============================================
-- 7. FUNÇÕES: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON affiliate_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. RLS (Row Level Security)
-- ============================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir leitura pública de posts publicados
CREATE POLICY "Posts públicos são visíveis a todos"
  ON posts FOR SELECT
  USING (publicado = true);

-- Políticas: Permitir leitura pública de links ativos
CREATE POLICY "Links ativos são visíveis a todos"
  ON affiliate_links FOR SELECT
  USING (ativo = true);

-- Políticas: Permitir inserção de leads (qualquer um pode se inscrever)
CREATE POLICY "Qualquer um pode criar lead"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Políticas: Permitir inserção de analytics
CREATE POLICY "Qualquer um pode registrar analytics"
  ON analytics FOR INSERT
  WITH CHECK (true);

-- Políticas: Permitir inserção de newsletter subscriptions
CREATE POLICY "Qualquer um pode se inscrever na newsletter"
  ON newsletter_subscriptions FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 9. VIEWS ÚTEIS
-- ============================================
-- View: Estatísticas de leads
CREATE OR REPLACE VIEW vw_lead_stats AS
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as leads_30d,
  COUNT(*) FILTER (WHERE ativo = true) as leads_ativos,
  AVG(score) as score_medio
FROM leads;

-- View: Estatísticas de posts
CREATE OR REPLACE VIEW vw_post_stats AS
SELECT 
  COUNT(*) FILTER (WHERE publicado = true) as posts_publicados,
  SUM(views) as total_views,
  AVG(views) as media_views
FROM posts;

-- View: Top produtos (afiliados)
CREATE OR REPLACE VIEW vw_top_products AS
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
FROM affiliate_links
WHERE ativo = true
ORDER BY clicks DESC
LIMIT 10;

-- ============================================
-- FIM DO SCHEMA
-- ============================================
