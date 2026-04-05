/**
 * Central de marketing — assistente de copy (mode: marketing na Edge blog-prompt-coach)
 */
(function () {
  let mkMessages = [];

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
  });
})();
