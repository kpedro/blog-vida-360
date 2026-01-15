-- ============================================
-- TABELAS PARA PAINEL ADMINISTRATIVO
-- Blog Vida 360º
-- ============================================

-- 1. Tabela de Posts/Artigos
CREATE TABLE IF NOT EXISTS blog360_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    author TEXT DEFAULT 'Kadson Pedro',
    excerpt TEXT,
    tags TEXT,
    image_url TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    views INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON blog360_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON blog360_posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON blog360_posts(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON blog360_posts(slug);

-- 2. Tabela de Campanhas de Email
CREATE TABLE IF NOT EXISTS blog360_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    preheader TEXT,
    sender_name TEXT DEFAULT 'Vida 360º',
    sender_email TEXT DEFAULT 'contato@vida360.com',
    segment TEXT NOT NULL,
    template TEXT DEFAULT 'newsletter',
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
    recipients_count INTEGER DEFAULT 0,
    opens_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para campanhas
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON blog360_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_sent_at ON blog360_campaigns(sent_at DESC NULLS LAST);

-- 3. Tabela de Analytics (opcional - para tracking detalhado)
CREATE TABLE IF NOT EXISTS blog360_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'page_view', 'post_view', 'email_open', 'email_click', 'form_submit'
    event_data JSONB,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON blog360_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON blog360_analytics(created_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_analytics_user_email ON blog360_analytics(user_email);

-- 4. Atualizar tabela de leads (se ainda não existir)
CREATE TABLE IF NOT EXISTS blog360_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    nome TEXT,
    origem TEXT, -- 'popup', 'form_topo', 'form_rodape', etc
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON blog360_leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON blog360_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON blog360_leads(created_at DESC NULLS LAST);

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE blog360_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog360_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog360_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog360_leads ENABLE ROW LEVEL SECURITY;

-- Políticas para Posts
-- Leitura pública apenas de posts publicados
DROP POLICY IF EXISTS "Posts publicados são públicos" ON blog360_posts;
CREATE POLICY "Posts publicados são públicos"
    ON blog360_posts FOR SELECT
    USING (status = 'published');

-- Admin pode fazer tudo (substitua pelo email do admin)
DROP POLICY IF EXISTS "Admin pode gerenciar posts" ON blog360_posts;
CREATE POLICY "Admin pode gerenciar posts"
    ON blog360_posts FOR ALL
    USING (auth.jwt() ->> 'email' = 'seu-email@exemplo.com');

DROP POLICY IF EXISTS "Admin pode gerenciar campanhas" ON blog360_campaigns;
-- Políticas para Campanhas
-- Apenas admin pode ver e gerenciar campanhas
CREATE POLICY "Admin pode gerenciar campanhas"
    ON blog360_campaigns FOR ALL
    USING (auth.jwt() ->> 'email' = 'seu-email@exemplo.com');
DROP POLICY IF EXISTS "Qualquer um pode se inscrever" ON blog360_leads;
CREATE POLICY "Qualquer um pode se inscrever"
    ON blog360_leads FOR INSERT
    WITH CHECK (true);

-- Admin pode ver e gerenciar todos os leads
DROP POLICY IF EXISTS "Admin pode gerenciar leads" ON blog360_leads;
    WITH CHECK (true);

-- Admin pode ver e gerenciar todos os leads
CREATE POLICY "Admin pode gerenciar leads"
DROP POLICY IF EXISTS "Qualquer um pode registrar eventos" ON blog360_analytics;
CREATE POLICY "Qualquer um pode registrar eventos"
    ON blog360_analytics FOR INSERT
    WITH CHECK (true);

-- Admin pode ver analytics
DROP POLICY IF EXISTS "Admin pode ver analytics" ON blog360_analytics;ng)
CREATE POLICY "Qualquer um pode registrar eventos"
    ON blog360_analytics FOR INSERT
    WITH CHECK (true);

-- Admin pode ver analytics
CREATE POLICY "Admin pode ver analytics"
    ON blog360_analytics FOR SELECT
    USING (auth.jwt() ->> 'email' = 'seu-email@exemplo.com');

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
DROP TRIGGER IF EXISTS update_posts_updated_at ON blog360_posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON blog360_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON blog360_campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON blog360_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON blog360_leads;
-- Triggers para atualizar updated_at
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON blog360_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON blog360_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON blog360_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de estatísticas gerais
CREATE OR REPLACE VIEW blog360_stats AS
SELECT
    (SELECT COUNT(*) FROM blog360_leads WHERE status = 'active') as total_leads,
    (SELECT COUNT(*) FROM blog360_posts WHERE status = 'published') as total_posts,
    (SELECT COUNT(*) FROM blog360_campaigns WHERE status = 'sent') as total_campaigns,
    (SELECT COALESCE(AVG((opens_count::float / NULLIF(recipients_count, 0)) * 100), 0) 
     FROM blog360_campaigns WHERE status = 'sent') as avg_open_rate;

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Inserir alguns posts de exemplo (opcional)
INSERT INTO blog360_posts (title, slug, category, excerpt, content, status, published_at, image_url)
VALUES 
(
    'Como Cuidar da Saúde Mental no Dia a Dia',
    'como-cuidar-da-saude-mental-no-dia-a-dia',
    'saude',
    'Descubra práticas simples para manter a saúde mental em equilíbrio.',
    '<h2>Introdução</h2><p>A saúde mental é tão importante quanto a saúde física...</p>',
    'published',
    NOW(),
    'assets/images/saude-mental.jpg'
),
(
    '7 Hábitos de Pessoas Altamente Produtivas',
    '7-habitos-de-pessoas-altamente-produtivas',
    'produtividade',
    'Aprenda os hábitos que pessoas produtivas praticam diariamente.',
    '<h2>Os 7 Hábitos</h2><p>Pessoas produtivas têm rotinas específicas...</p>',
    'published',
    NOW(),
    'assets/images/produtividade.jpg'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

/*
COMO USAR ESTE SCRIPT:

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "SQL Editor"
4. Cole este script completo
5. IMPORTANTE: Substitua 'seu-email@exemplo.com' pelo seu email de admin
6. Clique em "Run" para executar

APÓS EXECUTAR:
- Todas as tabelas serão criadas
- As políticas RLS estarão configuradas
- O painel admin estará pronto para uso

SEGURANÇA:
- Apenas usuários autenticados com o email especificado podem acessar o admin
- Posts publicados são públicos
- Leads podem se inscrever publicamente
- Analytics são registrados publicamente mas só admin pode ver

PRÓXIMOS PASSOS:
1. Faça login no admin-login.html
2. Acesse admin-dashboard.html
3. Comece a criar artigos e campanhas!
*/
