-- Links do chat assistente (widget n8n): Sistema Forja em vez de doTERRA legado
UPDATE public.blog360_site_settings
SET
  agente_chat_link_compra = 'https://www.blogvida360.com.br/produtos.html',
  agente_chat_link_cadastro = 'https://forjacampea.com.br/como-funciona?utm_source=blog_vida360&utm_medium=referral&utm_campaign=chat_widget',
  agente_chat_nome = COALESCE(NULLIF(TRIM(agente_chat_nome), ''), 'Assistente Vida 360º'),
  updated_at = NOW()
WHERE id = 1;
