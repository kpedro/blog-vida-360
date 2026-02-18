-- ============================================
-- Ebooks (materiais digitais para download/envio)
-- Blog Vida 360º - Execute no SQL Editor do Supabase
-- ============================================
-- Permite cadastrar ebooks (PDFs, guias) e disponibilizar
-- o link de download/envio no blog (ex.: via WhatsApp ou download direto).
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog360_ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  descricao_completa TEXT,
  arquivo_url TEXT,
  imagem_capa_url TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  tipo_envio TEXT DEFAULT 'whatsapp' CHECK (tipo_envio IN ('whatsapp', 'download', 'ambos')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog360_ebooks_ativo ON public.blog360_ebooks(ativo);
CREATE INDEX IF NOT EXISTS idx_blog360_ebooks_ordem ON public.blog360_ebooks(ordem);

-- RLS: visitantes podem listar apenas ebooks ativos; admin faz tudo
ALTER TABLE public.blog360_ebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog360: Ebooks ativos visíveis a todos" ON public.blog360_ebooks;
CREATE POLICY "Blog360: Ebooks ativos visíveis a todos"
  ON public.blog360_ebooks FOR SELECT
  USING (ativo = true);

DROP POLICY IF EXISTS "Blog360: Autenticados gerenciam ebooks" ON public.blog360_ebooks;
CREATE POLICY "Blog360: Autenticados gerenciam ebooks"
  ON public.blog360_ebooks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.blog360_ebooks IS 'Ebooks/materiais digitais (PDFs, guias) para download ou envio via WhatsApp';
COMMENT ON COLUMN public.blog360_ebooks.tipo_envio IS 'whatsapp: enviar link via WhatsApp; download: link direto; ambos: oferece as duas opções';
