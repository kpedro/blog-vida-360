-- =============================================================================
-- Blog Vida 360º — Base de conhecimento RAG (pgvector) para o chat especialista / n8n
-- Prefixo blog360_rag_* — não altera portal_ia_* / PedagoFlow / mini-portal em outros projetos.
-- Execute no SQL Editor do Supabase (mesmo projeto que o widget e o n8n usam).
--
-- Embeddings: por defeito VECTOR(1536) = OpenAI text-embedding-3-small / text-embedding-ada-002.
-- Se usar outro modelo (ex.: 3072 dims), altere a coluna e recrie a função antes de popular dados.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Tabela de chunks (um documento longo = várias linhas com chunk_index)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog360_rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_title TEXT NOT NULL DEFAULT '',
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_uri TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog360_rag_chunks_active
  ON public.blog360_rag_chunks (is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_blog360_rag_chunks_metadata_gin
  ON public.blog360_rag_chunks USING GIN (metadata);

-- Índice vetorial (cosine). Após inserir muitos registos: ANALYZE public.blog360_rag_chunks;
CREATE INDEX IF NOT EXISTS idx_blog360_rag_chunks_embedding_ivfflat
  ON public.blog360_rag_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

COMMENT ON TABLE public.blog360_rag_chunks IS
  'Chunks da base de conhecimento RAG do chat Especialista Vida 360º (n8n).';

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_blog360_rag_chunks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog360_rag_chunks_updated_at ON public.blog360_rag_chunks;
CREATE TRIGGER trg_blog360_rag_chunks_updated_at
  BEFORE UPDATE ON public.blog360_rag_chunks
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_blog360_rag_chunks_updated_at();

-- ---------------------------------------------------------------------------
-- RPC: semelhança por cosseno (1 − distância coseno). Ordena por mais parecido.
-- Chamada típica via PostgREST: POST /rest/v1/rpc/blog360_match_rag_chunks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.blog360_match_rag_chunks(
  query_embedding VECTOR(1536),
  match_threshold DOUBLE PRECISION DEFAULT 0.35,
  match_count INTEGER DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  source_title TEXT,
  chunk_index INTEGER,
  similarity DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.content,
    c.metadata,
    c.source_title,
    c.chunk_index,
    (1 - (c.embedding <=> query_embedding))::DOUBLE PRECISION AS similarity
  FROM public.blog360_rag_chunks c
  WHERE c.is_active = true
    AND c.embedding IS NOT NULL
    AND (1 - (c.embedding <=> query_embedding)) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 50);
$$;

COMMENT ON FUNCTION public.blog360_match_rag_chunks IS
  'RAG: devolve chunks ordenados por semelhança ao embedding da pergunta (cosine).';

-- Permissões: o widget público NÃO deve usar esta RPC com anon key sem políticas extra.
-- Recomendado: n8n com service_role ou Edge Function que injeta contexto.
GRANT EXECUTE ON FUNCTION public.blog360_match_rag_chunks(VECTOR(1536), DOUBLE PRECISION, INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- RLS: por defeito sem políticas para anon — apenas service_role / bypass em ingestão.
-- Quiser painel admin no futuro: políticas SELECT/INSERT para role ou utilizadores específicos.
-- ---------------------------------------------------------------------------
ALTER TABLE public.blog360_rag_chunks ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RPC compatível com n8n / LangChain Supabase Vector Store
-- (Supabase quickstart: query_embedding + match_count + filter jsonb → id, content, metadata, similarity)
-- Query Name no nó: match_blog360_documents ou alias match_assistant_knowledge
-- Table Name no nó: blog360_rag_chunks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_blog360_documents(
  query_embedding VECTOR(1536),
  match_count INTEGER DEFAULT NULL,
  filter JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim INTEGER := LEAST(GREATEST(COALESCE(match_count, 10), 1), 100);
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.metadata,
    (1 - (c.embedding <=> query_embedding))::REAL AS similarity
  FROM public.blog360_rag_chunks c
  WHERE c.is_active = true
    AND c.embedding IS NOT NULL
    AND (filter = '{}'::jsonb OR c.metadata @> filter)
  ORDER BY c.embedding <=> query_embedding
  LIMIT lim;
END;
$$;

COMMENT ON FUNCTION public.match_blog360_documents IS
  'LangChain/n8n Supabase Vector Store: mesma assinatura que match_documents do quickstart Supabase.';

CREATE OR REPLACE FUNCTION public.match_assistant_knowledge(
  query_embedding VECTOR(1536),
  match_count INTEGER DEFAULT NULL,
  filter JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.match_blog360_documents(query_embedding, match_count, filter);
$$;

COMMENT ON FUNCTION public.match_assistant_knowledge IS
  'Alias para fluxos n8n já configurados com Query Name match_assistant_knowledge; usa blog360_rag_chunks.';

GRANT EXECUTE ON FUNCTION public.match_blog360_documents(VECTOR(1536), INTEGER, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.match_assistant_knowledge(VECTOR(1536), INTEGER, JSONB) TO service_role;
