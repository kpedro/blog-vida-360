-- ============================================
-- SETUP DO PAINEL ADMINISTRATIVO
-- Blog Vida 360º
-- ============================================

-- 1. Criar tabela de posts (se não existir)
CREATE TABLE IF NOT EXISTS blog360_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    conteudo TEXT NOT NULL,
    resumo TEXT,
    categoria TEXT NOT NULL,
    tags TEXT[],
    imagem_destaque TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'published'
    autor_id UUID REFERENCES auth.users(id),
    visualizacoes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- 2. Criar tabela de campanhas de email
CREATE TABLE IF NOT EXISTS blog360_email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    assunto TEXT NOT NULL,
    conteudo_html TEXT NOT NULL,
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sent'
    destinatarios INTEGER DEFAULT 0,
    enviados INTEGER DEFAULT 0,
    aberturas INTEGER DEFAULT 0,
    cliques INTEGER DEFAULT 0,
    taxa_abertura DECIMAL(5,2) DEFAULT 0,
    taxa_clique DECIMAL(5,2) DEFAULT 0,
    agendado_para TIMESTAMP WITH TIME ZONE,
    enviado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Criar tabela de estatísticas de campanhas
CREATE TABLE IF NOT EXISTS blog360_campaign_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES blog360_email_campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES blog360_leads(id) ON DELETE CASCADE,
    enviado BOOLEAN DEFAULT FALSE,
    aberto BOOLEAN DEFAULT FALSE,
    clicado BOOLEAN DEFAULT FALSE,
    data_envio TIMESTAMP WITH TIME ZONE,
    data_abertura TIMESTAMP WITH TIME ZONE,
    data_clique TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Adicionar colunas à tabela de leads (se não existirem)
DO $$ 
BEGIN
    -- Verificar se a tabela blog360_leads existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog360_leads') THEN
        
        -- Adicionar coluna status se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name='blog360_leads' AND column_name='status') THEN
            ALTER TABLE blog360_leads ADD COLUMN status TEXT DEFAULT 'active';
            RAISE NOTICE '✅ Coluna status adicionada à tabela blog360_leads';
        ELSE
            RAISE NOTICE 'ℹ️  Coluna status já existe na tabela blog360_leads';
        END IF;
        
        -- Adicionar coluna total_emails_enviados se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name='blog360_leads' AND column_name='total_emails_enviados') THEN
            ALTER TABLE blog360_leads ADD COLUMN total_emails_enviados INTEGER DEFAULT 0;
            RAISE NOTICE '✅ Coluna total_emails_enviados adicionada à tabela blog360_leads';
        ELSE
            RAISE NOTICE 'ℹ️  Coluna total_emails_enviados já existe na tabela blog360_leads';
        END IF;
        
        -- Adicionar coluna total_emails_abertos se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name='blog360_leads' AND column_name='total_emails_abertos') THEN
            ALTER TABLE blog360_leads ADD COLUMN total_emails_abertos INTEGER DEFAULT 0;
            RAISE NOTICE '✅ Coluna total_emails_abertos adicionada à tabela blog360_leads';
        ELSE
            RAISE NOTICE 'ℹ️  Coluna total_emails_abertos já existe na tabela blog360_leads';
        END IF;
        
    ELSE
        RAISE NOTICE '⚠️  Tabela blog360_leads não encontrada. Execute primeiro o script de criação das tabelas base.';
    END IF;
END $$;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON blog360_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON blog360_posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_categoria ON blog360_posts(categoria);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON blog360_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON blog360_email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON blog360_email_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_stats_campaign ON blog360_campaign_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_lead ON blog360_campaign_stats(lead_id);

-- 6. RLS (Row Level Security) para posts
ALTER TABLE blog360_posts ENABLE ROW LEVEL SECURITY;

-- Políticas para posts
DROP POLICY IF EXISTS "Posts públicos são visíveis para todos" ON blog360_posts;
CREATE POLICY "Posts públicos são visíveis para todos"
    ON blog360_posts FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

DROP POLICY IF EXISTS "Admins podem inserir posts" ON blog360_posts;
CREATE POLICY "Admins podem inserir posts"
    ON blog360_posts FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins podem atualizar posts" ON blog360_posts;
CREATE POLICY "Admins podem atualizar posts"
    ON blog360_posts FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins podem deletar posts" ON blog360_posts;
CREATE POLICY "Admins podem deletar posts"
    ON blog360_posts FOR DELETE
    TO authenticated
    USING (true);

-- 7. RLS para campanhas (apenas admins autenticados)
ALTER TABLE blog360_email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas admins veem campanhas" ON blog360_email_campaigns;
CREATE POLICY "Apenas admins veem campanhas"
    ON blog360_email_campaigns FOR ALL
    TO authenticated
    USING (true);

-- 8. RLS para estatísticas de campanhas
ALTER TABLE blog360_campaign_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas admins veem stats" ON blog360_campaign_stats;
CREATE POLICY "Apenas admins veem stats"
    ON blog360_campaign_stats FOR ALL
    TO authenticated
    USING (true);

-- 9. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger para posts
DROP TRIGGER IF EXISTS update_blog360_posts_updated_at ON blog360_posts;
CREATE TRIGGER update_blog360_posts_updated_at
    BEFORE UPDATE ON blog360_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Função para contar visualizações
CREATE OR REPLACE FUNCTION increment_post_views(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE blog360_posts
    SET visualizacoes = visualizacoes + 1
    WHERE slug = post_slug;
END;
$$ LANGUAGE plpgsql;

-- 12. View para estatísticas de campanhas
CREATE OR REPLACE VIEW blog360_campaign_overview AS
SELECT 
    c.id,
    c.nome,
    c.assunto,
    c.status,
    c.destinatarios,
    c.enviados,
    c.aberturas,
    c.cliques,
    CASE 
        WHEN c.enviados > 0 THEN ROUND((c.aberturas::DECIMAL / c.enviados) * 100, 2)
        ELSE 0
    END as taxa_abertura_calc,
    CASE 
        WHEN c.enviados > 0 THEN ROUND((c.cliques::DECIMAL / c.enviados) * 100, 2)
        ELSE 0
    END as taxa_clique_calc,
    c.created_at,
    c.enviado_em
FROM blog360_email_campaigns c
ORDER BY c.created_at DESC;

-- ============================================
-- VERIFICAÇÕES E MENSAGENS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Setup do painel administrativo concluído!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tabelas criadas:';
    RAISE NOTICE '   - blog360_posts (postagens)';
    RAISE NOTICE '   - blog360_email_campaigns (campanhas)';
    RAISE NOTICE '   - blog360_campaign_stats (estatísticas)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS configurado para todas as tabelas';
    RAISE NOTICE '⚡ Índices criados para melhor performance';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Próximos passos:';
    RAISE NOTICE '   1. Crie um usuário admin no Supabase Authentication';
    RAISE NOTICE '   2. Acesse admin-login.html no seu blog';
    RAISE NOTICE '   3. Faça login com as credenciais do admin';
END $$;
