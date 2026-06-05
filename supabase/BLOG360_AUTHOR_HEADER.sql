-- Cabeçalho do autor nos artigos (função/cargo exibida ao lado do nome; foto usa sobre_foto_url)
ALTER TABLE public.blog360_site_settings
  ADD COLUMN IF NOT EXISTS author_role_label TEXT;

COMMENT ON COLUMN public.blog360_site_settings.author_role_label IS
  'Cargo ou função do autor padrão nos artigos (ex.: Especialista em bem-estar). Foto: sobre_foto_url.';
