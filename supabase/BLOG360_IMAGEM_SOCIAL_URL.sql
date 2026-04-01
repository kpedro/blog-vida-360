-- URL pública da imagem para Open Graph / WhatsApp / Facebook (opcional).
-- Quando preenchida, tem prioridade sobre imagem_destaque (ex.: capa em data URL ou upload local).
-- Execute no SQL Editor do Supabase (projeto blog-vida-360).

ALTER TABLE public.blog360_posts
  ADD COLUMN IF NOT EXISTS imagem_social_url TEXT;

COMMENT ON COLUMN public.blog360_posts.imagem_social_url IS
  'Link https público para preview em redes; opcional. Se vazio, usa imagem_destaque.';
