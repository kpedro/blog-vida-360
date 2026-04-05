/**
 * Central de marketing — assistente de copy (mode: marketing na Edge blog-prompt-coach)
 */
(function () {
  let mkMessages = [];
  /** @type {Map<string, string>} */
  const mkHistoryContentById = new Map();

  function $(id) {
    return document.getElementById(id);
  }

  function showError(msg) {
    const el = $('mk-error');
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

  function appendLine(who, text, isUser) {
    const log = $('mk-chat');
    if (!log) return;
    const row = document.createElement('div');
    row.className = 'mk-msg' + (isUser ? ' mk-msg-user' : ' mk-msg-bot');
    const label = document.createElement('div');
    label.className = 'mk-msg-who';
    label.textContent = who;
    const body = document.createElement('div');
    body.className = 'mk-msg-body';
    body.textContent = text;
    row.appendChild(label);
    row.appendChild(body);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function fmtHistDate(iso) {
    try {
      return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return String(iso || '');
    }
  }

  async function saveMarketingHistory(payload) {
    const title = (payload.title || '').trim().slice(0, 200) || null;
    const promptText = (payload.promptText || '').slice(0, 8000);
    const content = (payload.content || '').trim();
    if (content.length < 5) return false;

    let c = window.supabaseClient;
    if (!c && typeof window.initSupabase === 'function') {
      c = window.initSupabase();
      window.supabaseClient = c;
    }
    const session = await getSession();
    if (!c || !session?.user) return false;

    try {
      const { error } = await c.from('blog360_marketing_history').insert({
        user_id: session.user.id,
        title,
        prompt: promptText,
        content: content.slice(0, 50000),
      });
      if (error) throw error;
      await loadMarketingHistory();
      return true;
    } catch (e) {
      console.warn('Histórico marketing não guardado:', e);
      return false;
    }
  }

  function useHistoryRow(id) {
    const content = mkHistoryContentById.get(id) || '';
    const out = $('mk-output');
    if (out) out.value = content;
    const copyMain = $('mk-copy');
    if (copyMain) copyMain.disabled = !content.trim();
    if (out) out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function copyHistoryRow(id) {
    const content = mkHistoryContentById.get(id) || '';
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      showError('Não foi possível copiar.');
    }
  }

  async function deleteHistoryRow(id) {
    if (!confirm('Remover esta entrada do histórico?')) return;
    let c = window.supabaseClient;
    if (!c && typeof window.initSupabase === 'function') {
      c = window.initSupabase();
      window.supabaseClient = c;
    }
    const session = await getSession();
    if (!c || !session) return;
    const { error } = await c.from('blog360_marketing_history').delete().eq('id', id);
    if (error) {
      showError(error.message || 'Erro ao apagar.');
      return;
    }
    mkHistoryContentById.delete(id);
    await loadMarketingHistory();
  }

  async function loadMarketingHistory() {
    const tbody = $('mk-history-body');
    const empty = $('mk-history-empty');
    const table = $('mk-history-table');
    if (!tbody || !empty || !table) return;

    let c = window.supabaseClient;
    if (!c && typeof window.initSupabase === 'function') {
      c = window.initSupabase();
      window.supabaseClient = c;
    }
    const session = await getSession();
    if (!c || !session) {
      empty.textContent = 'Faça login para ver o histórico.';
      empty.style.display = 'block';
      table.style.display = 'none';
      tbody.innerHTML = '';
      return;
    }

    empty.style.display = 'block';
    empty.textContent = 'Carregando…';
    table.style.display = 'none';
    tbody.innerHTML = '';

    const { data, error } = await c
      .from('blog360_marketing_history')
      .select('id, title, prompt, content, created_at')
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) {
      console.warn('Carregar histórico marketing:', error);
      empty.textContent =
        'Não foi possível carregar. Execute supabase/BLOG360_MARKETING_HISTORY.sql no projeto Supabase.';
      return;
    }

    const rows = data || [];
    mkHistoryContentById.clear();

    if (rows.length === 0) {
      empty.textContent = 'Nenhuma entrada ainda. Gere copy com o assistente ou use «Guardar no histórico».';
      empty.style.display = 'block';
      table.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    table.style.display = 'table';

    rows.forEach((r) => {
      const content = r.content || '';
      mkHistoryContentById.set(r.id, content);
      const previewRaw =
        (r.title && String(r.title).trim()) ||
        (r.prompt && String(r.prompt).trim().slice(0, 100)) ||
        content.slice(0, 80) ||
        '—';
      const preview = previewRaw.length > 100 ? previewRaw.slice(0, 100) + '…' : previewRaw;

      const tr = document.createElement('tr');
      const tdDate = document.createElement('td');
      tdDate.textContent = fmtHistDate(r.created_at);
      const tdPrev = document.createElement('td');
      tdPrev.className = 'mk-h-preview';
      tdPrev.textContent = preview;
      tdPrev.title = content.length > 200 ? content.slice(0, 400) + (content.length > 400 ? '…' : '') : content;

      const tdAct = document.createElement('td');
      const wrap = document.createElement('div');
      wrap.className = 'mk-history-actions';

      const bUse = document.createElement('button');
      bUse.type = 'button';
      bUse.className = 'btn';
      bUse.textContent = 'Colar';
      bUse.addEventListener('click', function () {
        useHistoryRow(r.id);
      });

      const bCopy = document.createElement('button');
      bCopy.type = 'button';
      bCopy.className = 'btn';
      bCopy.textContent = 'Copiar';
      bCopy.addEventListener('click', function () {
        copyHistoryRow(r.id);
      });

      const bDel = document.createElement('button');
      bDel.type = 'button';
      bDel.className = 'btn';
      bDel.textContent = 'Apagar';
      bDel.addEventListener('click', function () {
        deleteHistoryRow(r.id);
      });

      wrap.appendChild(bUse);
      wrap.appendChild(bCopy);
      wrap.appendChild(bDel);
      tdAct.appendChild(wrap);
      tr.appendChild(tdDate);
      tr.appendChild(tdPrev);
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });
  }

  function appendBlock(title, content) {
    const log = $('mk-chat');
    if (!log) return;
    const wrap = document.createElement('div');
    wrap.className = 'mk-prompt-block';
    wrap.innerHTML =
      '<strong>' +
      title.replace(/</g, '&lt;') +
      '</strong><pre></pre>';
    const pre = wrap.querySelector('pre');
    pre.textContent = content;
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  async function sendMk() {
    const input = $('mk-input');
    const text = (input && input.value.trim()) || '';
    if (!text) return;

    const session = await requireAuth();
    if (!session) return;

    mkMessages.push({ role: 'user', content: text });
    appendLine('Você', text, true);
    input.value = '';
    const sendBtn = $('mk-send');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const res = await fetch(`${getSupabaseUrl()}/functions/v1/blog-prompt-coach`, {
        method: 'POST',
        headers: fnHeaders(session),
        body: JSON.stringify({ messages: mkMessages, mode: 'marketing' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.details || 'Erro no assistente');

      const assistantMessage = data.assistantMessage || '';
      const phase = data.phase || 'clarify';
      const suggestedContent = (data.suggestedContent || '').trim();
      const suggestedTitle = (data.suggestedTitle || '').trim();

      const historyAssistant =
        phase === 'deliver' && suggestedContent.length >= 20
          ? `${assistantMessage}\n\n---\n${suggestedContent}`
          : assistantMessage || suggestedContent || '…';
      mkMessages.push({ role: 'assistant', content: historyAssistant });

      appendLine('Assistente', assistantMessage, false);
      if (suggestedContent.length >= 20) {
        appendBlock('Texto pronto para usar', suggestedContent);
      }

      if (suggestedContent.length >= 20) {
        const out = $('mk-output');
        if (out) out.value = suggestedContent;
      }
      const copyMain = $('mk-copy');
      if (copyMain) copyMain.disabled = suggestedContent.length < 20;

      if (suggestedContent.length >= 20) {
        saveMarketingHistory({
          title: suggestedTitle || text.slice(0, 100),
          promptText: text,
          content: suggestedContent,
        });
      }
    } catch (e) {
      appendLine('Sistema', e.message || 'Erro', false);
      showError(e.message || 'Erro. Faça deploy da Edge Function blog-prompt-coach atualizada.');
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  function applyPreset(t) {
    const input = $('mk-input');
    if (!input) return;
    input.value = t;
    input.focus();
  }

  function copyOutput() {
    const out = $('mk-output');
    if (!out || !out.value.trim()) return;
    navigator.clipboard.writeText(out.value.trim()).then(
      () => {
        const b = $('mk-copy');
        if (b) {
          const o = b.textContent;
          b.textContent = 'Copiado!';
          setTimeout(() => (b.textContent = o), 2000);
        }
      },
      () => showError('Não foi possível copiar. Selecione o texto manualmente.'),
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    const chat = $('mk-chat');
    if (chat) {
      const tip = document.createElement('div');
      tip.className = 'mk-msg mk-msg-tip';
      tip.innerHTML =
        '<div class="mk-msg-body">Este assistente é só para <strong>divulgação e marketing</strong> (faixa do site, WhatsApp, convites, CTAs). Descreva o que precisa ou use um modelo abaixo.</div>';
      chat.appendChild(tip);
    }

    document.querySelectorAll('[data-mk-preset]').forEach((btn) => {
      btn.addEventListener('click', function () {
        applyPreset(this.getAttribute('data-mk-preset') || '');
      });
    });

    const send = $('mk-send');
    if (send) send.addEventListener('click', sendMk);

    const inp = $('mk-input');
    if (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          sendMk();
        }
      });
    }

    const copyBtn = $('mk-copy');
    if (copyBtn) copyBtn.addEventListener('click', copyOutput);

    const saveManual = $('mk-save-manual');
    if (saveManual) {
      saveManual.addEventListener('click', async function () {
        const out = $('mk-output');
        const raw = (out && out.value.trim()) || '';
        if (raw.length < 5) {
          showError('Escreva ou gere texto no campo «Texto para colar» antes de guardar.');
          return;
        }
        const firstLine = raw.split('\n')[0].trim().slice(0, 120);
        const ok = await saveMarketingHistory({
          title: firstLine || 'Texto manual',
          promptText: 'Guardado manualmente na Central de marketing',
          content: raw,
        });
        if (ok) {
          const b = saveManual;
          const prev = b.textContent;
          b.textContent = 'Guardado!';
          setTimeout(function () {
            b.textContent = prev;
          }, 2000);
        } else {
          showError('Não foi possível guardar. Confirme login e a tabela blog360_marketing_history no Supabase.');
        }
      });
    }

    const refreshHist = $('mk-history-refresh');
    if (refreshHist) refreshHist.addEventListener('click', function () {
      loadMarketingHistory();
    });

    loadMarketingHistory();
  });
})();
