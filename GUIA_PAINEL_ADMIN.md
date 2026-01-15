# 🎛️ Guia Completo do Painel Administrativo - Blog Vida 360º

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Funcionalidades](#funcionalidades)
4. [Como Usar](#como-usar)
5. [Integração com Resend](#integração-com-resend)

---

## 🎯 Visão Geral

O Painel Administrativo do Blog Vida 360º permite que você:

✅ **Gerencie Inscritos da Newsletter**
- Visualize todos os inscritos
- Exporte lista em CSV
- Veja origem de cada inscrito
- Acompanhe crescimento

✅ **Crie e Edite Artigos**
- Editor visual completo
- Preview em tempo real
- Score SEO automático
- Salvar rascunhos
- Publicar instantaneamente

✅ **Gerencie Campanhas de Marketing**
- Templates profissionais
- Editor de email visual
- Personalização com variáveis
- Estatísticas de envio
- Segmentação de público

✅ **Visualize Analytics**
- Total de inscritos
- Posts publicados
- Taxa de abertura de emails
- Crescimento semanal

---

## ⚙️ Configuração Inicial

### Passo 1: Criar Tabelas no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo `supabase/CRIAR_TABELAS_ADMIN.sql`
5. **IMPORTANTE:** Substitua `'seu-email@exemplo.com'` pelo seu email real
6. Cole o script completo no SQL Editor
7. Clique em **Run** para executar

### Passo 2: Criar Usuário Admin

1. No Supabase Dashboard, vá em **Authentication** → **Users**
2. Clique em **Add User**
3. Preencha:
   - **Email:** seu-email@exemplo.com (mesmo do script SQL)
   - **Password:** Crie uma senha forte
   - **Auto Confirm User:** ✅ Marque esta opção
4. Clique em **Create User**

### Passo 3: Testar Acesso

1. Abra o blog localmente: `http://localhost:8000`
2. Acesse: `http://localhost:8000/admin-login.html`
3. Faça login com suas credenciais
4. Você será redirecionado para o dashboard!

---

## 🚀 Funcionalidades

### 1️⃣ Dashboard Principal

**Acesso:** `admin-dashboard.html`

**O que você vê:**
- 📊 **Estatísticas em Cards:**
  - Total de Inscritos
  - Posts Publicados
  - Campanhas Enviadas
  - Taxa de Abertura Média

- 📈 **Últimos Inscritos:**
  - Tabela com os 5 últimos cadastros
  - Email, nome, data e origem

**Navegação:**
- 👥 Inscritos Newsletter
- 📝 Artigos
- 📢 Campanhas Marketing
- 📈 Analytics

---

### 2️⃣ Gestão de Inscritos

**Acesso:** Dashboard → **Inscritos Newsletter**

**Funcionalidades:**
- ✅ Visualizar todos os inscritos
- ✅ Ver data de cadastro
- ✅ Identificar origem (popup, formulário, etc)
- ✅ Exportar lista completa em CSV
- ✅ Status de cada inscrito (Ativo/Inativo)

**Como Exportar:**
1. Clique no botão **📥 Exportar CSV**
2. Arquivo será baixado automaticamente
3. Nome: `leads-blog-vida360-YYYY-MM-DD.csv`
4. Use no Excel, Google Sheets ou ferramentas de email

---

### 3️⃣ Editor de Artigos

**Acesso:** Dashboard → **Artigos** → **+ Novo Artigo**

**Funcionalidades:**

📝 **Informações Básicas:**
- Título do artigo (com contador de caracteres)
- Categoria (Saúde, Bem-estar, Produtividade, etc)
- Autor
- Resumo/Descrição SEO
- Tags
- Imagem de capa (upload ou URL)

✍️ **Editor de Conteúdo:**
- Editor visual WYSIWYG
- Barra de ferramentas:
  - **B** - Negrito
  - **I** - Itálico
  - **U** - Sublinhado
  - Listas (ordenadas e não-ordenadas)
  - Títulos H2 e H3
  - Links
  - Imagens
- Contador de palavras

🎯 **SEO & Preview:**
- Score SEO automático (0-100)
- Preview do Google (como aparece na busca)
- Sugestões de otimização

**Como Criar um Artigo:**

1. Clique em **+ Novo Artigo**
2. Preencha o título (30-60 caracteres ideal)
3. Selecione a categoria
4. Escreva o resumo (120-160 caracteres)
5. Adicione tags separadas por vírgula
6. Faça upload da imagem de capa
7. Escreva o conteúdo (mínimo 300 palavras)
8. Verifique o Score SEO (ideal: 80+)
9. Opções:
   - **💾 Salvar Rascunho** - Salva sem publicar
   - **🚀 Publicar** - Publica imediatamente

**Como Editar um Artigo:**

1. No dashboard, vá em **Artigos**
2. Clique no ícone ✏️ ao lado do artigo
3. Faça as alterações
4. Salve ou publique novamente

---

### 4️⃣ Campanhas de Email Marketing

**Acesso:** Dashboard → **Campanhas** → **+ Nova Campanha**

**Funcionalidades:**

📋 **Informações da Campanha:**
- Nome interno (para organização)
- Assunto do email
- Pré-header (texto de preview)
- Nome e email do remetente
- Segmento de envio:
  - Todos os Inscritos
  - Apenas Ativos (últimos 30 dias)
  - Novos Inscritos (últimos 7 dias)
  - Mais Engajados
  - Segmento Personalizado

🎨 **Templates Profissionais:**
- 📰 **Newsletter** - Formato clássico
- 🎁 **Promocional** - Para ofertas
- 📚 **Educacional** - Conteúdo educativo
- 📢 **Anúncio** - Novidades

✍️ **Editor de Email:**
- Editor visual HTML
- Variáveis de personalização:
  - `{{nome}}` - Nome do inscrito
  - `{{email}}` - Email do inscrito
- Elementos:
  - 🔘 Botões CTA
  - 🖼️ Imagens
  - ➖ Divisores
  - Textos formatados

📊 **Estatísticas Estimadas:**
- Número de destinatários
- Taxa de abertura estimada
- Taxa de cliques estimada

👁️ **Preview em Tempo Real:**
- Veja como o email ficará
- Preview do assunto e remetente

**Como Criar uma Campanha:**

1. Clique em **+ Nova Campanha**
2. Preencha nome e assunto
3. Escolha o segmento de envio
4. Selecione um template
5. Personalize o conteúdo
6. Use variáveis para personalização
7. Adicione botões CTA
8. Revise o preview
9. Opções:
   - **💾 Salvar Rascunho** - Salva para enviar depois
   - **📨 Enviar Campanha** - Envia imediatamente

---

## 📧 Integração com Resend (Email Marketing)

### O que é o Resend?

Resend é um serviço de envio de emails transacionais e marketing. É necessário para enviar as campanhas.

### Como Configurar:

1. **Criar Conta no Resend:**
   - Acesse: https://resend.com
   - Crie uma conta gratuita
   - Plano gratuito: 3.000 emails/mês

2. **Obter API Key:**
   - No dashboard do Resend
   - Vá em **API Keys**
   - Clique em **Create API Key**
   - Copie a chave (começa com `re_`)

3. **Configurar no Projeto:**
   - Crie arquivo `.env` na raiz do projeto
   - Adicione: `RESEND_API_KEY=re_sua_chave_aqui`

4. **Verificar Domínio (Opcional mas Recomendado):**
   - No Resend, vá em **Domains**
   - Adicione seu domínio
   - Configure os registros DNS
   - Aguarde verificação

### Código de Integração:

O arquivo `assets/js/campanha.js` já está preparado. Você só precisa adicionar a integração real com a API do Resend.

**Exemplo de código para adicionar:**

```javascript
// No arquivo campanha.js, função sendEmailsToSubscribers

async function sendEmailsToSubscribers(campaignData) {
    try {
        // Buscar inscritos do segmento
        const supabaseClient = window.supabaseClient;
        let query = supabaseClient.client.from('blog360_leads').select('*');
        
        // Aplicar filtro de segmento
        if (campaignData.segment === 'active') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query = query.gte('created_at', thirtyDaysAgo.toISOString());
        }
        
        const { data: leads } = await query;
        
        // Enviar para cada inscrito via Resend
        for (const lead of leads) {
            const personalizedContent = campaignData.content
                .replace(/{{nome}}/g, lead.nome || 'Amigo')
                .replace(/{{email}}/g, lead.email);
            
            // Chamar API do Resend (via backend)
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: lead.email,
                    subject: campaignData.subject,
                    html: personalizedContent
                })
            });
        }
        
        // Atualizar estatísticas da campanha
        await supabaseClient.client
            .from('blog360_campaigns')
            .update({ recipients_count: leads.length })
            .eq('id', currentCampaignId);
            
    } catch (error) {
        console.error('Erro ao enviar emails:', error);
    }
}
```

---

## 🎨 Personalização

### Cores do Painel

Edite o arquivo CSS inline nos arquivos HTML:

```css
/* Cor primária (azul escuro) */
--primary: #2C3E50;

/* Cor de destaque (vermelho) */
--accent: #E74C3C;

/* Cor de sucesso (verde) */
--success: #27AE60;
```

### Templates de Email

Edite os templates em `assets/js/campanha.js` na função `loadTemplate()`.

---

## 🔒 Segurança

### Políticas Implementadas:

✅ **Autenticação Obrigatória:**
- Apenas usuários autenticados acessam o admin
- Redirecionamento automático se não logado

✅ **Row Level Security (RLS):**
- Apenas admin pode criar/editar posts
- Apenas admin pode ver campanhas
- Apenas admin pode exportar leads
- Posts publicados são públicos

✅ **Proteção de Dados:**
- Emails criptografados no banco
- API keys não expostas no frontend
- Validação de formulários

### Boas Práticas:

1. **Senha Forte:** Use senha com 12+ caracteres
2. **2FA:** Ative autenticação de dois fatores no Supabase
3. **Backup:** Exporte leads regularmente
4. **Logs:** Monitore acessos no Supabase Dashboard

---

## 📊 Métricas e Analytics

### Métricas Disponíveis:

1. **Inscritos:**
   - Total de inscritos
   - Crescimento semanal
   - Origem dos cadastros
   - Taxa de conversão

2. **Artigos:**
   - Total de posts publicados
   - Visualizações (futuro)
   - Posts mais lidos (futuro)

3. **Campanhas:**
   - Emails enviados
   - Taxa de abertura
   - Taxa de cliques
   - Descadastros

### Como Melhorar as Métricas:

📈 **Aumentar Inscritos:**
- Ofereça conteúdo exclusivo
- Use popups estratégicos
- Crie landing pages específicas

📧 **Melhorar Taxa de Abertura:**
- Assuntos chamativos (30-50 caracteres)
- Personalize com nome
- Teste diferentes horários
- Segmente sua lista

✍️ **Mais Engajamento nos Artigos:**
- Títulos atraentes
- Imagens de qualidade
- Conteúdo de valor
- CTAs claros

---

## 🆘 Solução de Problemas

### Não consigo fazer login

**Solução:**
1. Verifique se criou o usuário no Supabase
2. Confirme que o email está correto
3. Verifique se marcou "Auto Confirm User"
4. Tente resetar a senha

### Erro ao salvar artigo

**Solução:**
1. Verifique conexão com internet
2. Confirme que está logado
3. Verifique se preencheu campos obrigatórios
4. Veja o console do navegador (F12)

### Campanhas não aparecem

**Solução:**
1. Verifique se executou o script SQL
2. Confirme que a tabela `blog360_campaigns` existe
3. Verifique políticas RLS no Supabase

### Exportação CSV não funciona

**Solução:**
1. Verifique se há inscritos cadastrados
2. Permita downloads no navegador
3. Desative bloqueadores de popup

---

## 📞 Suporte

### Recursos Úteis:

- 📚 [Documentação Supabase](https://supabase.com/docs)
- 📧 [Documentação Resend](https://resend.com/docs)
- 🎨 [Guia de SEO](https://moz.com/beginners-guide-to-seo)

### Próximas Funcionalidades:

🔜 **Em Desenvolvimento:**
- [ ] Analytics avançado com gráficos
- [ ] Agendamento de campanhas
- [ ] A/B Testing de emails
- [ ] Editor de landing pages
- [ ] Integração com Google Analytics
- [ ] Comentários moderados
- [ ] Sistema de categorias dinâmico

---

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Executei o script SQL no Supabase
- [ ] Criei usuário admin no Supabase
- [ ] Substitui o email nas políticas RLS
- [ ] Testei login no admin
- [ ] Consigo acessar o dashboard
- [ ] Criei meu primeiro artigo de teste
- [ ] Exportei a lista de inscritos
- [ ] Criei uma campanha de teste
- [ ] Configurei conta no Resend (opcional)
- [ ] Verifiquei domínio no Resend (opcional)

---

## 🎉 Pronto para Usar!

Seu painel administrativo está completo e pronto para uso!

**Próximos Passos:**
1. Crie seu primeiro artigo
2. Configure uma campanha de boas-vindas
3. Monitore o crescimento de inscritos
4. Analise as métricas semanalmente

**Dica:** Crie um calendário editorial para manter consistência nas publicações!

---

**Desenvolvido com ❤️ para o Blog Vida 360º**
