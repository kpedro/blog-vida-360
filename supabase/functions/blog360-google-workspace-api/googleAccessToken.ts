/**
 * Cópia local do helper: o CLI do Supabase não inclui `../_shared/` no bundle por função.
 * Mantenha alinhado com `google-calendar-auth/googleAccessToken.ts` e `google-calendar-create-event/googleAccessToken.ts`.
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number; scope?: string }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.error || 'Failed to refresh token');
  }

  return await response.json();
}

export async function getValidGoogleAccessToken(
  supabase: SupabaseClient,
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<
  { access_token: string; granted_scopes: string | null } | { error: string; status: number }
> {
  const { data: tokenData, error: tokenError } = await supabase
    .from('blog360_google_workspace_tokens')
    .select('access_token, refresh_token, expires_at, granted_scopes')
    .eq('user_id', userId)
    .single();

  if (tokenError || !tokenData) {
    return {
      error: 'Google não conectado. Use «Conectar conta Google» no Estúdio Blog.',
      status: 400,
    };
  }

  let accessToken = tokenData.access_token;
  let grantedScopes: string | null = tokenData.granted_scopes ?? null;
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();

  if (now >= expiresAt) {
    if (!tokenData.refresh_token) {
      return {
        error: 'Sessão Google expirada. Volte a ligar no Estúdio Blog.',
        status: 400,
      };
    }

    try {
      const refreshed = await refreshAccessToken(tokenData.refresh_token, clientId, clientSecret);
      accessToken = refreshed.access_token;

      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + (refreshed.expires_in || 3600));

      const updatePayload: Record<string, string> = {
        access_token: accessToken,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (refreshed.scope) {
        updatePayload.granted_scopes = refreshed.scope;
        grantedScopes = refreshed.scope;
      }

      await supabase
        .from('blog360_google_workspace_tokens')
        .update(updatePayload)
        .eq('user_id', userId);
    } catch (e) {
      console.error('Google token refresh error:', e);
      return {
        error: 'Não foi possível renovar o acesso Google. Volte a ligar no Estúdio Blog.',
        status: 500,
      };
    }
  }

  return { access_token: accessToken, granted_scopes: grantedScopes };
}

export function featuresFromScopes(grantedScopes: string | null): {
  calendar: boolean;
  drive: boolean;
  sheets: boolean;
  docs: boolean;
  docsWrite: boolean;
  sheetsWrite: boolean;
  driveFile: boolean;
  legacyConnection: boolean;
  gmailSend: boolean;
  formsBody: boolean;
  formsResponsesRead: boolean;
  classroomCoursesRead: boolean;
  classroomCoursework: boolean;
} {
  const DOCS = 'https://www.googleapis.com/auth/documents';
  const DOCS_RO = 'https://www.googleapis.com/auth/documents.readonly';
  const SHEETS = 'https://www.googleapis.com/auth/spreadsheets';
  const DRIVE_FILE = 'https://www.googleapis.com/auth/drive.file';
  const GMAIL_SEND = 'https://www.googleapis.com/auth/gmail.send';
  const FORMS_BODY = 'https://www.googleapis.com/auth/forms.body';
  const FORMS_RESP = 'https://www.googleapis.com/auth/forms.responses.readonly';
  const CLASSROOM_COURSES_RO = 'https://www.googleapis.com/auth/classroom.courses.readonly';
  const CLASSROOM_CW = 'https://www.googleapis.com/auth/classroom.coursework.students';

  if (!grantedScopes || !grantedScopes.trim()) {
    return {
      calendar: true,
      drive: false,
      sheets: false,
      docs: false,
      docsWrite: false,
      sheetsWrite: false,
      driveFile: false,
      legacyConnection: true,
      gmailSend: false,
      formsBody: false,
      formsResponsesRead: false,
      classroomCoursesRead: false,
      classroomCoursework: false,
    };
  }
  const parts = grantedScopes.split(/\s+/).map((x) => x.trim()).filter(Boolean);
  const has = (url: string) => parts.includes(url);
  const s = grantedScopes;
  return {
    calendar: s.includes('calendar'),
    drive: s.includes('drive'),
    sheets: s.includes('spreadsheets'),
    docs: has(DOCS) || has(DOCS_RO),
    docsWrite: has(DOCS),
    sheetsWrite: has(SHEETS),
    driveFile: has(DRIVE_FILE),
    legacyConnection: false,
    gmailSend: has(GMAIL_SEND),
    formsBody: has(FORMS_BODY),
    formsResponsesRead: has(FORMS_RESP),
    classroomCoursesRead: has(CLASSROOM_COURSES_RO),
    classroomCoursework: has(CLASSROOM_CW),
  };
}
