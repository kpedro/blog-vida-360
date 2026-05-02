// Edge Function OAuth2 Google — Blog Vida 360º (isolado do PedagoFlow).
// Tokens na tabela blog360_google_workspace_tokens; não usa pedagoflow_google_calendar_tokens.
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (iguais ao projeto), BLOG360_GOOGLE_REDIRECT_URI,
// BLOG360_FRONTEND_URL (origem do admin após OAuth).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { featuresFromScopes } from './googleAccessToken.ts';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
/** Callback OAuth: obrigatório `BLOG360_GOOGLE_REDIRECT_URI` (não usar `GOOGLE_REDIRECT_URI` — é do PedagoFlow e redirecciona para lá). */
const REDIRECT_URI = Deno.env.get('BLOG360_GOOGLE_REDIRECT_URI') || '';
/** Após autorizar, redireciona para o admin do blog (GitHub Pages ou local). */
const BLOG_FRONTEND =
  Deno.env.get('BLOG360_FRONTEND_URL') || 'https://kpedro.github.io/blog-vida-360';

/** Escopos combinados (um único consentimento). Ative as APIs no Google Cloud Console. */
const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
].join(' ');

function emptyFeaturesJson() {
  return {
    calendar: false,
    drive: false,
    sheets: false,
    docs: false,
    docsWrite: false,
    sheetsWrite: false,
    driveFile: false,
    legacyConnection: false,
    gmailSend: false,
    formsBody: false,
    formsResponsesRead: false,
    classroomCoursesRead: false,
    classroomCoursework: false,
  };
}

function featuresToJson(f: ReturnType<typeof featuresFromScopes>) {
  return {
    calendar: f.calendar,
    drive: f.drive,
    sheets: f.sheets,
    docs: f.docs,
    docsWrite: f.docsWrite,
    sheetsWrite: f.sheetsWrite,
    driveFile: f.driveFile,
    legacyConnection: f.legacyConnection,
    gmailSend: f.gmailSend,
    formsBody: f.formsBody,
    formsResponsesRead: f.formsResponsesRead,
    classroomCoursesRead: f.classroomCoursesRead,
    classroomCoursework: f.classroomCoursework,
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  // Google redireciona para .../callback?state=...&code=... (não envia action=callback)
  const isGoogleCallback = (action === 'callback') || (!!code && !!state);

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Callback do Google: não exige Authorization (é redirect do navegador)
    if (isGoogleCallback) {
      if (!code || !state) {
        return new Response(
          JSON.stringify({ error: 'Missing code or state parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Google OAuth error:', tokenData);
        return new Response(
          JSON.stringify({ error: tokenData.error_description || 'Failed to exchange code for token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

      const { data: existingRow } = await supabaseClient
        .from('blog360_google_workspace_tokens')
        .select('refresh_token')
        .eq('user_id', state)
        .maybeSingle();

      const mergedRefresh =
        (typeof tokenData.refresh_token === 'string' && tokenData.refresh_token.length > 0
          ? tokenData.refresh_token
          : null) ?? existingRow?.refresh_token ?? null;

      const { error: dbError } = await supabaseClient
        .from('blog360_google_workspace_tokens')
        .upsert(
          {
            user_id: state,
            access_token: tokenData.access_token,
            refresh_token: mergedRefresh,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
            granted_scopes: typeof tokenData.scope === 'string' ? tokenData.scope : null,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (dbError) {
        console.error('Database error:', dbError);
        return new Response(
          JSON.stringify({ error: 'Failed to save token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return Response.redirect(
        `${BLOG_FRONTEND.replace(/\/$/, '')}/admin-estudio-conteudo.html?google_workspace=connected`
      );
    }

    // Demais ações exigem autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ação 1: Iniciar autenticação OAuth
    if (action === 'start') {
      if (!GOOGLE_CLIENT_ID || !REDIRECT_URI) {
        return new Response(
          JSON.stringify({
            error:
              'Google OAuth do blog: defina o secret BLOG360_GOOGLE_REDIRECT_URI (ex.: https://<ref>.supabase.co/functions/v1/blog360-google-auth). Não use só GOOGLE_REDIRECT_URI — é outro fluxo (PedagoFlow).',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(GOOGLE_OAUTH_SCOPES)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${user.id}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ação 2: Verificar status da conexão
    if (action === 'status') {
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from('blog360_google_workspace_tokens')
        .select('id, expires_at, granted_scopes, refresh_token')
        .eq('user_id', user.id)
        .maybeSingle();

      /** Access token expira ~1h; com refresh_token a conta continua ligada (renovação em getValidGoogleAccessToken). */
      const hasRefresh =
        typeof tokenData?.refresh_token === 'string' && tokenData.refresh_token.trim().length > 0;
      const accessStillValid =
        !!tokenData?.expires_at && new Date(tokenData.expires_at).getTime() > Date.now();
      const isConnected = !tokenError && !!tokenData && (hasRefresh || accessStillValid);

      if (!isConnected) {
        return new Response(
          JSON.stringify({
            connected: false,
            features: emptyFeaturesJson(),
            needsFullReconnect: false,
            needsWriteScopesReconnect: false,
            needsExtendedScopesReconnect: false,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const features = featuresFromScopes(tokenData.granted_scopes ?? null);
      const needsWriteScopesReconnect =
        !features.legacyConnection && (!features.docsWrite || !features.sheetsWrite);
      const needsExtendedScopesReconnect =
        !features.legacyConnection &&
        (!features.gmailSend ||
          !features.formsBody ||
          !features.formsResponsesRead ||
          !features.classroomCoursesRead ||
          !features.classroomCoursework);

      return new Response(
        JSON.stringify({
          connected: true,
          features: featuresToJson(features),
          needsFullReconnect: features.legacyConnection,
          needsWriteScopesReconnect,
          needsExtendedScopesReconnect,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ação 3: Desconectar (deletar token)
    if (action === 'disconnect') {
      const { error: deleteError } = await supabaseClient
        .from('blog360_google_workspace_tokens')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: 'Failed to disconnect' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
