# Fase 4 — Funil Blog → Forja (deploy)

## 1. SQL no Supabase

Execute no SQL Editor:

`supabase/BLOG360_FORJA_FUNNEL.sql`

Adiciona UTM em `blog360_leads`, campos de sync com `fc_contato_leads` e leitura de `blog360_analytics` para admins autenticados.

## 2. Secrets (Edge Functions)

No Dashboard → Edge Functions → Secrets:

| Secret | Uso |
|--------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | Inserir em `fc_contato_leads` e ler totais no funil |
| `GEMINI_API` | (já existente — fases IA anteriores) |

## 3. Deploy das funções

```powershell
cd D:\Projetos\blog-vida-360
supabase functions deploy blog360-sync-forja-lead --no-verify-jwt
supabase functions deploy blog360-forja-funnel
```

`blog360-sync-forja-lead` é chamada pelo formulário público em `produtos.html` (sem login admin). Use `--no-verify-jwt` ou equivalente no dashboard.

## 4. Validar

1. Abrir `produtos.html` → preencher formulário Forja → ver lead em `blog360_leads` com `fc_sync_status=synced`.
2. No CRM Forja (`/sistema/admin/leads`), lead com `utm_source=blog_vida360`.
3. Painel blog: `admin-funil-forja.html` (login admin).

## 5. Eventos rastreados (blog360_analytics)

| evento | Quando |
|--------|--------|
| `forja_cta_click` | Clique em link `forjacampea.com.br` ou `produtos.html` |
| `forja_bridge_view` | Carregamento de `produtos.html` |

Scripts: `assets/js/blog-forja-attribution.js`, `assets/js/blog-forja-tracking.js`.
