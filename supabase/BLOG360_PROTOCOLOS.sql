-- ============================================
-- Protocolos exclusivos (PDFs / materiais para envio)
-- Blog Vida 360º - Execute no SQL Editor do Supabase
-- ============================================
-- Permite cadastrar protocolos (ex.: Suporte Metabólico) e enviar
-- o link do PDF de forma exclusiva a quem solicitar (ex.: via WhatsApp).
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog360_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  arquivo_url TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog360_protocols_ativo ON public.blog360_protocols(ativo);
CREATE INDEX IF NOT EXISTS idx_blog360_protocols_ordem ON public.blog360_protocols(ordem);

-- RLS: visitantes podem listar apenas protocolos ativos; admin faz tudo
ALTER TABLE public.blog360_protocols ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog360: Protocolos ativos visíveis a todos" ON public.blog360_protocols;
CREATE POLICY "Blog360: Protocolos ativos visíveis a todos"
  ON public.blog360_protocols FOR SELECT
  USING (ativo = true);

DROP POLICY IF EXISTS "Blog360: Autenticados gerenciam protocolos" ON public.blog360_protocols;
CREATE POLICY "Blog360: Autenticados gerenciam protocolos"
  ON public.blog360_protocols FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.blog360_protocols IS 'Protocolos/materiais em PDF para envio exclusivo (ex.: Protocolo de Suporte Metabólico)';
