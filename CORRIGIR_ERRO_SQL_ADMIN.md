# 🔧 Correção do Erro SQL - Admin Setup

**Data:** 13 de janeiro de 2025

---

## ❌ Erro Encontrado

```
ERROR: 42703: column "status" does not exist
```

### **Causa:**
O script SQL estava tentando adicionar colunas à tabela `blog360_leads` que ainda não existe ou com verificação incorreta do schema.

---

## ✅ Correção Aplicada

Atualizei o arquivo `supabase/ADMIN_SETUP.sql` com:

1. ✅ Verificação se a tabela `blog360_leads` existe primeiro
2. ✅ Adicionado `table_schema = 'public'` nas verificações
3. ✅ Mensagens de log mais claras
4. ✅ Tratamento de erro caso a tabela não exista

---

## 🚀 Como Executar Agora

### **Opção 1: Execute o SQL Corrigido (RECOMENDADO)**

1. Abra o Supabase SQL Editor
2. Copie e cole o conteúdo COMPLETO de `supabase/ADMIN_SETUP.sql`
3. Clique em "Run"

### **Opção 2: Execute Apenas as Partes Necessárias**

Se você já executou parte do SQL e deu erro, execute apenas isso:

```sql
-- 1. Criar tabela de posts
CREATE TABLE IF NOT EXISTS blog360_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    conteudo TEXT NOT NULL,
    resumo TEXT,
    categoria TEXT NOT NULL,
    tags TEXT[],
    imagem_destaque TEXT,
    status TEXT DEFAULT 'draft',
    autor_id UUID REFERENCES auth.users(id),
    visualizacoes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- 2. Criar tabela de campanhas
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
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Criar tabela de estatísticas
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

-- 4. Adicionar colunas aos leads (CORRIGIDO)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog360_leads') THEN
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name='blog360_leads' AND column_name='status') THEN
            ALTER TABLE blog360_leads ADD COLUMN status TEXT DEFAULT 'active';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name='blog360_leads' AND column_name='total_emails_enviados') THEN
            ALTER TABLE blog360_leads ADD COLUMN total_emails_enviados INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name='blog360_leads' AND column_name='total_emails_abertos') THEN
            ALTER TABLE blog360_leads ADD COLUMN total_emails_abertos INTEGER DEFAULT 0;
        END IF;
        
    END IF;
END $$;

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_posts_status ON blog360_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON blog360_posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON blog360_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON blog360_email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON blog360_email_campaigns(created_at DESC);

-- 6. Configurar RLS para posts
ALTER TABLE blog360_posts ENABLE ROW LEVEL SECURITY;

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

-- 7. Configurar RLS para campanhas
ALTER TABLE blog360_email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas admins veem campanhas" ON blog360_email_campaigns;
CREATE POLICY "Apenas admins veem campanhas"
    ON blog360_email_campaigns FOR ALL
    TO authenticated
    USING (true);

-- 8. Configurar RLS para stats
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

-- 10. Trigger
DROP TRIGGER IF EXISTS update_blog360_posts_updated_at ON blog360_posts;
CREATE TRIGGER update_blog360_posts_updated_at
    BEFORE UPDATE ON blog360_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '✅ Painel administrativo configurado com sucesso!';
END $$;
```

---

## ✅ Verificar se Funcionou

Execute este SQL para conferir:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'blog360_%'
ORDER BY table_name;

-- Verificar colunas da tabela leads
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'blog360_leads'
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
blog360_affiliate_links
blog360_analytics
blog360_campaign_stats
blog360_email_campaigns
blog360_leads
blog360_newsletter_subscriptions
blog360_posts
```

---

## 🎯 Próximos Passos

Após executar o SQL corrigido:

1. ✅ Criar usuário admin no Supabase Authentication
2. ✅ Fazer deploy no Vercel
3. ✅ Acessar `admin-login.html`
4. ✅ Testar o painel

---

**Status:** 🟢 Correção aplicada! Execute novamente o SQL.
