# Editor de artigos – Blog Vida 360º

## O que foi implementado

1. **Área de criação de artigos** (`admin-editor-artigo.html`)
   - Formulário com título, resumo, categoria, autor, tags, imagem de destaque e editor de conteúdo (rich text).
   - Preview e pontuação SEO.
   - Salvar como rascunho ou publicar.
   - Edição de artigos existentes via `admin-editor-artigo.html?id=<uuid>`.

2. **Painel admin** (`admin-dashboard.html`)
   - Aba "Postagens" lista artigos do Supabase com links **Editar** e **Excluir**.
   - Estatística de posts publicados.

3. **Blog público**
   - **index.html**: lista posts com `status = 'published'` do Supabase; se não houver nenhum, mantém os cards estáticos.
   - **post.html**: se existir artigo no Supabase com o slug da URL (`?post=slug`), exibe esse conteúdo; caso contrário, continua usando o arquivo `.md` em `posts/`.

4. **Supabase**
   - Tabela `blog360_posts` com: `titulo`, `slug`, `conteudo` (HTML), `resumo`, `categoria`, `tags`, `imagem_destaque`, `autor`, `status` (`draft` / `published`), `published_at`.
   - RLS: leitura pública só para `status = 'published'`; usuários autenticados podem criar/editar/excluir.

## Como usar

### 1. Rodar a migração no Supabase

No **SQL Editor** do projeto Supabase do blog, execute o conteúdo do arquivo:

`supabase/BLOG360_POSTS_MIGRATION.sql`

Isso cria (ou ajusta) a tabela `blog360_posts` e as políticas de RLS.

### 2. Acessar o editor

1. Faça login em **admin-login.html** (usuário criado no Supabase Auth).
2. No painel, vá em **Postagens** e clique em **+ Novo Artigo** (ou acesse direto `admin-editor-artigo.html`).
3. Preencha título, resumo, categoria, autor, tags (opcional), URL da imagem e conteúdo.
4. Use **Salvar rascunho** ou **Publicar**.

### 3. Ver no blog

- Na **home** (`index.html`), os artigos publicados aparecem nos cards (substituindo o conteúdo estático se houver posts no Supabase).
- Ao clicar em um post, **post.html?post=<slug>** exibe o artigo do Supabase (se existir) ou o `.md` correspondente.

## Observações

- **Autenticação**: apenas usuários logados (Supabase Auth) acessam o painel e o editor.
- **Slug**: gerado automaticamente a partir do título (sem acentos, em minúsculas, separado por hífens).
- **Conteúdo**: o editor salva HTML; a exibição no post usa esse HTML diretamente.
- **Fallback**: se o Supabase não estiver configurado ou não houver posts publicados, o blog continua funcionando com os arquivos estáticos e os `.md` em `posts/`.
