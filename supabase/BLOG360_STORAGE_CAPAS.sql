-- Bucket público para capas de artigo (URL https para Open Graph / WhatsApp).
-- Execute no Supabase → SQL Editor (projeto blog-vida-360).
-- Depois: guardar de novo o artigo no editor (com imagem em data URL) para enviar o ficheiro.

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog360-covers', 'blog360-covers', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "blog360_covers_public_read" ON storage.objects;
CREATE POLICY "blog360_covers_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blog360-covers');

DROP POLICY IF EXISTS "blog360_covers_auth_insert" ON storage.objects;
CREATE POLICY "blog360_covers_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog360-covers');

DROP POLICY IF EXISTS "blog360_covers_auth_update" ON storage.objects;
CREATE POLICY "blog360_covers_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog360-covers');

DROP POLICY IF EXISTS "blog360_covers_auth_delete" ON storage.objects;
CREATE POLICY "blog360_covers_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog360-covers');
