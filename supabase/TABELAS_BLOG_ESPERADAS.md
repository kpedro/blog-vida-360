# Tabelas do Blog Vida 360º – O que o código usa

Use o arquivo **`VERIFICAR_TABELAS_BLOG.sql`** no SQL Editor do Supabase para listar as tabelas **blog360_*** que já existem no seu projeto.

**O código foi ajustado para as tabelas que você já tem no Supabase** (incluindo `blog360_email_campaigns` em vez de `blog360_campaigns`, e as colunas reais de `blog360_posts`).

---

## Tabelas que o blog usa (e que você já tem)

| Tabela | Onde é usada | Uso |
|--------|----------------|-----|
| **blog360_leads** | Formulário newsletter, admin (inscritos), campanhas | Email, nome, origem dos inscritos |
| **blog360_posts** | Editor de artigos, listagem na home, página do post, admin (postagens) | titulo, slug, conteudo_markdown, content, resumo, categoria, imagem_destaque, publicado, status, published_at, author |
| **blog360_email_campaigns** | Admin (aba Campanhas), admin-nova-campanha / campanha.js | nome, assunto, conteudo_html, segmento, status, enviado_em (+ name, subject, content, segment) |
| **blog360_analytics** | supabase.js (trackEvent), analytics.html | evento, pagina, session_id, metadata |
| **blog360_newsletter_subscriptions** | supabase.js (subscribeToNewsletter) | lead_id, status, fonte |
| **blog360_affiliate_links** | supabase.js (getAffiliateLinks, trackAffiliateClick) | url, produto_nome, ativo, etc. |
| **blog360_campaign_stats** | Estatísticas por campanha (opcional) | campaign_id, lead_id, enviado, aberto, clicado |

---

## Colunas importantes por tabela

### blog360_posts (obrigatória para o editor)
- `id`, `titulo`, `slug`, `conteudo` (HTML), `resumo`, `categoria`, `tags`, `imagem_destaque`, `autor`
- `status` ('draft' ou 'published'), `published_at`, `created_at`, `updated_at`

### blog360_leads
- `id`, `email`, `nome`, `origem`, `ativo`, `created_at`, `updated_at`

### blog360_campaigns
- `id`, `name`, `subject`, `content`, `status`, `sent_at`, `created_at`, `updated_at`
- (opcional: preheader, sender_name, sender_email, segment, template)

---

## Depois de rodar o script de verificação

1. No Supabase: **SQL Editor** → cole e execute **`VERIFICAR_TABELAS_BLOG.sql`**.
2. Veja o resultado: quais tabelas **blog360_*** existem e as colunas de cada uma.
3. Compare com esta lista:
   - Se faltar alguma tabela, use **`BLOG360_TABELAS_COMPLETO.sql`** para criá-las (ele usa `IF NOT EXISTS`, não apaga nada).
   - Se **blog360_posts** existir mas faltar coluna (`conteudo`, `autor`, `status`), o próprio **`BLOG360_TABELAS_COMPLETO.sql`** adiciona essas colunas quando rodado.

Se quiser, copie o resultado do `VERIFICAR_TABELAS_BLOG.sql` (ou um print das tabelas) e envie para eu te dizer exatamente o que criar ou alterar.
