-- Desativa chunks RAG legados do dossiê doTERRA (substituído por docs/DOSSIE_MESTRE_RAG_ASSISTENTE_VIDA360.md)
-- Executar no SQL Editor após reindexar a base nova. Reversível: is_active = true.

UPDATE public.blog360_rag_chunks
SET
  is_active = false,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"desativado_motivo":"legado_doterra_2026","substituido_por":"DOSSIE_MESTRE_RAG_ASSISTENTE_VIDA360"}'::jsonb
WHERE is_active = true
  AND (
    lower(coalesce(source_title, '')) LIKE '%doterra%'
    OR lower(coalesce(source_uri, '')) LIKE '%doterra%'
    OR lower(coalesce(content, '')) LIKE '%doterra.me%'
    OR lower(coalesce(content, '')) LIKE '%cliente preferencial%doterra%'
    OR lower(coalesce(content, '')) LIKE '%consultor(a) de bem-estar%doterra%'
    OR coalesce(metadata->>'marca', '') ILIKE 'doterra'
    OR coalesce(metadata->>'produto', '') ILIKE 'doterra'
  );

-- Conferir quantos ficaram activos com tag forja/vida360 (ajustar conforme ingestão)
-- SELECT count(*) FILTER (WHERE is_active) AS activos, count(*) FILTER (WHERE NOT is_active) AS inactivos FROM public.blog360_rag_chunks;
