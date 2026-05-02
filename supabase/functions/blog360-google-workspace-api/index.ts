// Proxy seguro: Drive, Docs, Sheets, Gmail (enviar), Forms, Classroom — Blog Vida 360º.
// Tokens na tabela blog360_google_workspace_tokens (isolado do PedagoFlow).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidGoogleAccessToken, featuresFromScopes } from './googleAccessToken.ts';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DRIVE_FILE_FIELDS = 'nextPageToken, files(id,name,mimeType,modifiedTime,webViewLink)';
const MAX_SHEET_ROWS = 80;
const MAX_SHEET_COLS = 26;
const MAX_DOC_CHARS = 120_000;
const MAX_DOC_CREATE_CHARS = 95_000;
const MAX_SHEET_CREATE_ROWS = 500;
const MAX_SHEET_CREATE_COLS = 26;
const DOC_TEXT_CHUNK = 6000;
const MAX_DRIVE_TEXT_BYTES = 4_000_000;

function extractPlainTextFromDoc(doc: {
  body?: { content?: Array<{ paragraph?: { elements?: Array<{ textRun?: { content?: string } }> } }> };
}): string {
  const chunks: string[] = [];
  for (const block of doc.body?.content ?? []) {
    const els = block.paragraph?.elements;
    if (!els) continue;
    for (const el of els) {
      if (el.textRun?.content) chunks.push(el.textRun.content);
    }
  }
  return chunks.join('').trim();
}

function safeFileId(id: string): boolean {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{10,}$/.test(id);
}

function safeCourseId(id: string): boolean {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{5,}$/.test(id.trim());
}

/** MIME simples (texto) para Gmail API `users/me/messages/send`. */
function rfc822PlainText(to: string, subject: string, body: string): string {
  const sub = String(subject).replace(/\r?\n/g, ' ').trim().slice(0, 900);
  const text = String(body).slice(0, 500_000);
  return [
    `To: ${to.trim()}`,
    `Subject: ${sub}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    text,
  ].join('\r\n');
}

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    const tokenResult = await getValidGoogleAccessToken(
      supabaseClient,
      user.id,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    if ('error' in tokenResult) {
      return new Response(JSON.stringify({ error: tokenResult.error }), {
        status: tokenResult.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = tokenResult.access_token;
    const scopeFeatures = featuresFromScopes(tokenResult.granted_scopes);

    if (action === 'drive_list') {
      const pageSize = Math.min(Math.max(Number(body.pageSize) || 15, 1), 30);
      const folderId = typeof body.folderId === 'string' ? body.folderId.trim() : '';
      const pageToken = typeof body.pageToken === 'string' ? body.pageToken : '';

      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('pageSize', String(pageSize));
      url.searchParams.set('fields', DRIVE_FILE_FIELDS);
      url.searchParams.set('orderBy', 'modifiedTime desc');
      url.searchParams.set(
        'q',
        folderId && safeFileId(folderId)
          ? `'${folderId}' in parents and trashed=false`
          : 'trashed=false'
      );
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({
            error: data.error?.message || 'Falha ao listar arquivos do Drive',
          }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'drive_create_json') {
      if (!scopeFeatures.driveFile) {
        return new Response(
          JSON.stringify({
            error: 'Sem permissão para gravar no Drive. Volte a ligar o Google no Estúdio Blog.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      let name =
        typeof body.name === 'string' ? body.name.replace(/[\r\n]+/g, ' ').trim().slice(0, 200) : '';
      if (!name) name = `blog360-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const content = typeof body.content === 'string' ? body.content : '';
      if (!content.trim()) {
        return new Response(JSON.stringify({ error: 'Conteúdo do arquivo está vazio' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const metadata = {
        name,
        mimeType: 'application/json',
      };
      const boundary = `blog360_${crypto.randomUUID()}`;
      const multipartBody =
        `--${boundary}\r\n` +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        `${content}\r\n` +
        `--${boundary}--`;

      const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        return new Response(
          JSON.stringify({ error: created.error?.message || 'Falha ao criar arquivo no Drive' }),
          { status: createRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify(created), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'drive_get_file_text') {
      const fileId = typeof body.fileId === 'string' ? body.fileId.trim() : '';
      if (!safeFileId(fileId)) {
        return new Response(JSON.stringify({ error: 'fileId inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,webViewLink`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const meta = await metaRes.json();
      if (!metaRes.ok) {
        return new Response(
          JSON.stringify({ error: meta.error?.message || 'Falha ao ler metadados do arquivo' }),
          { status: metaRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const size = Number(meta.size || 0);
      if (Number.isFinite(size) && size > MAX_DRIVE_TEXT_BYTES) {
        return new Response(
          JSON.stringify({ error: 'Arquivo muito grande para restauração no app' }),
          { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const mediaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const text = await mediaRes.text();
      if (!mediaRes.ok) {
        let err = 'Falha ao baixar arquivo do Drive';
        try {
          const parsed = JSON.parse(text);
          err = parsed?.error?.message || err;
        } catch {
          // ignore
        }
        return new Response(JSON.stringify({ error: err }), {
          status: mediaRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          file: {
            id: meta.id,
            name: meta.name,
            mimeType: meta.mimeType,
            webViewLink: meta.webViewLink,
          },
          text,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'doc_get') {
      const documentId = typeof body.documentId === 'string' ? body.documentId.trim() : '';
      if (!safeFileId(documentId)) {
        return new Response(JSON.stringify({ error: 'documentId inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(
        `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const doc = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: doc.error?.message || 'Falha ao ler documento' }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      let plainText = extractPlainTextFromDoc(doc);
      if (plainText.length > MAX_DOC_CHARS) {
        plainText = plainText.slice(0, MAX_DOC_CHARS) + '\n… (texto truncado)';
      }
      return new Response(
        JSON.stringify({
          documentId,
          title: doc.title ?? '',
          plainText,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sheet_values') {
      const spreadsheetId = typeof body.spreadsheetId === 'string' ? body.spreadsheetId.trim() : '';
      const range = typeof body.range === 'string' ? body.range.trim() : 'A1:Z50';
      if (!safeFileId(spreadsheetId)) {
        return new Response(JSON.stringify({ error: 'spreadsheetId inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (range.length > 80 || /["'\n\r\\]/.test(range)) {
        return new Response(JSON.stringify({ error: 'Intervalo (range) inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: data.error?.message || 'Falha ao ler planilha' }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const rows = Array.isArray(data.values) ? data.values : [];
      const clipped = rows.slice(0, MAX_SHEET_ROWS).map((row: string[]) =>
        (row ?? []).slice(0, MAX_SHEET_COLS)
      );

      return new Response(
        JSON.stringify({
          spreadsheetId,
          range: data.range ?? range,
          values: clipped,
          truncated: rows.length > MAX_SHEET_ROWS,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'doc_create') {
      if (!scopeFeatures.docsWrite) {
        return new Response(
          JSON.stringify({
            error:
              'Sem permissão para criar Google Docs. Desligue e volte a ligar o Google no Estúdio Blog (menu Google → Conectar).',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      let title =
        typeof body.title === 'string' ? body.title.replace(/[\r\n]+/g, ' ').trim().slice(0, 200) : '';
      if (!title) title = 'Blog Vida 360º';
      let text = typeof body.text === 'string' ? body.text : '';
      if (text.length > MAX_DOC_CREATE_CHARS) {
        text =
          text.slice(0, MAX_DOC_CREATE_CHARS) +
          '\n\n… (conteúdo truncado pelo limite do servidor)';
      }

      const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        return new Response(
          JSON.stringify({ error: created.error?.message || 'Falha ao criar Google Doc' }),
          { status: createRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const documentId = created.documentId as string;
      let insertIndex = 1;
      for (let i = 0; i < text.length; i += DOC_TEXT_CHUNK) {
        const chunk = text.slice(i, i + DOC_TEXT_CHUNK);
        const batchRes = await fetch(
          `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [{ insertText: { location: { index: insertIndex }, text: chunk } }],
            }),
          }
        );
        const batchData = await batchRes.json();
        if (!batchRes.ok) {
          return new Response(
            JSON.stringify({
              error: batchData.error?.message || 'Falha ao preencher o documento',
              documentId,
            }),
            { status: batchRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        insertIndex += chunk.length;
      }

      return new Response(
        JSON.stringify({
          documentId,
          title: created.title ?? title,
          webViewLink: `https://docs.google.com/document/d/${documentId}/edit`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sheet_create') {
      if (!scopeFeatures.sheetsWrite) {
        return new Response(
          JSON.stringify({
            error:
              'Sem permissão para criar Planilhas. Volte a ligar o Google no Estúdio Blog.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      let title =
        typeof body.title === 'string' ? body.title.replace(/[\r\n]+/g, ' ').trim().slice(0, 200) : '';
      if (!title) title = 'Blog Vida 360º';
      const rawValues = Array.isArray(body.values) ? body.values : [];
      const values = rawValues.slice(0, MAX_SHEET_CREATE_ROWS).map((row: unknown) => {
        const r = Array.isArray(row) ? row : [];
        return r.slice(0, MAX_SHEET_CREATE_COLS).map((cell: unknown) =>
          String(cell ?? '')
            .replace(/\r?\n/g, ' ')
            .slice(0, 5000)
        );
      });

      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { title },
          sheets: [
            {
              properties: {
                title: 'Dados',
                gridProperties: { rowCount: 1000, columnCount: 26 },
              },
            },
          ],
        }),
      });
      const sh = await createRes.json();
      if (!createRes.ok) {
        return new Response(
          JSON.stringify({ error: sh.error?.message || 'Falha ao criar planilha' }),
          { status: createRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const spreadsheetId = sh.spreadsheetId as string;

      if (values.length > 0) {
        const putRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent('Dados!A1')}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values }),
          }
        );
        const putData = await putRes.json();
        if (!putRes.ok) {
          return new Response(
            JSON.stringify({
              error: putData.error?.message || 'Falha ao gravar dados na planilha',
              spreadsheetId,
            }),
            { status: putRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({
          spreadsheetId,
          title: sh.properties?.title ?? title,
          webViewLink:
            sh.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'gmail_send') {
      if (!scopeFeatures.gmailSend) {
        return new Response(
          JSON.stringify({
            error:
              'Sem permissão para enviar e-mail (Gmail). Volte a ligar no Estúdio Blog e autorize gmail.send.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const to = typeof body.to === 'string' ? body.to.trim() : '';
      const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
      const text = typeof body.text === 'string' ? body.text : '';
      if (!to || !EMAIL_RE.test(to)) {
        return new Response(JSON.stringify({ error: 'Destinatário (to) inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!subject) {
        return new Response(JSON.stringify({ error: 'Assunto obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const raw = utf8ToBase64Url(rfc822PlainText(to, subject, text));
      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        return new Response(
          JSON.stringify({ error: sendData.error?.message || 'Falha ao enviar e-mail' }),
          { status: sendRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, id: sendData.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'forms_create') {
      if (!scopeFeatures.formsBody) {
        return new Response(
          JSON.stringify({
            error: 'Sem permissão para criar Formulários. Volte a ligar o Google no Estúdio Blog.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      let title =
        typeof body.title === 'string' ? body.title.replace(/[\r\n]+/g, ' ').trim().slice(0, 200) : '';
      if (!title) title = 'Blog Vida 360º — Formulário';
      const documentTitle =
        typeof body.documentTitle === 'string'
          ? body.documentTitle.replace(/[\r\n]+/g, ' ').trim().slice(0, 200)
          : title;
      const formRes = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          info: { title, documentTitle },
        }),
      });
      const formData = await formRes.json();
      if (!formRes.ok) {
        return new Response(
          JSON.stringify({ error: formData.error?.message || 'Falha ao criar formulário' }),
          { status: formRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const formId = formData.formId as string;
      return new Response(
        JSON.stringify({
          formId,
          responderUri: formData.responderUri ?? `https://docs.google.com/forms/d/${formId}/viewform`,
          editUri: `https://docs.google.com/forms/d/${formId}/edit`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'forms_responses_list') {
      if (!scopeFeatures.formsResponsesRead) {
        return new Response(
          JSON.stringify({
            error: 'Sem permissão para ler respostas de formulários. Volte a ligar o Google no Estúdio Blog.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const formId = typeof body.formId === 'string' ? body.formId.trim() : '';
      if (!formId || !safeFileId(formId)) {
        return new Response(JSON.stringify({ error: 'formId inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const pageToken = typeof body.pageToken === 'string' ? body.pageToken : '';
      const url = new URL(
        `https://forms.googleapis.com/v1/forms/${encodeURIComponent(formId)}/responses`
      );
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: data.error?.message || 'Falha ao listar respostas' }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'classroom_courses_list') {
      if (!scopeFeatures.classroomCoursesRead) {
        return new Response(
          JSON.stringify({
            error: 'Sem permissão para listar turmas (Classroom). Volte a ligar o Google no Estúdio Blog.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const pageToken = typeof body.pageToken === 'string' ? body.pageToken : '';
      const url = new URL('https://classroom.googleapis.com/v1/courses');
      url.searchParams.set('courseStates', 'ACTIVE');
      url.searchParams.set('pageSize', '30');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: data.error?.message || 'Falha ao listar turmas' }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const courses = (data.courses ?? []).map((c: { id?: string; name?: string; section?: string }) => ({
        id: c.id,
        name: c.name,
        section: c.section,
      }));
      return new Response(
        JSON.stringify({ courses, nextPageToken: data.nextPageToken }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'classroom_coursework_create') {
      if (!scopeFeatures.classroomCoursework) {
        return new Response(
          JSON.stringify({
            error:
              'Sem permissão para criar atividades no Classroom. Volte a ligar no Estúdio Blog (escopo coursework.students).',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
      const cwTitle = typeof body.title === 'string' ? body.title.trim().slice(0, 300) : '';
      const description = typeof body.description === 'string' ? body.description.slice(0, 20_000) : '';
      if (!safeCourseId(courseId)) {
        return new Response(JSON.stringify({ error: 'courseId inválido (use o ID numérico da turma)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!cwTitle) {
        return new Response(JSON.stringify({ error: 'Título da atividade obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const payload = {
        title: cwTitle,
        description,
        workType: 'ASSIGNMENT',
        state: 'PUBLISHED',
      };
      const cwRes = await fetch(
        `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const cwData = await cwRes.json();
      if (!cwRes.ok) {
        return new Response(
          JSON.stringify({ error: cwData.error?.message || 'Falha ao criar atividade' }),
          { status: cwRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          id: cwData.id,
          title: cwData.title,
          alternateLink: cwData.alternateLink,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('google-workspace-api:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
