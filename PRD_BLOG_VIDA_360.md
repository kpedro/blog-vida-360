# 📋 PRD - Blog Vida 360º
## Product Requirements Document

**Versão:** 1.0  
**Data:** 13 de janeiro de 2025  
**Autor:** Kadson Pedro  
**Status:** Em Desenvolvimento

---

## 🎯 **1. Visão Geral do Produto**

### **1.1 Objetivo Principal**
Transformar o Blog Vida 360º em uma plataforma profissional de marketing de conteúdo que:
- Produza artigos de alta qualidade sobre bem-estar e educação
- Capture leads qualificados através de email marketing
- Converta visitantes em clientes através de produtos e links de afiliados
- Estabeleça autoridade no nicho de bem-estar e educação

### **1.2 Público-Alvo**
- **Primário:** Pessoas interessadas em bem-estar, desenvolvimento pessoal e educação (25-55 anos)
- **Secundário:** Profissionais de saúde, educadores, coaches
- **Persona:** "Maria, 35 anos, busca equilíbrio entre trabalho e vida pessoal, interessada em produtos de bem-estar e cursos online"

### **1.3 Proposta de Valor**
- Conteúdo exclusivo e de qualidade sobre bem-estar e educação
- Recomendações honestas de produtos testados
- Comunidade engajada através de newsletter
- Transformação pessoal através de conteúdo educativo

---

## 🏆 **2. Referências de Mercado (Blogs Brasileiros Bem-Sucedidos)**

### **2.1 Análise de Competidores**

#### **Blogs de Referência:**
1. **Blog de Mariana** (Vida Saudável)
   - Estratégia: SEO + Marketing de Afiliados
   - Resultado: R$ 3.000/mês em comissões
   - Diferencial: Conteúdo otimizado + anúncios estratégicos

2. **Alberto Melo** (Marketing Digital)
   - Estratégia: Guias completos + WordPress + Analytics
   - Diferencial: Conhecimento técnico profundo

3. **Afiliagram Educação**
   - Estratégia: Conteúdo educativo + estratégia consistente
   - Diferencial: Foco em educação do afiliado

### **2.2 Lições Aprendidas**
- ✅ SEO é fundamental para tráfego orgânico
- ✅ Conteúdo de qualidade > quantidade
- ✅ CTAs estratégicos aumentam conversão
- ✅ Email marketing é essencial para nutrição de leads
- ✅ Design limpo e profissional aumenta credibilidade

---

## 🎨 **3. Design e Experiência do Usuário**

### **3.1 Princípios de Design**
- **Minimalista:** Espaços em branco generosos, sem poluição visual
- **Moderno:** Tipografia elegante, cores suaves, animações sutis
- **Profissional:** Layout limpo, hierarquia clara, credibilidade visual
- **Sofisticado:** Paleta de cores refinada, elementos premium

### **3.2 Paleta de Cores (Nova)**
```css
:root {
    /* Cores Principais - Minimalista e Sofisticado */
    --primary: #2C3E50;        /* Azul acinzentado escuro */
    --primary-light: #34495E;  /* Azul acinzentado médio */
    --accent: #E74C3C;        /* Vermelho coral (CTAs) */
    --accent-light: #EC7063;   /* Vermelho coral claro */
    
    /* Neutros */
    --white: #FFFFFF;
    --gray-50: #FAFAFA;       /* Background principal */
    --gray-100: #F5F5F5;      /* Background secundário */
    --gray-200: #EEEEEE;      /* Bordas */
    --gray-300: #E0E0E0;      /* Divisores */
    --gray-600: #757575;      /* Texto secundário */
    --gray-900: #212121;      /* Texto principal */
    
    /* Sucesso/Confiança */
    --success: #27AE60;       /* Verde sucesso */
    --info: #3498DB;          /* Azul informação */
}
```

### **3.3 Tipografia**
- **Títulos:** Inter ou Poppins (moderna, legível)
- **Corpo:** System fonts (Roboto, -apple-system, sans-serif)
- **Hierarquia:** Tamanhos bem definidos (h1: 2.5rem, h2: 2rem, h3: 1.5rem)

### **3.4 Layout**
- **Largura máxima:** 1200px (conteúdo), 1400px (com sidebar)
- **Espaçamento:** Generoso (padding: 2rem, gap: 1.5rem)
- **Grid:** Sistema de 12 colunas responsivo
- **Breakpoints:** Mobile (320px), Tablet (768px), Desktop (1024px+)

---

## 🚀 **4. Funcionalidades Principais**

### **4.1 Sistema de Captura de Leads**

#### **4.1.1 Formulários de Newsletter**
**Localização:**
- Topo do blog (sticky após scroll)
- Final de cada post
- Sidebar (desktop)
- Pop-up inteligente (após 60s ou 50% do scroll)
- Página dedicada de captura

**Campos:**
- Email (obrigatório)
- Nome (opcional, aumenta conversão)
- Interesses (opcional, segmentação)

**Incentivos:**
- E-book grátis: "Guia Completo de Bem-Estar"
- Checklist: "7 Hábitos para Vida Equilibrada"
- Mini-curso: "5 Dias para Transformar sua Rotina"
- Acesso exclusivo a conteúdos premium

**Integração:**
- Supabase (armazenamento de leads)
- Resend (envio de emails de boas-vindas)
- Tags automáticas por interesse

#### **4.1.2 Sistema de Segmentação**
- Tags por categoria de interesse
- Score de engajamento (opens, clicks)
- Histórico de interações
- Prontos para campanhas segmentadas

### **4.2 Sistema de Links de Afiliados**

#### **4.2.1 Gerenciamento de Links**
- Dashboard para adicionar/editar links
- Categorização por produto/serviço
- Tracking de cliques e conversões
- Links com UTM parameters automáticos

#### **4.2.2 Integração no Conteúdo**
- Botões CTA estratégicos nos posts
- Cards de produtos relacionados
- Sidebar com recomendações
- Links contextuais no texto (nofollow quando apropriado)

#### **4.2.3 Transparência**
- Disclamer de afiliados visível
- "Recomendação Honesta" badge
- Política de transparência clara

### **4.3 Sistema de Posts Inteligente**

#### **4.3.1 Editor de Posts**
- Markdown com preview
- SEO helper (meta description, keywords)
- Sugestão de CTAs baseado no conteúdo
- Análise de legibilidade

#### **4.3.2 Otimização de Conteúdo**
- Sugestões de palavras-chave (via API)
- Análise de sentimento
- Sugestões de títulos otimizados
- Checklist de SEO antes de publicar

#### **4.3.3 Categorização**
- Tags por tema (bem-estar, educação, produtividade)
- Níveis (iniciante, intermediário, avançado)
- Tempo de leitura estimado
- Dificuldade do conteúdo

### **4.4 Sistema de Email Marketing**

#### **4.4.1 Automações**
- **Boas-vindas:** Email imediato após cadastro
- **Nurturing:** Sequência de 5 emails educativos
- **Re-engajamento:** Para leads inativos (30 dias)
- **Promoções:** Campanhas segmentadas por interesse

#### **4.4.2 Templates de Email**
- Newsletter semanal (resumo de posts)
- Promoções de produtos
- Conteúdo exclusivo
- Dicas rápidas (micro-conteúdo)

#### **4.4.3 Integração Resend**
- API para envio transacional
- Templates HTML responsivos
- Tracking de aberturas e cliques
- A/B testing de assuntos

### **4.5 Analytics e Conversão**

#### **4.5.1 Métricas Principais**
- Taxa de conversão de leads (meta: 3-5%)
- Taxa de abertura de emails (meta: 25%+)
- Taxa de clique em links afiliados (meta: 2-4%)
- Tempo médio na página
- Taxa de rejeição
- Páginas mais visitadas

#### **4.5.2 Dashboard de Analytics**
- Visão geral de métricas
- Gráficos de tendências
- Relatórios de campanhas
- Heatmaps de cliques (opcional)

#### **4.5.3 Integração com APIs**
- **Gemini/OpenAI:** Análise de sentimento do conteúdo
- **Perplexity:** Pesquisa de tendências
- **Anthropic:** Geração de resumos e meta descriptions

---

## 🗄️ **5. Arquitetura Técnica**

### **5.1 Stack Tecnológico**

#### **Frontend:**
- HTML5, CSS3, JavaScript (Vanilla ou React se necessário)
- Tailwind CSS ou CSS custom (minimalista)
- Marked.js para Markdown
- Chart.js para gráficos (dashboard)

#### **Backend/Serviços:**
- **Supabase:**
  - Tabela `leads` (email, nome, interesses, score, created_at)
  - Tabela `posts` (título, conteúdo, categoria, tags, published_at)
  - Tabela `affiliate_links` (url, produto, categoria, clicks, conversions)
  - Tabela `email_campaigns` (nome, template, enviados, abertos, clicados)
  - Tabela `analytics` (evento, página, timestamp, user_id)
  - RLS (Row Level Security) para proteção de dados

- **Vercel:**
  - Hosting do blog
  - Edge Functions para APIs
  - Deploy automático via GitHub

- **Resend:**
  - API para envio de emails
  - Templates HTML
  - Webhooks para tracking

- **Stripe:**
  - Integração futura para produtos próprios
  - Webhooks para eventos

#### **APIs Externas:**
- **Gemini API:** Análise de conteúdo, geração de resumos
- **OpenAI API:** Sugestões de títulos, otimização SEO
- **Anthropic API:** Análise de sentimento
- **Perplexity API:** Pesquisa de tendências

### **5.2 Estrutura de Banco de Dados (Supabase)**

```sql
-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  interesses TEXT[],
  score INTEGER DEFAULT 0,
  origem TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  conteudo_markdown TEXT NOT NULL,
  resumo TEXT,
  categoria TEXT,
  tags TEXT[],
  meta_description TEXT,
  tempo_leitura INTEGER,
  publicado BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Links de Afiliados
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  produto_nome TEXT NOT NULL,
  categoria TEXT,
  descricao TEXT,
  imagem_url TEXT,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campanhas de Email
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  template_id TEXT,
  segmento TEXT,
  enviados INTEGER DEFAULT 0,
  abertos INTEGER DEFAULT 0,
  clicados INTEGER DEFAULT 0,
  enviado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento TEXT NOT NULL, -- 'page_view', 'click', 'form_submit', etc.
  pagina TEXT,
  user_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_publicado ON posts(publicado);
CREATE INDEX idx_analytics_evento ON analytics(evento);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
```

### **5.3 Edge Functions (Vercel)**

```
/api/
  /leads/
    POST - Criar novo lead
    GET - Listar leads (admin)
  /newsletter/
    POST - Inscrever em newsletter
    GET - Status de inscrição
  /analytics/
    POST - Registrar evento
    GET - Métricas
  /email/
    POST - Enviar email (Resend)
  /content/
    POST - Analisar conteúdo (Gemini/OpenAI)
```

---

## 📊 **6. Fluxos de Conversão**

### **6.1 Jornada do Visitante**

```
Visitante
  ↓
Lê Post (Interesse)
  ↓
Vê CTA de Newsletter
  ↓
Preenche Formulário
  ↓
Recebe Email de Boas-vindas
  ↓
Acessa Conteúdo Exclusivo
  ↓
Clica em Link de Afiliado
  ↓
Conversão (Cliente)
```

### **6.2 Pontos de Conversão**

1. **Topo do Blog:** Banner de newsletter (sticky)
2. **Meio do Post:** CTA contextual
3. **Final do Post:** Formulário + Links relacionados
4. **Sidebar:** Recomendações de produtos
5. **Pop-up:** Após engajamento (60s ou 50% scroll)

### **6.3 Estratégia de Nutrição**

**Email 1 (Imediato):** Boas-vindas + E-book grátis  
**Email 2 (Dia 2):** Conteúdo educativo relacionado  
**Email 3 (Dia 4):** Dica prática rápida  
**Email 4 (Dia 7):** Recomendação de produto (soft)  
**Email 5 (Dia 10):** Conteúdo premium exclusivo  
**Email 6+ (Semanal):** Newsletter com novos posts

---

## 🎯 **7. Métricas de Sucesso (KPIs)**

### **7.1 Métricas Principais**
- **Taxa de Conversão de Leads:** 3-5% (meta)
- **Taxa de Abertura de Emails:** 25%+ (meta)
- **Taxa de Clique em Links:** 2-4% (meta)
- **Taxa de Conversão de Vendas:** 1-2% (meta)
- **Tempo Médio na Página:** 3+ minutos
- **Taxa de Rejeição:** < 60%

### **7.2 Métricas Secundárias**
- Tráfego orgânico mensal
- Posts publicados por mês
- Leads capturados por mês
- Receita de afiliados mensal
- Crescimento de lista de emails

---

## 🛠️ **8. Roadmap de Implementação**

### **Fase 1: Fundação (Semanas 1-2)**
- [ ] Redesign completo (minimalista, moderno)
- [ ] Setup Supabase (tabelas, RLS)
- [ ] Sistema de captura de leads básico
- [ ] Integração Resend (emails de boas-vindas)
- [ ] Analytics básico

### **Fase 2: Conteúdo e Conversão (Semanas 3-4)**
- [ ] Sistema de posts melhorado
- [ ] Editor de posts com SEO helper
- [ ] Sistema de links de afiliados
- [ ] CTAs estratégicos nos posts
- [ ] Pop-up inteligente

### **Fase 3: Email Marketing (Semanas 5-6)**
- [ ] Automações de email (sequência de nutrição)
- [ ] Templates de email responsivos
- [ ] Segmentação de leads
- [ ] Dashboard de campanhas

### **Fase 4: Inteligência e Otimização (Semanas 7-8)**
- [ ] Integração com APIs (Gemini, OpenAI, etc.)
- [ ] Análise de conteúdo automática
- [ ] Dashboard de analytics completo
- [ ] A/B testing de CTAs
- [ ] Otimizações de performance

### **Fase 5: Escala (Semanas 9+)**
- [ ] Sistema de recomendações personalizadas
- [ ] Chatbot para suporte (opcional)
- [ ] Integração Stripe (produtos próprios)
- [ ] App mobile (futuro)

---

## 🎨 **9. Design System**

### **9.1 Componentes Principais**

#### **Botões:**
```css
.btn-primary {
  background: var(--accent);
  color: var(--white);
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary:hover {
  background: var(--accent-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}
```

#### **Cards:**
- Sombra sutil
- Bordas arredondadas
- Hover effect suave
- Espaçamento generoso

#### **Formulários:**
- Inputs com bordas sutis
- Focus state destacado
- Labels flutuantes (opcional)
- Validação em tempo real

### **9.2 Animações**
- Fade in suave (0.3s)
- Hover effects sutis
- Scroll animations (opcional)
- Loading states elegantes

---

## 🔒 **10. Segurança e Privacidade**

### **10.1 Proteção de Dados**
- LGPD compliance
- Política de privacidade clara
- Consentimento explícito para emails
- Opção de descadastro fácil

### **10.2 Segurança Técnica**
- HTTPS obrigatório
- Validação de inputs
- Rate limiting em APIs
- Sanitização de conteúdo

---

## 📝 **11. Conteúdo e Estratégia**

### **11.1 Tipos de Conteúdo**
1. **Guias Completos:** Artigos longos (2000+ palavras)
2. **Listas:** "7 Hábitos...", "10 Dicas..."
3. **Tutoriais:** Passo a passo prático
4. **Reviews:** Análise honesta de produtos
5. **Casos de Sucesso:** Histórias reais
6. **Dicas Rápidas:** Micro-conteúdo (300-500 palavras)

### **11.2 Frequência de Publicação**
- **Meta:** 2-3 posts por semana
- **Mínimo:** 1 post por semana
- **Qualidade > Quantidade**

### **11.3 Estratégia de SEO**
- Pesquisa de palavras-chave
- Otimização on-page
- Link building interno
- Conteúdo evergreen
- Atualização de posts antigos

---

## ✅ **12. Critérios de Aceitação**

### **12.1 Funcionalidades Mínimas (MVP)**
- [ ] Design minimalista e profissional
- [ ] Sistema de captura de leads funcional
- [ ] Integração Resend para emails
- [ ] Sistema de posts com Markdown
- [ ] Links de afiliados rastreáveis
- [ ] Analytics básico
- [ ] Responsivo (mobile-first)

### **12.2 Qualidade**
- Performance: Lighthouse Score 90+
- Acessibilidade: WCAG 2.1 AA
- SEO: Meta tags completas
- Mobile: 100% responsivo

---

## 🚀 **Próximos Passos**

1. **Aprovação do PRD**
2. **Criação do Design System**
3. **Setup do Supabase**
4. **Implementação Fase 1**

---

**Documento vivo - será atualizado conforme evolução do projeto**
