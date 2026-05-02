# Estúdio de conteúdo — deploy (Blog Vida 360º)

Três Edge Functions no **mesmo projeto Supabase do blog** (não usa o PedagoFlow):

| Função | Descrição |
|--------|-----------|
| `generate-blog-studio-content` | Gera texto (landing, redes, artigo) via Gemini |
| `generate-blog-studio-image` | Gera imagem a partir de descrição |
| `blog-prompt-coach` | Assistente em conversa para montar o prompt |
| `blog-studio-overlay-suggest` | Sugere manchete + categoria para capa (texto sobre imagem) via Gemini |

## Pré-requisitos

1. [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e logado (`supabase login`).
2. Link do projeto: na raiz do repositório do blog, `supabase link --project-ref SEU_PROJECT_REF`.
3. Secret **`GEMINI_API`**: no Dashboard → Project Settings → Edge Functions → Secrets, adicione a chave da API Google Gemini (mesmo tipo usada em outros projetos).

## Deploy das funções

Na pasta do repositório `blog-vida-360`:

```powershell
cd D:\Projetos\blog-vida-360
supabase functions deploy generate-blog-studio-content
supabase functions deploy generate-blog-studio-image
supabase functions deploy blog-prompt-coach
supabase functions deploy blog-studio-overlay-suggest
```

O painel envia o JWT do utilizador em `Authorization: Bearer …`. Confirme nas definições da função (Dashboard Supabase) se a verificação JWT está alinhada com o vosso fluxo; em caso de 401, veja [JWT no Edge Functions](https://supabase.com/docs/guides/functions/auth).

## Tabela de histórico (opcional mas recomendado)

Execute no SQL Editor o ficheiro `BLOG360_STUDIO_HISTORY.sql`. Sem esta tabela, o histórico na UI do Estúdio não persiste (as gerações ainda funcionam).

## Teste rápido

Com sessão admin ativa no browser, o painel chama:

`POST {SUPABASE_URL}/functions/v1/generate-blog-studio-content`  
Body: `{ "type": "article_copy", "prompt": "Um artigo sobre sono e rotina" }`  
Header: `Authorization: Bearer <access_token>` e `apikey: <anon_key>`.

Se aparecer erro 401, confirme login no admin. Se 500 com `GEMINI_API`, configure o secret.
