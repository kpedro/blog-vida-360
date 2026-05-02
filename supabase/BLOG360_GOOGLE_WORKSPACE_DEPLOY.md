# Deploy — Google no Estúdio Blog Vida 360º (isolado do PedagoFlow)

Este fluxo usa **tabela e Edge Functions próprias**, para não misturar tokens com `pedagoflow_google_calendar_tokens`.

## 1. SQL no Supabase

No **SQL Editor**, execute o ficheiro:

`supabase/BLOG360_GOOGLE_WORKSPACE.sql`

Isto cria `blog360_google_workspace_tokens` com RLS por `user_id`.

## 2. Google Cloud Console

No projeto OAuth já usado pelo PedagoFlow (mesmo **GOOGLE_CLIENT_ID** / **GOOGLE_CLIENT_SECRET** no Supabase):

1. **APIs e serviços** → **Credenciais** → cliente OAuth Web.
2. Em **URIs de redirecionamento autorizados**, acrescente **exactamente**:

   `https://<SEU_REF_SUPABASE>.supabase.co/functions/v1/blog360-google-auth`

   (Substitua `<SEU_REF_SUPABASE>` pelo ref do projeto; é o mesmo host das outras funções.)

Guarde. Sem este URI, o Google devolve `redirect_uri_mismatch` no callback.

## 3. Secrets no Supabase (Edge Functions)

Em **Project Settings → Edge Functions → Secrets** (ou CLI), defina:

| Secret | Descrição |
|--------|-----------|
| `GOOGLE_CLIENT_ID` | Igual ao PedagoFlow (já existe normalmente). |
| `GOOGLE_CLIENT_SECRET` | Igual ao PedagoFlow. |
| `BLOG360_GOOGLE_REDIRECT_URI` | **Obrigatório.** O mesmo URI que adicionou no Google Console (passo 2): `https://<ref>.supabase.co/functions/v1/blog360-google-auth`. **Não** reutilize `GOOGLE_REDIRECT_URI` (é o callback do PedagoFlow; se faltar, o Google devolve o utilizador ao PedagoFlow após o consentimento). |
| `BLOG360_FRONTEND_URL` | Origem do admin do blog **sem barra final**, ex.: `https://kpedro.github.io/blog-vida-360` ou `http://localhost:5174` para testes locais. |

Após OAuth bem-sucedido, o utilizador é redirecionado para:

`${BLOG360_FRONTEND_URL}/admin-estudio-conteudo.html?google_workspace=connected`

## 4. Deploy das funções

A partir da pasta do projeto (com Supabase CLI ligado ao projeto):

```bash
supabase functions deploy blog360-google-auth --no-verify-jwt
supabase functions deploy blog360-google-workspace-api --no-verify-jwt
```

(Se o vosso projeto usa verificação JWT diferente, alinhem com o deploy das funções PedagoFlow existentes.)

## 5. Frontend

O `assets/js/estudio-conteudo.js` já chama:

- `.../functions/v1/blog360-google-auth` (`status`, `start`)
- `.../functions/v1/blog360-google-workspace-api` (`doc_create`, etc.)

Não é necessário alterar credenciais anon no HTML: continua o mesmo `VITE_SUPABASE_URL` / anon key.

## Resumo

- **PedagoFlow** continua a usar `google-calendar-auth`, `google-workspace-api` e `pedagoflow_google_calendar_tokens`.
- **Blog** usa `blog360-google-auth`, `blog360-google-workspace-api` e `blog360_google_workspace_tokens`.

Um utilizador pode ligar o Google **nos dois fluxos** (duas linhas na base de dados), sem conflito de código entre apps.
