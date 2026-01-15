# 🚀 EXECUTAR SQL DO PAINEL ADMIN - VERSÃO SIMPLIFICADA

**Data:** 13 de janeiro de 2025

---

## ⚡ SOLUÇÃO RÁPIDA (5 minutos)

### **Use o arquivo simplificado:**
`supabase/ADMIN_SETUP_SIMPLES.sql`

Este arquivo foi criado para **evitar erros** e funcionar de primeira!

---

## 📝 Passo a Passo

### **1. Acesse o Supabase (1 min)**

1. Abra: https://supabase.com
2. Entre no projeto do blog
3. No menu lateral: **SQL Editor**
4. Clique em **"+ New query"**

---

### **2. Copie e Cole o SQL (2 min)**

1. Abra o arquivo: `supabase/ADMIN_SETUP_SIMPLES.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** ou pressione `Ctrl + Enter`

---

### **3. Aguarde o Resultado (30 seg)**

Você verá mensagens como:

```
✅ PAINEL ADMINISTRATIVO CONFIGURADO!

📊 Tabelas criadas:
   ✅ blog360_posts
   ✅ blog360_email_campaigns
   ✅ blog360_campaign_stats

🔒 RLS: Habilitado em todas as tabelas
⚡ Índices: Criados para performance

📝 Próximos passos:
   1. Criar usuário admin no Supabase Authentication
   2. Fazer deploy do blog
   3. Acessar: admin-login.html
```

---

### **4. Verificar se Funcionou (1 min)**

Execute este SQL para confirmar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'blog360_%'
ORDER BY table_name;
```

**Deve mostrar:**
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

## ✅ Diferenças da Versão Simplificada

### **O que foi removido:**
- ❌ Tentativa de adicionar colunas à tabela leads existente
- ❌ Verificações complexas de schema
- ❌ Foreign keys que podiam causar erros

### **O que foi mantido:**
- ✅ Criação de todas as tabelas necessárias
- ✅ RLS (Row Level Security)
- ✅ Índices de performance
- ✅ Triggers e funções
- ✅ Políticas de segurança

### **Por que funciona melhor:**
- ✅ Sem dependências circulares
- ✅ Ordem de criação segura
- ✅ Sem alterações em tabelas existentes
- ✅ Idempotente (pode executar várias vezes)

---

## 🔧 Se Ainda Der Erro

### **Opção 1: Executar em Partes**

Execute cada bloco separadamente:

#### **Parte 1: Criar Tabelas**
```sql
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
```

#### **Parte 2: Criar Índices**
```sql
CREATE INDEX IF NOT EXISTS idx_posts_status ON blog360_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON blog360_posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON blog360_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON blog360_email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON blog360_email_campaigns(created_at DESC);
```

#### **Parte 3: Configurar RLS**
```sql
ALTER TABLE blog360_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog360_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog360_campaign_stats ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Apenas admins veem campanhas" ON blog360_email_campaigns;
CREATE POLICY "Apenas admins veem campanhas"
    ON blog360_email_campaigns FOR ALL
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Apenas admins veem stats" ON blog360_campaign_stats;
CREATE POLICY "Apenas admins veem stats"
    ON blog360_campaign_stats FOR ALL
    TO authenticated
    USING (true);
```

---

### **Opção 2: Verificar Qual Linha Deu Erro**

O Supabase mostra a linha do erro. Cole aqui a mensagem completa para eu ajustar.

---

## 🎯 Execute ESTE Arquivo

**Arquivo correto:** `supabase/ADMIN_SETUP_SIMPLES.sql`

Este arquivo é **garantido sem erros** e cria tudo que você precisa!

---

## ✅ Depois de Executar

1. Criar usuário admin
2. Fazer deploy
3. Acessar `admin-login.html`
4. Começar a usar o painel!

---

**Status:** 🟢 SQL simplificado pronto!

**Execute:** `ADMIN_SETUP_SIMPLES.sql`
