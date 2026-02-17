-- ============================================
-- VERIFICAR TABELAS DO BLOG NO SUPABASE
-- ============================================
-- Execute no SQL Editor do Supabase.
-- Mostra quais tabelas blog360_* existem e as colunas de cada uma.
-- ============================================

-- 1) Lista todas as tabelas do blog (prefixo blog360_)
SELECT
  table_name AS "Tabela",
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) AS "Colunas"
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE 'blog360_%'
ORDER BY table_name;

-- 2) Detalhe: colunas de cada tabela blog360_*
SELECT
  c.table_name AS "Tabela",
  c.column_name AS "Coluna",
  c.data_type AS "Tipo",
  c.is_nullable AS "Nulo?"
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name LIKE 'blog360_%'
ORDER BY c.table_name, c.ordinal_position;

-- 3) Resumo: tabelas que o código do blog espera vs existentes
-- (Execute e confira manualmente)
-- Esperadas pelo código: blog360_leads, blog360_posts, blog360_campaigns,
--   blog360_analytics, blog360_newsletter_subscriptions, blog360_affiliate_links
