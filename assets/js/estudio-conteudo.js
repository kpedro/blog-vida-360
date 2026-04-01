/**
 * Estúdio de conteúdo — Blog Vida 360º (admin)
 * Chama Edge Functions: generate-blog-studio-content, generate-blog-studio-image, blog-prompt-coach
 */
(function () {
  const STORAGE_SNIPPETS = 'blog360_prompt_snippets_v1';
  const CONTENT_TYPES = {
    landing: { label: 'Landing Page', desc: 'Headlines, benefícios e CTA para página de divulgação', gen: 'Gerar Landing Page' },
    social_post: { label: 'Posts para redes', desc: 'Textos para Instagram, Facebook, LinkedIn', gen: 'Gerar posts para redes' },
    article_copy: { label: 'Artigos e copy', desc: 'Rascunhos de artigo, e-mail ou copy longa', gen: 'Gerar artigo / copy' },
  };

  const DEFAULT_SNIPPETS = [
    {
      title: 'Artigo: estrutura completa',
      content:
        'Escreva um artigo para o blog Vida 360º sobre [TEMA]. Público: [PÚBLICO]. Tom acolhedor e claro. Inclua: introdução que prenda atenção, 3 a 4 subtítulos em Markdown (##), dicas práticas em lista quando fizer sentido, parágrafo de conclusão com convite à reflexão. Não invente dados médicos; sugira buscar profissional quando for caso clínico. Entre 900 e 1400 palavras.',
    },
    {
      title: 'Post Instagram curto',
      content:
        'Post para Instagram sobre [TEMA], tom leve e inspirador, até 400 caracteres na primeira versão, segunda versão um pouco mais longa. Hashtags relevantes ao final. Sem links inventados.',
    },
  ];

  let contentType = 'landing';
  let coachMessages = [];
  let coachPendingContent = '';
  let lastImageDataUrl = '';

  function $(id) {
    return document.getElementById(id);
  }

  function showError(msg) {
    const el = $('error-banner');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 12000);
  }

  function getSupabaseUrl() {
    return window.VITE_SUPABASE_URL || '';
  }

  function getAnonKey() {
    return window.VITE_SUPABASE_ANON_KEY || '';
  }

  function fnHeaders(session) {
    const h = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    };
    const k = getAnonKey();
    if (k) h.apikey = k;
    return h;
  }

  async function getSession() {
    let c = window.supabaseClient;
    if (!c && typeof window.initSupabase === 'function') {
      c = window.initSupabase();
      window.supabaseClient = c;
    }
    if (!c) return null;
    const { data } = await c.auth.getSession();
    return data.session;
  }

  async function requireAuth() {
    const session = await getSession();
    if (!session) {
      window.location.href = 'admin-login.html';
      return null;
    }
    return session;
  }

  function parseGeneratedContent(raw) {
    const sep = '---';
    const idx = raw.indexOf(sep);
    if (idx === -1) return { copy: raw.trim(), imageSuggestion: null };
    const copy = raw.slice(0, idx).trim();
    let after = raw.slice(idx + sep.length).trim();
    const titleMatch = after.match(/^(?:SUGESTÃO\s+DE\s+IMAGEM|Sugestão\s+de\s+imagem)\s*\n?/i);
    if (titleMatch) after = after.slice(titleMatch[0].length).trim();
    const lower = after.toLowerCase();
    const looksLikeSuggestion =
      after.length >= 20 &&
      (lower.includes('descri') ||
        lower.includes('dimens') ||
        lower.includes('onde usar') ||
        /^\s*descrição\s*:/i.test(after));
    const imageSuggestion = after && (titleMatch || looksLikeSuggestion) ? after : null;
    return { copy, imageSuggestion };
  }

  function setTabDescription() {
    const d = $('tab-desc');
    if (!d) return;
    if (contentType === 'history') return;
    const meta = CONTENT_TYPES[contentType];
    d.textContent = meta ? meta.desc : '';
  }

  function setGenerateButtonLabel() {
    const span = $('btn-generate-label');
    if (!span) return;
    if (contentType === 'history') return;
    const meta = CONTENT_TYPES[contentType];
    span.textContent = meta ? meta.gen : 'Gerar';
  }

  function switchTab(type) {
    contentType = type;
    document.querySelectorAll('#type-tabs .tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
    const blockGen = $('block-generate');
    const blockHist = $('block-history');
    if (type === 'history') {
      if (blockGen) blockGen.style.display = 'none';
      if (blockHist) blockHist.style.display = 'block';
      $('tab-desc').textContent = 'Últimas gerações salvas na sua conta';
      loadHistory();
    } else {
      if (blockGen) blockGen.style.display = 'block';
      if (blockHist) blockHist.style.display = 'none';
      setTabDescription();
      setGenerateButtonLabel();
    }
  }

  async function generateContent() {
    const session = await requireAuth();
    if (!session) return;

    const prompt = ($('studio-prompt') && $('studio-prompt').value) || '';
    if (!prompt.trim()) {
      showError('Digite um pedido: tema, público, tom e o que você quer gerar.');
      return;
    }

    const btn = $('btn-generate');
    if (btn) btn.disabled = true;
    if ($('studio-output')) $('studio-output').value = '';
    $('studio-image-prompt').value = '';
    lastImageDataUrl = '';
    if ($('studio-image-preview')) {
      $('studio-image-preview').style.display = 'none';
      $('btn-copy-image-url').style.display = 'none';
    }

    try {
      const res = await fetch(`${getSupabaseUrl()}/functions/v1/generate-blog-studio-content`, {
        method: 'POST',
        headers: fnHeaders(session),
        body: JSON.stringify({ type: contentType, prompt: prompt.trim(), temperature: 0.8 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.details || data.error || res.statusText || 'Erro ao gerar');
      }
      if (!data.content) throw new Error('Resposta inválida da API');

      const { copy, imageSuggestion } = parseGeneratedContent(data.content);
      $('studio-output').value = copy;
      if (imageSuggestion && $('studio-image-prompt')) {
        $('studio-image-prompt').value = imageSuggestion;
      }

      await saveHistoryRow(contentType, prompt.trim(), copy, imageSuggestion);

      window.alert('Conteúdo gerado. Revise e copie ou envie ao editor.');
    } catch (e) {
      showError(e.message || 'Erro ao gerar conteúdo. Verifique se as Edge Functions foram deployadas e se GEMINI_API está configurada.');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function saveHistoryRow(type, promptText, copy, imageSuggestion) {
    const c = window.supabaseClient;
    const session = await getSession();
    if (!c || !session?.user) return;
    try {
      await c.from('blog360_studio_history').insert({
        user_id: session.user.id,
        content_type: type,
        prompt: promptText.slice(0, 8000),
        content: copy.slice(0, 50000),
        image_suggestion: imageSuggestion ? imageSuggestion.slice(0, 4000) : null,
      });
    } catch (err) {
      console.warn('Histórico não salvo (tabela opcional):', err);
    }
  }

  async function loadHistory() {
    const tbody = $('history-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Carregando…</td></tr>';

    const c = window.supabaseClient;
    const session = await getSession();
    if (!c || !session) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Faça login.</td></tr>';
      return;
    }

    try {
      const { data, error } = await c
        .from('blog360_studio_history')
        .select('id, content_type, prompt, content, created_at')
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) throw error;
      if (!data || data.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="empty-state">Nenhum registro. Gere conteúdo nas outras abas ou execute o SQL BLOG360_STUDIO_HISTORY.sql no Supabase.</td></tr>';
        return;
      }

      tbody.innerHTML = data
        .map((row) => {
          const date = new Date(row.created_at).toLocaleString('pt-BR');
          const typeLabel = CONTENT_TYPES[row.content_type]?.label || row.content_type;
          const p = (row.prompt || '').slice(0, 120) + ((row.prompt || '').length > 120 ? '…' : '');
          return `<tr>
            <td><span class="badge">${escapeHtml(typeLabel)}</span></td>
            <td>${escapeHtml(p)}</td>
            <td>${escapeHtml(date)}</td>
            <td><button type="button" class="btn load-hist" data-id="${row.id}">Ver</button></td>
          </tr>`;
        })
        .join('');

      tbody.querySelectorAll('.load-hist').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const row = data.find((r) => r.id === id);
          if (row) {
            $('studio-output').value = row.content || '';
            $('studio-prompt').value = row.prompt || '';
            switchTab(row.content_type || 'article_copy');
          }
        });
      });
    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="empty-state">Não foi possível carregar o histórico. Execute o script SQL blog360_studio_history no Supabase (ver ESTUDIO_CONTEUDO_DEPLOY.md).</td></tr>';
    }
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  async function generateImage() {
    const session = await requireAuth();
    if (!session) return;

    const desc =
      ($('studio-image-prompt') && $('studio-image-prompt').value.trim()) ||
      ($('studio-output') && $('studio-output').value.trim().slice(0, 1500)) ||
      ($('studio-prompt') && $('studio-prompt').value.trim());
    if (!desc) {
      showError('Preencha a descrição da imagem ou gere um texto antes.');
      return;
    }

    const fmt = ($('image-format') && $('image-format').value) || '1:1';
    const btn = $('btn-gen-image');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`${getSupabaseUrl()}/functions/v1/generate-blog-studio-image`, {
        method: 'POST',
        headers: fnHeaders(session),
        body: JSON.stringify({ prompt: desc, format: fmt }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.imageBase64 && data.mimeType) {
        lastImageDataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
        const img = $('studio-image-preview');
        img.src = lastImageDataUrl;
        img.style.display = 'block';
        $('btn-copy-image-url').style.display = 'inline-flex';
      } else {
        throw new Error(data.details || data.error || 'Nenhuma imagem retornada');
      }
    } catch (e) {
      showError(e.message || 'Erro ao gerar imagem.');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function copyOutput() {
    const t = $('studio-output');
    if (!t || !t.value) return;
    navigator.clipboard.writeText(t.value);
    window.alert('Texto copiado.');
  }

  function copyImageDataUrl() {
    if (!lastImageDataUrl) return;
    navigator.clipboard.writeText(lastImageDataUrl);
    window.alert('Data URL copiada. Cole no campo imagem de destaque do editor (ou use um host e substitua por URL).');
  }

  function useInEditor() {
    const body = ($('studio-output') && $('studio-output').value) || '';
    if (!body.trim()) {
      showError('Gere ou cole um texto no resultado antes.');
      return;
    }
    const plain = body.replace(/\n{3,}/g, '\n\n').trim();
    let title = '';
    const m = plain.match(/^#\s+(.+)$/m);
    if (m) title = m[1].trim().slice(0, 120);
    else {
      const first = plain.split('\n')[0] || '';
      title = first.replace(/^\*\*|\*\*$/g, '').slice(0, 120);
    }
    const excerpt = plain
      .replace(/^#+\s*.+/gm, '')
      .replace(/\*\*/g, '')
      .trim()
      .slice(0, 180);

    const payload = {
      title: title || 'Novo artigo',
      excerpt: excerpt || '',
      body: plain,
      imageDataUrl: lastImageDataUrl || '',
    };
    try {
      sessionStorage.setItem('blog360_estudio_payload', JSON.stringify(payload));
    } catch (e) {
      showError('Armazenamento cheio. Copie o texto manualmente.');
      return;
    }
    window.location.href = 'admin-editor-artigo.html';
  }

  /* ---- Assistente ---- */
  function openCoach() {
    coachMessages = [];
    coachPendingContent = '';
    $('coach-chat').innerHTML = '<div class="chat-msg"><div class="who">Assistente</div><div>Olá. O que você quer produzir hoje no blog? (tema, tom, tamanho)</div></div>';
    $('coach-input').value = '';
    $('coach-apply').disabled = true;
    $('modal-coach').classList.add('open');
  }

  function closeCoach() {
    $('modal-coach').classList.remove('open');
  }

  async function sendCoach() {
    const text = ($('coach-input') && $('coach-input').value.trim()) || '';
    if (!text) return;

    const session = await requireAuth();
    if (!session) return;

    coachMessages.push({ role: 'user', content: text });
    appendCoachLine('Você', text, true);
    $('coach-input').value = '';
    $('coach-send').disabled = true;

    try {
      const res = await fetch(`${getSupabaseUrl()}/functions/v1/blog-prompt-coach`, {
        method: 'POST',
        headers: fnHeaders(session),
        body: JSON.stringify({ messages: coachMessages }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.details || 'Erro no assistente');

      const assistantMessage = data.assistantMessage || '';
      const phase = data.phase || 'clarify';
      const suggestedContent = (data.suggestedContent || '').trim();

      const historyAssistant =
        phase === 'deliver' && suggestedContent.length >= 40
          ? `${assistantMessage}\n\n---\n${suggestedContent}`
          : assistantMessage || suggestedContent || '…';
      coachMessages.push({ role: 'assistant', content: historyAssistant });

      appendCoachLine('Assistente', assistantMessage, false);
      if (suggestedContent.length >= 40) {
        appendCoachPromptBlock(suggestedContent);
      }

      const canApply =
        (phase === 'deliver' && suggestedContent.length >= 40) ||
        suggestedContent.length >= 120;

      if (canApply) {
        coachPendingContent = suggestedContent;
        const sp = $('studio-prompt');
        if (sp) sp.value = suggestedContent;
        $('coach-apply').disabled = false;
      } else {
        coachPendingContent = '';
        $('coach-apply').disabled = true;
      }
    } catch (e) {
      appendCoachLine('Sistema', e.message || 'Erro', false);
      showError(e.message || 'Erro no assistente. Deploy blog-prompt-coach?');
    } finally {
      $('coach-send').disabled = false;
    }
  }

  function appendCoachLine(who, text, isUser) {
    const div = document.createElement('div');
    div.className = 'chat-msg' + (isUser ? ' user' : '');
    div.innerHTML = `<div class="who">${escapeHtml(who)}</div><div>${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    $('coach-chat').appendChild(div);
    $('coach-chat').scrollTop = $('coach-chat').scrollHeight;
  }

  function appendCoachPromptBlock(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg coach-prompt-block';
    div.innerHTML =
      '<div class="who">Prompt para o Estúdio (também em «Aplicar»)</div>' +
      `<pre class="coach-prompt-pre">${escapeHtml(text)}</pre>`;
    $('coach-chat').appendChild(div);
    $('coach-chat').scrollTop = $('coach-chat').scrollHeight;
  }

  function applyCoach() {
    if (!coachPendingContent) return;
    const sp = $('studio-prompt');
    if (sp) sp.value = coachPendingContent;
    closeCoach();
  }

  /* ---- Snippets ---- */
  function loadSnippets() {
    try {
      const raw = localStorage.getItem(STORAGE_SNIPPETS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_SNIPPETS.slice();
  }

  function saveSnippets(list) {
    localStorage.setItem(STORAGE_SNIPPETS, JSON.stringify(list));
  }

  function openPrompts() {
    const list = loadSnippets();
    const container = $('prompts-list');
    container.innerHTML = list
      .map(
        (s, i) =>
          `<div class="snippet-item" data-index="${i}"><strong>${escapeHtml(s.title)}</strong><span style="font-size:0.8rem;color:#94a3b8">${escapeHtml(s.content.slice(0, 100))}…</span></div>`
      )
      .join('');
    container.querySelectorAll('.snippet-item').forEach((el) => {
      el.addEventListener('click', (ev) => {
        const i = parseInt(el.getAttribute('data-index'), 10);
        const s = loadSnippets()[i];
        if (!s) return;
        const cur = $('studio-prompt').value.trim();
        if (ev.shiftKey && cur) {
          $('studio-prompt').value = cur + '\n\n' + s.content;
        } else {
          $('studio-prompt').value = s.content;
        }
      });
    });
    $('modal-prompts').classList.add('open');
  }

  function closePrompts() {
    $('modal-prompts').classList.remove('open');
  }

  function saveCurrentSnippet() {
    const title = ($('snippet-title') && $('snippet-title').value.trim()) || 'Modelo sem título';
    const content = ($('studio-prompt') && $('studio-prompt').value.trim()) || '';
    if (!content) {
      window.alert('Escreva um comando no campo principal antes de salvar.');
      return;
    }
    const list = loadSnippets();
    list.unshift({ title, content });
    saveSnippets(list);
    $('snippet-title').value = '';
    window.alert('Modelo salvo.');
    openPrompts();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();

    document.querySelectorAll('#type-tabs .tab').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.type));
    });

    $('btn-generate').addEventListener('click', generateContent);
    $('btn-gen-image').addEventListener('click', generateImage);
    $('btn-copy').addEventListener('click', copyOutput);
    $('btn-copy-image-url').addEventListener('click', copyImageDataUrl);
    $('btn-to-editor').addEventListener('click', useInEditor);

    $('btn-coach').addEventListener('click', openCoach);
    $('modal-coach-close').addEventListener('click', closeCoach);
    $('coach-send').addEventListener('click', sendCoach);
    $('coach-apply').addEventListener('click', applyCoach);
    $('coach-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCoach();
      }
    });

    $('btn-prompts').addEventListener('click', openPrompts);
    $('modal-prompts-close').addEventListener('click', closePrompts);
    $('modal-prompts-done').addEventListener('click', closePrompts);
    $('btn-save-snippet').addEventListener('click', saveCurrentSnippet);

    setTabDescription();
    setGenerateButtonLabel();
  });
})();
