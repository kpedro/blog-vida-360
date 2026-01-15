-- ============================================
-- SETUP SIMPLES DO PAINEL ADMINISTRATIVO
-- Blog Vida 360º - SEM ERROS
-- ============================================

-- 1. Criar tabela de posts
CREATE TABLE IF NOT EXISTS blog360_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    conteudo TEXT NOT NULL,
    resumo TEXT,
    categoria TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    imagem_destaque TEXT,
    status TEXT DEFAULT 'draft',
    autor_id UUID,
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
    status TEXT DEFAULT 'draft',
    destinatarios INTEGER DEFAULT 0,
    enviados INTEGER DEFAULT 0,
    aberturas INTEGER DEFAULT 0,
    cliques INTEGER DEFAULT 0,
    taxa_abertura DECIMAL(5,2) DEFAULT 0,
    taxa_clique DECIMAL(5,2) DEFAULT 0,
    agendado_para TIMESTAMP WITH TIME ZONE,
    enviado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- 3. Criar tabela de estatísticas de campanhas
CREATE TABLE IF NOT EXISTS blog360_campaign_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID,
    lead_id UUID,
    enviado BOOLEAN DEFAULT FALSE,
    aberto BOOLEAN DEFAULT FALSE,
    clicado BOOLEAN DEFAULT FALSE,
    data_envio TIMESTAMP WITH TIME ZONE,
    data_abertura TIMESTAMP WITH TIME ZONE,
    data_clique TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON blog360_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON blog360_posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_categoria ON blog360_posts(categoria);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON blog360_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON blog360_email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON blog360_email_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_stats_campaign ON blog360_campaign_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_lead ON blog360_campaign_stats(lead_id);

-- 5. Habilitar RLS para posts
ALTER TABLE blog360_posts ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para posts
DROP POLICY IF EXISTS "Posts públicos visíveis" ON blog360_posts;
CREATE POLICY "Posts públicos visíveis"
    ON blog360_posts FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

DROP POLICY IF EXISTS "Admins gerenciam posts" ON blog360_posts;
CREATE POLICY "Admins gerenciam posts"
    ON blog360_posts FOR ALL
    TO authenticated
    USING (true);

-- 7. Habilitar RLS para campanhas
ALTER TABLE blog360_email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas admins veem campanhas" ON blog360_email_campaigns;
CREATE POLICY "Apenas admins veem campanhas"
    ON blog360_email_campaigns FOR ALL
    TO authenticated
    USING (true);

-- 8. Habilitar RLS para estatísticas
ALTER TABLE blog360_campaign_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas admins veem stats" ON blog360_campaign_stats;
CREATE POLICY "Apenas admins veem stats"
    ON blog360_campaign_stats FOR ALL
    TO authenticated
    USING (true);

-- 9. Função para atualizar updated_at
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

-- ============================================
-- MENSAGENS FINAIS
-- ============================================

-- Confirmar criação
DO $$
DECLARE
    count_posts INTEGER;
    count_campaigns INTEGER;
    count_stats INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_posts FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'blog360_posts';
    
    SELECT COUNT(*) INTO count_campaigns FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'blog360_email_campaigns';
    
    SELECT COUNT(*) INTO count_stats FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'blog360_campaign_stats';
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ PAINEL ADMINISTRATIVO CONFIGURADO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tabelas criadas:';
    
    IF count_posts > 0 THEN
        RAISE NOTICE '   ✅ blog360_posts';
    ELSE
        RAISE NOTICE '   ❌ blog360_posts - ERRO';
    END IF;
    
    IF count_campaigns > 0 THEN
        RAISE NOTICE '   ✅ blog360_email_campaigns';
    ELSE
        RAISE NOTICE '   ❌ blog360_email_campaigns - ERRO';
    END IF;
    
    IF count_stats > 0 THEN
        RAISE NOTICE '   ✅ blog360_campaign_stats';
    ELSE
        RAISE NOTICE '   ❌ blog360_campaign_stats - ERRO';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS: Habilitado em todas as tabelas';
    RAISE NOTICE '⚡ Índices: Criados para performance';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Próximos passos:';
    RAISE NOTICE '   1. Criar usuário admin no Supabase Authentication';
    RAISE NOTICE '   2. Fazer deploy do blog';
    RAISE NOTICE '   3. Acessar: admin-login.html';
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
END $$;
