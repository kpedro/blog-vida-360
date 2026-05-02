/**
 * Estúdio de conteúdo — Blog Vida 360º (admin)
 * Chama Edge Functions: generate-blog-studio-content, generate-blog-studio-image, blog-prompt-coach
 */
(function () {
  const STORAGE_SNIPPETS = 'blog360_prompt_snippets_v1';
  const STORAGE_OVERLAY_ACCENT = 'blog360_overlay_accent_v1';
  const CONTENT_TYPES = {
    landing: { label: 'Landing Page', desc: 'Headlines, benefícios e CTA para rotina, aromaterapia e bem-estar', gen: 'Gerar Landing Page' },
    social_post: {
      label: 'Posts para redes',
      desc: 'Legenda estilo Instagram (gancho, corpo, CTA, hashtags) + variante; foco em sono, ansiedade leve e aromaterapia',
      gen: 'Gerar posts para redes',
    },
    article_copy: { label: 'Artigos e copy', desc: 'Rascunhos de artigo, e-mail ou copy longa sobre aromaterapia prática', gen: 'Gerar artigo / copy' },
  };

  const DEFAULT_SNIPPETS = [
    {
      title: 'Artigo: estrutura completa',
      content:
        'Escreva um artigo para o blog Vida 360º sobre [TEMA] ligado a sono, ansiedade leve, foco ou aromaterapia segura. Público: [PÚBLICO]. Tom acolhedor e claro. Inclua: introdução que prenda atenção, 3 a 4 subtítulos em Markdown (##), dicas práticas em lista quando fizer sentido, parágrafo de conclusão com próximo passo simples. Não faça alegações médicas; sugira buscar profissional quando for caso clínico. Entre 900 e 1400 palavras.',
    },
    {
      title: 'Post Instagram curto',
      content:
        'Legenda para Instagram sobre [TEMA] (sono, ansiedade leve ou aromaterapia), tom leve e confiável. Estrutura: (1) primeira linha gancho, (2) corpo 2-5 linhas, (3) CTA "link na bio" se fizer sentido, (4) 5-10 hashtags. Limite total 2200 caracteres. Sem links inventados.',
    },
  ];

  let contentType = 'landing';
  let coachMessages = [];
  let coachPendingContent = '';
  let lastImageDataUrl = '';
  let lastImageMimeType = '';
  /** PNG com texto desenhado (capa); preferido em «Usar no editor» e descarregar final */
  let lastCompositeDataUrl = '';
  let lastSuggestedHeadline = '';
  let lastSuggestedCategory = '';

  function $(id) {
    return document.getElementById(id);
  }

  function showError(msg, sticky = false) {
    const el = $('error-banner');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (!sticky) {
      setTimeout(() => el.classList.remove('show'), 12000);
    }
  }

  function clearError() {
    const el = $('error-banner');
    if (!el) return;
    el.textContent = '';
    el.classList.remove('show');
  }

  function getSupabaseUrl() {
    return window.VITE_SUPABASE_URL || '';
  }

  function isFileProtocol() {
    return typeof location !== 'undefined' && location.protocol === 'file:';
  }

  /** Lê corpo JSON mesmo quando a função devolve texto de erro. */
  async function readEdgeFunctionBody(res) {
    const raw = await res.text();
    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (_) {
        data = { _nonJson: true };
      }
    }
    return { raw, data };
  }

  function explainEdgeFunctionHttpError(functionName, status, data, raw) {
    const detail =
      (data && typeof data === 'object' && !data._nonJson && (data.details || data.error)) || '';
    const snippet = (typeof raw === 'string' && raw.length ? raw : '').slice(0, 500);
    if (status === 401) {
      return 'Sessão expirada ou sem permissão. Abra admin-login.html e entre de novo.';
    }
    if (status === 404) {
      return `Função «${functionName}» não encontrada. Faça deploy dessa Edge Function no Supabase (Dashboard → Edge Functions).`;
    }
    if (status === 429) {
      return detail || 'Limite de pedidos à API. Tente daqui a pouco.';
    }
    if (status >= 500) {
      if (/GEMINI_API/i.test(String(detail))) {
        return 'Configure o segredo GEMINI_API no Supabase (Edge Functions → Secrets) e faça redeploy das funções do Estúdio.';
      }
      return detail || snippet || `Erro no servidor (${status}). Veja Supabase → Edge Functions → Logs.`;
    }
    return detail || snippet || `Erro HTTP ${status}`;
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
      if ($('studio-output') && $('studio-output').value.trim()) {
        refreshOverlaySuggestionsFromCopy();
      }
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

    if (!getSupabaseUrl().trim()) {
      showError(
        'URL do Supabase não definida (window.VITE_SUPABASE_URL). No HTML do Estúdio deve existir o script que define VITE_SUPABASE_URL.',
        true
      );
      return;
    }
    if (isFileProtocol()) {
      showError(
        'Abra esta página por HTTP, não como arquivo (file://). No Cursor/terminal: npm run dev e acesse http://localhost:8080/admin-estudio-conteudo.html — assim o navegador permite chamar o Supabase.',
        true
      );
      return;
    }

    const btn = $('btn-generate');
    if (btn) btn.disabled = true;
    clearError();
    hideOverlaySuggestionPanel();
    $('studio-image-prompt').value = '';
    lastImageDataUrl = '';
    lastImageMimeType = '';
    clearOverlayComposite();
    if ($('studio-image-preview')) {
      $('studio-image-preview').style.display = 'none';
      $('btn-copy-image-url').style.display = 'none';
    }
    const rowDl = $('row-download-variants');
    if (rowDl) rowDl.style.display = 'none';

    try {
      const res = await fetch(`${getSupabaseUrl()}/functions/v1/generate-blog-studio-content`, {
        method: 'POST',
        headers: fnHeaders(session),
        body: JSON.stringify({ type: contentType, prompt: prompt.trim(), temperature: 0.8 }),
      });
      const { raw: bodyRaw, data } = await readEdgeFunctionBody(res);
      if (!res.ok) {
        console.error('[Estúdio] generate-blog-studio-content', res.status, bodyRaw);
        throw new Error(
          explainEdgeFunctionHttpError('generate-blog-studio-content', res.status, data, bodyRaw)
        );
      }

      const generated =
        (data && (data.content || data.generatedText || data.text || data.result || data.output)) ||
        '';
      if (!generated || !generated.trim()) {
        throw new Error('A função respondeu, mas sem conteúdo gerado. Verifique a configuração da GEMINI_API no Supabase.');
      }

      const { copy, imageSuggestion } = parseGeneratedContent(generated);
      $('studio-output').value = copy;
      if (imageSuggestion && $('studio-image-prompt')) {
        $('studio-image-prompt').value = imageSuggestion;
      }

      await saveHistoryRow(contentType, prompt.trim(), copy, imageSuggestion);

      refreshOverlaySuggestionsFromCopy();

      window.alert('Conteúdo gerado. Revise e copie ou envie ao editor.');
    } catch (e) {
      let msg =
        (e && e.message) ||
        'Erro ao gerar conteúdo. Verifique se as Edge Functions foram deployadas e se GEMINI_API está configurada.';
      if (
        msg === 'Failed to fetch' ||
        /network/i.test(msg) ||
        (typeof msg === 'string' && msg.includes('Load failed'))
      ) {
        msg =
          'Sem ligação ao Supabase (Failed to fetch). Use http://localhost com npm run dev (não file://); confirme VPN/firewall e se o projeto Supabase está online.';
      }
      showError(msg, true);
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

  /**
   * Heurísticas a partir do texto em «Resultado» (artigo, legenda, landing).
   * Não chama API — só analisa o copy já gerado.
   */
  function computeHeadlineSuggestion(text, type) {
    let body = String(text || '')
      .replace(/\r\n/g, '\n')
      .trim();
    if (!body) return '';
    body = body.replace(/\n---[\s\S]*$/m, '').trim();

    const h1 = body.match(/^#\s+(.+)$/m);
    if (h1) {
      const title = h1[1].trim();
      const h2 = body.match(/^##\s+(.+)$/m);
      if (h2 && title.length < 130) {
        return `${title}\n${h2[1].trim()}`.slice(0, 2000);
      }
      if (title.length > 50) {
        const cut = title.lastIndexOf(' ', 44);
        if (cut > 12) {
          return `${title.slice(0, cut)}\n${title.slice(cut + 1)}`.slice(0, 2000);
        }
      }
      return title.slice(0, 2000);
    }

    if (type === 'social_post') {
      const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
      const take = [];
      const maxBundle = 900;
      function softTruncateParagraph(text, maxLen) {
        const t = (text || '').trim();
        if (t.length <= maxLen) return t;
        const slice = t.slice(0, maxLen);
        const endSentence = Math.max(
          slice.lastIndexOf('. '),
          slice.lastIndexOf('! '),
          slice.lastIndexOf('? ')
        );
        if (endSentence > maxLen * 0.45) {
          return slice.slice(0, endSentence + 1).trim();
        }
        const sp = slice.lastIndexOf(' ');
        if (sp > maxLen * 0.5) return slice.slice(0, sp).trim();
        return slice.trim();
      }
      for (let i = 0; i < lines.length && take.length < 8; i++) {
        const raw = lines[i];
        if (/^#{1,6}\s/.test(raw)) break;
        if (/^[*-]\s{1,4}\S/.test(raw) && take.length >= 2) break;
        const taggy = (raw.match(/#/g) || []).length >= 4 && raw.length < 80;
        if (taggy && take.length) break;
        let ln = raw.replace(/^\*\*|\*\*$/g, '').trim();
        if (!ln) continue;
        if (take.join('\n').length >= maxBundle) break;
        const room = maxBundle - take.join('\n').length - (take.length ? 1 : 0);
        if (room < 12) break;
        if (ln.length > room) {
          ln = softTruncateParagraph(ln, room);
        }
        if (ln) take.push(ln);
      }
      if (take.length) return take.join('\n').slice(0, 2000);
    }

    const blocks = body.split(/\n\s*\n/);
    const first = (blocks[0] || body).trim();
    const linesOut = first
      .split('\n')
      .map((l) => l.replace(/^\*\*|\*\*$/g, '').replace(/^#+\s*/, '').trim())
      .filter((l) => l && !/^([*_]{1,2}\s*)+$/.test(l))
      .slice(0, 6);

    if (linesOut.length >= 2) {
      return linesOut.join('\n').slice(0, 2000);
    }

    const one = linesOut[0] || first.replace(/^#+\s*/, '').slice(0, 500);
    if (one.length > 56) {
      const cut = one.lastIndexOf(' ', 50);
      if (cut > 16) {
        return `${one.slice(0, cut)}\n${one.slice(cut + 1)}`.slice(0, 2000);
      }
    }
    return one.slice(0, 2000);
  }

  function computeCategorySuggestion(text, type) {
    const lower = String(text || '').toLowerCase();
    const rules = [
      ['ansiedade', 'ANSIEDADE'],
      ['sono', 'SONO'],
      ['insónia', 'SONO'],
      ['insônia', 'SONO'],
      ['insonia', 'SONO'],
      ['aromaterapia', 'AROMATERAPIA'],
      ['óleos essenciais', 'ÓLEOS'],
      ['oleos essenciais', 'ÓLEOS'],
      ['óleo essencial', 'ÓLEOS'],
      ['doterra', 'DOTERRA'],
      ['bem-estar', 'BEM-ESTAR'],
      ['bem estar', 'BEM-ESTAR'],
      ['rotina', 'ROTINA'],
      ['foco', 'FOCO'],
      ['respiração', 'RESPIRAÇÃO'],
      ['respiracao', 'RESPIRAÇÃO'],
      ['meditação', 'MEDITAÇÃO'],
      ['meditacao', 'MEDITAÇÃO'],
      ['pele', 'PELE'],
      ['humidificador', 'HOGAR'],
      ['instagram', 'REDES'],
      ['hashtag', 'REDES'],
      ['reels', 'REDES'],
      ['stories', 'REDES'],
      ['landing', 'DIVULGAÇÃO'],
      ['cta', 'DIVULGAÇÃO'],
    ];
    for (let i = 0; i < rules.length; i++) {
      if (lower.includes(rules[i][0])) return rules[i][1].slice(0, 80);
    }
    const fallback = {
      landing: 'DIVULGAÇÃO',
      social_post: 'REDES',
      article_copy: 'ARTIGO',
    };
    return String(fallback[type] || 'VIDA 360').slice(0, 80);
  }

  function computeOverlaySuggestions(rawText, tabType) {
    const headline = computeHeadlineSuggestion(rawText, tabType);
    const category = computeCategorySuggestion(rawText, tabType);
    return { headline, category };
  }

  function hideOverlaySuggestionPanel() {
    const panel = $('overlay-suggest-panel');
    if (panel) panel.style.display = 'none';
  }

  function fillSuggestionPanel(category, headline) {
    lastSuggestedCategory = category != null ? String(category).trim() : '';
    lastSuggestedHeadline = headline != null ? String(headline).trim() : '';
    const panel = $('overlay-suggest-panel');
    const catEl = $('overlay-suggest-category-text');
    const headEl = $('overlay-suggest-headline-text');
    if (catEl) catEl.textContent = lastSuggestedCategory || '—';
    if (headEl) headEl.textContent = lastSuggestedHeadline || '—';
    const has = !!(lastSuggestedHeadline || lastSuggestedCategory);
    if (panel) panel.style.display = has ? 'block' : 'none';
    return has;
  }

  function refreshOverlaySuggestionsFromCopy() {
    const out = ($('studio-output') && $('studio-output').value) || '';
    const trimmed = out.trim();
    if (!trimmed) {
      lastSuggestedHeadline = '';
      lastSuggestedCategory = '';
      hideOverlaySuggestionPanel();
      return false;
    }
    const p = computeOverlaySuggestions(out, contentType);
    return fillSuggestionPanel(p.category, p.headline);
  }

  function applyOverlaySuggestions(mode) {
    if (mode === 'both' || mode === 'category') {
      const c = $('overlay-category');
      if (c && lastSuggestedCategory) c.value = lastSuggestedCategory;
    }
    if (mode === 'both' || mode === 'headline') {
      const h = $('overlay-headline');
      if (h && lastSuggestedHeadline) h.value = lastSuggestedHeadline;
    }
  }

  function onSuggestFromCopyClick() {
    const out = ($('studio-output') && $('studio-output').value) || '';
    if (!out.trim()) {
      showError('Gere ou cole um texto na área «Resultado» primeiro.');
      return;
    }
    clearError();
    refreshOverlaySuggestionsFromCopy();
    if (!lastSuggestedHeadline && !lastSuggestedCategory) {
      showError('Não foi possível extrair sugestões desse texto.');
    }
  }

  /** Após gerar imagem: mostra painel se já houver resultado de texto. */
  function offerOverlaySuggestionsAfterImage() {
    const out = ($('studio-output') && $('studio-output').value.trim()) || '';
    if (!out) return;
    refreshOverlaySuggestionsFromCopy();
  }

  async function suggestOverlayFromAI() {
    const out = ($('studio-output') && $('studio-output').value) || '';
    if (!out.trim()) {
      showError('Gere ou cole um texto na área «Resultado» primeiro.');
      return;
    }
    if (!getSupabaseUrl().trim()) {
      showError('URL do Supabase não definida.', true);
      return;
    }
    if (isFileProtocol()) {
      showError('Abra por HTTP (npm run dev), não como file://.', true);
      return;
    }

    const session = await requireAuth();
    if (!session) return;

    clearError();
    const btn = $('btn-overlay-suggest-ai');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(`${getSupabaseUrl()}/functions/v1/blog-studio-overlay-suggest`, {
        method: 'POST',
        headers: fnHeaders(session),
        body: JSON.stringify({
          content: out.slice(0, 120000),
          contentType: contentType,
        }),
      });
      const { raw, data } = await readEdgeFunctionBody(res);
      if (!res.ok) {
        throw new Error(
          explainEdgeFunctionHttpError('blog-studio-overlay-suggest', res.status, data, raw)
        );
      }
      const headline = (data && data.headline) != null ? String(data.headline).trim() : '';
      const category = (data && data.category) != null ? String(data.category).trim() : '';
      if (!headline && !category) {
        throw new Error('A função respondeu sem manchete nem categoria.');
      }
      fillSuggestionPanel(category, headline);
    } catch (e) {
      let msg =
        (e && e.message) ||
        'Erro ao obter sugestão por IA. Use «Sugestão rápida (local)» ou verifique o deploy da função.';
      if (
        msg === 'Failed to fetch' ||
        /network/i.test(msg) ||
        (typeof msg === 'string' && msg.includes('Load failed'))
      ) {
        msg =
          'Sem ligação ao Supabase. Use http://localhost (npm run dev), não file://; verifique rede e deploy da função blog-studio-overlay-suggest.';
      }
      showError(msg, /GEMINI_API|404|não encontrada/i.test(String(msg)));
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function normalizeAccentColor(hex) {
    if (hex == null || typeof hex !== 'string') return '';
    const h = hex.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h.toUpperCase();
    if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
      return (
        '#' +
        h[1] +
        h[1] +
        h[2] +
        h[2] +
        h[3] +
        h[3]
      ).toUpperCase();
    }
    return '';
  }

  function getSelectedAccentColor() {
    const input = $('overlay-accent-custom');
    if (input && input.value) {
      const n = normalizeAccentColor(input.value);
      if (n) return n;
    }
    const active = document.querySelector('#overlay-palette .overlay-swatch.active');
    if (active && active.getAttribute('data-color')) {
      return normalizeAccentColor(active.getAttribute('data-color')) || '#EEFF33';
    }
    return '#EEFF33';
  }

  function saveAccentPreference(hex) {
    const n = normalizeAccentColor(hex);
    if (!n) return;
    try {
      localStorage.setItem(STORAGE_OVERLAY_ACCENT, n);
    } catch (e) {}
  }

  function initOverlayPalette() {
    const palette = $('overlay-palette');
    const colorInput = $('overlay-accent-custom');
    if (!palette || !colorInput) return;

    let saved = '';
    try {
      saved = localStorage.getItem(STORAGE_OVERLAY_ACCENT) || '';
    } catch (e) {}
    const normalized = normalizeAccentColor(saved);
    if (normalized) {
      colorInput.value = normalized.length === 7 ? normalized : '#EEFF33';
      let matched = false;
      palette.querySelectorAll('.overlay-swatch').forEach((btn) => {
        const c = normalizeAccentColor(btn.getAttribute('data-color') || '');
        btn.classList.toggle('active', c === normalized);
        if (c === normalized) matched = true;
      });
      if (!matched) {
        palette.querySelectorAll('.overlay-swatch').forEach((b) => b.classList.remove('active'));
      }
    }

    palette.querySelectorAll('.overlay-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = btn.getAttribute('data-color');
        const n = normalizeAccentColor(c);
        if (!n) return;
        palette.querySelectorAll('.overlay-swatch').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        colorInput.value = n.length === 7 ? n : '#EEFF33';
        saveAccentPreference(n);
      });
    });

    colorInput.addEventListener('input', () => {
      const n = normalizeAccentColor(colorInput.value);
      if (n) {
        palette.querySelectorAll('.overlay-swatch').forEach((b) => b.classList.remove('active'));
        colorInput.value = n.length === 7 ? n : colorInput.value;
        saveAccentPreference(n);
      }
    });
  }

  /** Atualiza os três moldes (desktop / tablet / telemóvel) com a capa atual ou só a imagem da IA. */
  function updatePostDevicePreviews() {
    const url = lastCompositeDataUrl || lastImageDataUrl || '';
    const section = $('post-preview-section');
    const ids = ['preview-desktop-inner', 'preview-tablet-inner', 'preview-phone-inner'];
    ids.forEach((id) => {
      const el = $(id);
      if (!el) return;
      if (url) {
        el.src = url;
        el.style.display = 'block';
      } else {
        el.removeAttribute('src');
        el.style.display = 'none';
      }
    });
    if (section) section.style.display = url ? 'block' : 'none';
  }

  function wrapLinesCanvas(ctx, text, maxWidth) {
    const blocks = String(text || '')
      .split(/\n/)
      .map((b) => b.trim())
      .filter(Boolean);
    const out = [];
    for (const block of blocks) {
      const words = block.split(/\s+/);
      let line = '';
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          if (line) out.push(line);
          line = word;
        }
      }
      if (line) out.push(line);
    }
    return out.length ? out : [];
  }

  /**
   * Desenha gradiente + categoria (faixa amarela) + manchete alinhados à esquerda no terço INFERIOR
   * (padrão comum em artes para Instagram / citação) + rodapé centrado na base.
   */
  function renderNewsStyleOverlay(sourceDataUrl, options) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (!w || !h) {
            reject(new Error('Dimensões da imagem inválidas.'));
            return;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas não disponível.'));
            return;
          }
          ctx.drawImage(img, 0, 0);

          /* Escurece sobretudo a base (terço inferior): padrão habitual em artes para redes / “quote cards”. */
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, 'rgba(0,0,0,0.06)');
          grad.addColorStop(0.5, 'rgba(0,0,0,0.18)');
          grad.addColorStop(0.72, 'rgba(0,0,0,0.45)');
          grad.addColorStop(1, 'rgba(0,0,0,0.78)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          const pad = Math.max(14, Math.round(w * 0.045));
          const accentRaw = options.accent != null ? String(options.accent).trim() : '';
          const accent = normalizeAccentColor(accentRaw) || '#EEFF33';
          const upper = options.uppercase !== false;

          const category = (options.category || '').trim();
          const headline = (options.headline || '').trim();
          if (!headline) {
            reject(new Error('Escreva a manchete antes de gerar a capa.'));
            return;
          }

          const headSize = Math.max(18, Math.round(w * 0.046));
          ctx.font = `800 ${headSize}px "Segoe UI", Arial, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          const maxTextW = w - pad * 2;
          const displayHead = upper ? headline.toUpperCase() : headline;
          const lines = wrapLinesCanvas(ctx, displayHead, maxTextW);
          if (!lines.length) {
            reject(new Error('Manchete vazia.'));
            return;
          }
          const lineGap = headSize * 1.12;
          const headlineBlockH = lines.length * lineGap;

          let catSize = 14;
          let rowH = 0;
          let barW = 6;
          if (category) {
            catSize = Math.max(14, Math.round(w * 0.026));
            rowH = catSize * 1.85;
            barW = Math.max(6, Math.round(catSize * 0.34));
          }

          const footer = (options.footer || '').trim();
          let footSize = 0;
          if (footer) {
            footSize = Math.max(10, Math.round(w * 0.02));
          }

          const catGap = pad * 0.45;
          const footReserve = footer ? footSize * 1.38 + pad * 0.42 : 0;
          const blockBottom = h - pad - footReserve - pad * 0.2;

          let headlineTop = blockBottom - headlineBlockH;
          let categoryTop = category ? headlineTop - catGap - rowH : headlineTop;

          const minTop = pad * 0.85;
          if (categoryTop < minTop) {
            const shift = minTop - categoryTop;
            categoryTop += shift;
            headlineTop += shift;
          }

          if (category) {
            ctx.fillStyle = accent;
            ctx.fillRect(pad, categoryTop, barW, rowH);
            ctx.font = `700 ${catSize}px "Segoe UI", Arial, sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            const chev = '» » ';
            ctx.fillStyle = accent;
            const chevW = ctx.measureText(chev).width;
            ctx.fillText(chev, pad + barW + pad * 0.22, categoryTop + rowH / 2);
            ctx.fillStyle = '#ffffff';
            const catDraw = upper ? category.toUpperCase() : category;
            ctx.fillText(catDraw, pad + barW + pad * 0.22 + chevW, categoryTop + rowH / 2);
          }

          ctx.font = `800 ${headSize}px "Segoe UI", Arial, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          lines.forEach((line, i) => {
            ctx.fillText(line, pad, headlineTop + i * lineGap);
          });

          if (footer) {
            ctx.font = `700 ${footSize}px "Segoe UI", Arial, sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.93)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const footDraw = upper ? footer.toUpperCase() : footer;
            ctx.fillText(footDraw, w / 2, h - pad);
            ctx.textAlign = 'left';
          }

          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem gerada.'));
      img.src = sourceDataUrl;
    });
  }

  function refreshStudioImageUi() {
    const hasBase = !!lastImageDataUrl;
    const applyBtn = $('btn-overlay-apply');
    const clearBtn = $('btn-overlay-clear');
    const rowDl = $('row-download-variants');
    const btnNo = $('btn-download-without-text');
    const btnYes = $('btn-download-with-text');
    if (applyBtn) applyBtn.disabled = !hasBase;
    if (clearBtn) clearBtn.disabled = !lastCompositeDataUrl;
    if (rowDl) rowDl.style.display = hasBase ? 'flex' : 'none';
    if (btnNo) btnNo.disabled = !hasBase;
    if (btnYes) btnYes.disabled = !lastCompositeDataUrl;
  }

  function clearOverlayComposite() {
    lastCompositeDataUrl = '';
    const prev = $('studio-overlay-preview');
    if (prev) {
      prev.src = '';
      prev.style.display = 'none';
    }
    refreshStudioImageUi();
    updatePostDevicePreviews();
  }

  async function applyOverlayPreview() {
    if (!lastImageDataUrl) {
      showError('Gere uma imagem primeiro.');
      return;
    }
    const headline = ($('overlay-headline') && $('overlay-headline').value.trim()) || '';
    if (!headline) {
      showError('Escreva a manchete para desenhar sobre a imagem.');
      return;
    }
    const category = ($('overlay-category') && $('overlay-category').value) || '';
    const footer = ($('overlay-footer') && $('overlay-footer').value) || '';
    const uppercase = $('overlay-uppercase') ? $('overlay-uppercase').checked : true;

    clearError();
    try {
      const dataUrl = await renderNewsStyleOverlay(lastImageDataUrl, {
        category,
        headline,
        footer,
        uppercase,
        accent: getSelectedAccentColor(),
      });
      lastCompositeDataUrl = dataUrl;
      const prev = $('studio-overlay-preview');
      if (prev) {
        prev.src = dataUrl;
        prev.style.display = 'block';
      }
      refreshStudioImageUi();
      updatePostDevicePreviews();
    } catch (e) {
      showError((e && e.message) || 'Erro ao compor a imagem.');
    }
  }

  function downloadOverlayPng() {
    if (!lastCompositeDataUrl) return;
    const a = document.createElement('a');
    a.href = lastCompositeDataUrl;
    a.download = `vida360-capa-com-texto-${Date.now()}.png`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /**
   * Modelos de imagem tendem a desenhar #tags na arte se o prompt copia legenda de redes.
   * Remove linhas de hashtags e o que vier depois; corta bloco «SUGESTÃO DE IMAGEM» se existir.
   */
  function sanitizePromptForImageGeneration(raw) {
    let text = String(raw || '').replace(/\r\n/g, '\n');
    const sugIdx = text.search(/\n---\s*\n\s*SUGESTÃO\s+DE\s+IMAGEM/i);
    if (sugIdx !== -1) text = text.slice(0, sugIdx).trim();

    const lines = text.split('\n');
    const kept = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tr = line.trim();
      if (!tr) {
        kept.push('');
        continue;
      }
      const words = tr.split(/\s+/).filter(Boolean);
      const hashWords = words.filter((w) => /^#\w/u.test(w)).length;
      const mostlyTags =
        hashWords >= 3 ||
        (words.length > 0 && hashWords / words.length >= 0.5 && hashWords >= 2);
      const looksLikeTagLine =
        mostlyTags || (words.length >= 2 && hashWords === words.length);
      if (looksLikeTagLine) break;
      if (/^#\w/u.test(tr) && words.length <= 15 && hashWords >= 1) break;
      kept.push(line);
    }
    let out = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!out) {
      out = text.split(/\n{2,}/)[0] || text;
      out = out.replace(/\s+#\w+/g, '').trim();
    }
    return out.slice(0, 4000);
  }

  async function generateImage() {
    const session = await requireAuth();
    if (!session) return;

    clearOverlayComposite();

    let desc =
      ($('studio-image-prompt') && $('studio-image-prompt').value.trim()) ||
      ($('studio-output') && $('studio-output').value.trim().slice(0, 1500)) ||
      ($('studio-prompt') && $('studio-prompt').value.trim());
    if (!desc) {
      showError('Preencha a descrição da imagem ou gere um texto antes.');
      return;
    }
    desc = sanitizePromptForImageGeneration(desc);
    if (!desc.trim()) {
      showError('Depois de remover hashtags do texto, ficou vazio. Edite a descrição da imagem ou o resultado.');
      return;
    }

    const fmt = ($('image-format') && $('image-format').value) || '1:1';
    const btn = $('btn-gen-image');
    if (btn) btn.disabled = true;

    if (!getSupabaseUrl().trim()) {
      showError('URL do Supabase não definida.', true);
      if (btn) btn.disabled = false;
      return;
    }
    if (isFileProtocol()) {
      showError(
        'Abra por HTTP (npm run dev → http://localhost:8080/…). Com file:// o navegador bloqueia o Supabase.',
        true
      );
      if (btn) btn.disabled = false;
      return;
    }

    try {
      const res = await fetch(`${getSupabaseUrl()}/functions/v1/generate-blog-studio-image`, {
        method: 'POST',
        headers: fnHeaders(session),
        body: JSON.stringify({ prompt: desc, format: fmt }),
      });
      const { raw: bodyRaw, data } = await readEdgeFunctionBody(res);

      if (!res.ok) {
        console.error('[Estúdio] generate-blog-studio-image', res.status, bodyRaw);
        throw new Error(
          explainEdgeFunctionHttpError('generate-blog-studio-image', res.status, data, bodyRaw)
        );
      }

      if (data.imageBase64 && data.mimeType) {
        lastImageMimeType = data.mimeType;
        lastImageDataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
        const img = $('studio-image-preview');
        img.src = lastImageDataUrl;
        img.style.display = 'block';
        $('btn-copy-image-url').style.display = 'inline-flex';
        refreshStudioImageUi();
        updatePostDevicePreviews();
        offerOverlaySuggestionsAfterImage();
      } else {
        throw new Error(
          (data && (data.details || data.error)) || 'Nenhuma imagem retornada (resposta sem base64).'
        );
      }
    } catch (e) {
      let msg = e.message || 'Erro ao gerar imagem.';
      if (
        msg === 'Failed to fetch' ||
        /network/i.test(msg) ||
        (typeof msg === 'string' && msg.includes('Load failed'))
      ) {
        msg =
          'Sem ligação ao Supabase. Use http://localhost (npm run dev), não file://; verifique rede/VPN.';
      }
      showError(msg);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /** Clipboard da Web falha em iframes, preview embutido e alguns browsers sem permissão — usa fallbacks. */
  function fallbackCopyString(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', 'readonly');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-5000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  async function copyOutput() {
    const t = $('studio-output');
    if (!t || !t.value) return;
    const text = t.value;

    let ok = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        ok = false;
      }
    }
    if (!ok) ok = fallbackCopyString(text);
    if (!ok) {
      try {
        t.focus();
        t.select();
        t.setSelectionRange(0, text.length);
        ok = document.execCommand('copy');
      } catch (e2) {
        ok = false;
      }
    }

    if (ok) {
      window.alert('Texto copiado. Abra o Instagram e cole com Ctrl+V (ou Cmd+V no Mac).');
    } else {
      t.focus();
      t.select();
      t.setSelectionRange(0, text.length);
      window.alert(
        'Este navegador bloqueou a cópia automática (comum no preview embutido). O texto ficou selecionado — pressione Ctrl+C (Cmd+C no Mac) e depois cole no Instagram.'
      );
    }
  }

  async function copyImageDataUrl() {
    if (!lastImageDataUrl) return;
    const text = lastImageDataUrl;

    let ok = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        ok = false;
      }
    }
    if (!ok) ok = fallbackCopyString(text);

    if (ok) {
      window.alert(
        'Data URL copiada. Cole na capa do editor ou use um link https público para preview nas redes.'
      );
    } else {
      window.alert(
        'Não foi possível copiar automaticamente. Use «Sem texto» ou «Com texto» em Descarregar.'
      );
    }
  }

  function downloadGeneratedImage() {
    if (!lastImageDataUrl) return;
    const mime = lastImageMimeType || 'image/png';
    const ext =
      /jpeg|jpg/i.test(mime) ? 'jpg' : /webp/i.test(mime) ? 'webp' : 'png';
    const a = document.createElement('a');
    a.href = lastImageDataUrl;
    a.download = `vida360-imagem-ia-sem-texto-${Date.now()}.${ext}`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
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

    const socialUrl = ($('studio-social-image-url') && $('studio-social-image-url').value.trim()) || '';
    const payload = {
      title: title || 'Novo artigo',
      excerpt: excerpt || '',
      body: plain,
      imageDataUrl: lastCompositeDataUrl || lastImageDataUrl || '',
      socialImageUrl: socialUrl,
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
          `<div class="snippet-item" data-index="${i}"><strong>${escapeHtml(s.title)}</strong><span class="snippet-preview">${escapeHtml(s.content.slice(0, 100))}…</span></div>`
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
    const btnDlNo = $('btn-download-without-text');
    if (btnDlNo) btnDlNo.addEventListener('click', downloadGeneratedImage);
    const btnDlYes = $('btn-download-with-text');
    if (btnDlYes) btnDlYes.addEventListener('click', downloadOverlayPng);
    const btnSug = $('btn-overlay-suggest-from-copy');
    if (btnSug) btnSug.addEventListener('click', onSuggestFromCopyClick);
    const btnSugAi = $('btn-overlay-suggest-ai');
    if (btnSugAi) btnSugAi.addEventListener('click', suggestOverlayFromAI);
    const btnSugBoth = $('btn-overlay-suggest-use-both');
    if (btnSugBoth) btnSugBoth.addEventListener('click', () => applyOverlaySuggestions('both'));
    const btnSugCat = $('btn-overlay-suggest-use-category');
    if (btnSugCat) btnSugCat.addEventListener('click', () => applyOverlaySuggestions('category'));
    const btnSugHead = $('btn-overlay-suggest-use-headline');
    if (btnSugHead) btnSugHead.addEventListener('click', () => applyOverlaySuggestions('headline'));
    const btnSugDismiss = $('btn-overlay-suggest-dismiss');
    if (btnSugDismiss) btnSugDismiss.addEventListener('click', hideOverlaySuggestionPanel);
    const btnOv = $('btn-overlay-apply');
    if (btnOv) btnOv.addEventListener('click', applyOverlayPreview);
    const btnOvClear = $('btn-overlay-clear');
    if (btnOvClear) btnOvClear.addEventListener('click', clearOverlayComposite);
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
    initOverlayPalette();
    refreshStudioImageUi();
    updatePostDevicePreviews();
  });
})();
