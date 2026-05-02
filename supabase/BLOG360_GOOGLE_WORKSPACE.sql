-- =============================================================================
-- Blog Vida 360º — Google Workspace OAuth (Estúdio de conteúdo)
-- Tabela DEDICADA: não altera pedagoflow_google_calendar_tokens nem o PedagoFlow.
-- Execute no SQL Editor do Supabase do projeto partilhado (mesmo que o blog usa).
-- =============================================================================

CREATE TABLE IF NOT EXISTS blog360_google_workspace_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  granted_scopes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_blog360_google_workspace_tokens_user_id
  ON blog360_google_workspace_tokens(user_id);

CREATE OR REPLACE FUNCTION update_blog360_google_workspace_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_blog360_google_workspace_tokens_updated_at ON blog360_google_workspace_tokens;
CREATE TRIGGER update_blog360_google_workspace_tokens_updated_at
  BEFORE UPDATE ON blog360_google_workspace_tokens
  FOR EACH ROW
  EXECUTE PROCEDURE update_blog360_google_workspace_tokens_updated_at();

ALTER TABLE blog360_google_workspace_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog360_google_tokens_select_own" ON blog360_google_workspace_tokens;
DROP POLICY IF EXISTS "blog360_google_tokens_insert_own" ON blog360_google_workspace_tokens;
DROP POLICY IF EXISTS "blog360_google_tokens_update_own" ON blog360_google_workspace_tokens;
DROP POLICY IF EXISTS "blog360_google_tokens_delete_own" ON blog360_google_workspace_tokens;

CREATE POLICY "blog360_google_tokens_select_own"
  ON blog360_google_workspace_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "blog360_google_tokens_insert_own"
  ON blog360_google_workspace_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "blog360_google_tokens_update_own"
  ON blog360_google_workspace_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "blog360_google_tokens_delete_own"
  ON blog360_google_workspace_tokens FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE blog360_google_workspace_tokens IS
  'OAuth Google do Estúdio Blog Vida 360º (blog360-google-auth / blog360-google-workspace-api). Separado de pedagoflow_google_calendar_tokens.';
