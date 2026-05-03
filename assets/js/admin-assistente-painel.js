/**
 * Assistente do painel admin — Blog Vida 360º
 * Edge Function: blog-admin-assistant (modo padrao | dedicado)
 * Histórico: localStorage (neste navegador)
 */
(function () {
  /** Mensagens enviadas à API: só { role, content } */
  var messages = [];

  var STORAGE_KEY = "blog360_admin_assistant_history_v1";
  var SESS_STORAGE_KEY = "blog360_admin_assist_current_sess";
  var MAX_SESSIONS = 25;
  var MAX_MSG_CHARS = 32000;

  var WELCOME_HTML =
    '<div class="msg msg-welcome" data-welcome="1">' +
    '<div class="msg-toolbar">' +
    '<span class="who">Assistente</span>' +
    '<button type="button" class="msg-copy" title="Copiar texto de boas-vindas">Copiar</button>' +
    "</div>" +
    '<div class="bubble">Olá. Pergunte sobre sequência de posts, categorias, o que publicar a seguir ou dúvidas do painel. Escolha <strong>IA padrão</strong> para respostas rápidas ou <strong>IA dedicada</strong> para plano e narrativa mais profundos.</div>' +
    "</div>";

  var WELCOME_PLAIN =
    "Olá. Pergunte sobre sequência de posts, categorias, o que publicar a seguir ou dúvidas do painel. Escolha IA padrão para respostas rápidas ou IA dedicada para plano e narrativa mais profundos.";

  var currentSessionId = "";

  function $(id) {
    return document.getElementById(id);
  }

  function getSupabaseUrl() {
    return (window.VITE_SUPABASE_URL || "").trim();
  }

  function getAnonKey() {
    return window.VITE_SUPABASE_ANON_KEY || "";
  }

  function fnHeaders(session) {
    var h = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.access_token,
    };
    var k = getAnonKey();
    if (k) h.apikey = k;
    return h;
  }

  async function getSession() {
    var c = window.supabaseClient;
    if (!c && typeof window.initSupabase === "function") {
      c = window.initSupabase();
      window.supabaseClient = c;
    }
    if (!c || !c.auth) return null;
    var r = await c.auth.getSession();
    return r.data.session;
  }

  async function requireAuth() {
    var s = await getSession();
    if (!s) {
      window.location.href = "admin-login.html";
      return null;
    }
    return s;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function makeId() {
    return "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  function clipText(s) {
    var t = String(s || "");
    if (t.length > MAX_MSG_CHARS) t = t.slice(0, MAX_MSG_CHARS) + "\n… [texto truncado]";
    return t;
  }

  function loadHistoryPack() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: 1, sessions: [] };
      var j = JSON.parse(raw);
      if (!j || !Array.isArray(j.sessions)) return { version: 1, sessions: [] };
      return j;
    } catch (e) {
      return { version: 1, sessions: [] };
    }
  }

  function saveHistoryPack(pack) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pack));
    } catch (e) {
      console.warn("[Assistente] localStorage:", e);
    }
  }

  function sessionTitleFromMessages(msgs) {
    var u = msgs.find(function (m) {
      return m.role === "user";
    });
    if (!u) return "Conversa vazia";
    var t = String(u.content || "")
      .replace(/\s+/g, " ")
      .trim();
    if (t.length > 56) t = t.slice(0, 53) + "…";
    return t || "Conversa";
  }

  function persistCurrentSession() {
    if (!messages.length) return;
    var pack = loadHistoryPack();
    var mode = selectedMode();
    var row = {
      id: currentSessionId,
      updatedAt: Date.now(),
      title: sessionTitleFromMessages(messages),
      mode: mode,
      messages: messages.map(function (m) {
        return { role: m.role, content: clipText(m.content) };
      }),
    };
    var idx = pack.sessions.findIndex(function (s) {
      return s.id === currentSessionId;
    });
    if (idx >= 0) pack.sessions[idx] = row;
    else pack.sessions.unshift(row);
    pack.sessions.sort(function (a, b) {
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    if (pack.sessions.length > MAX_SESSIONS) pack.sessions = pack.sessions.slice(0, MAX_SESSIONS);
    saveHistoryPack(pack);
  }

  function deleteSessionById(id) {
    var pack = loadHistoryPack();
    pack.sessions = pack.sessions.filter(function (s) {
      return s.id !== id;
    });
    saveHistoryPack(pack);
  }

  function formatPtDate(ts) {
    try {
      return new Date(ts).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }

  async function copyPlainToClipboard(text) {
    var t = String(text || "");
    if (!t) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(t);
        return true;
      }
    } catch (e) {
      console.warn("[Assistente] clipboard:", e);
    }
    try {
      window.prompt("Copie o texto (Ctrl+C):", t);
      return true;
    } catch (e2) {
      return false;
    }
  }

  function flashBtn(btn, label) {
    if (!btn) return;
    var prev = btn.textContent;
    btn.textContent = label || "Copiado!";
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = prev;
      btn.disabled = false;
    }, 1600);
  }

  /** Markdown → HTML (respostas do assistente) */
  function markdownToSafeHtml(md) {
    var raw = String(md || "");
    if (typeof marked !== "undefined" && typeof DOMPurify !== "undefined") {
      try {
        var parseOpts = { breaks: true, gfm: true };
        var html =
          typeof marked.parse === "function"
            ? marked.parse(raw, parseOpts)
            : typeof marked === "function"
              ? marked(raw, parseOpts)
              : "";
        return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
      } catch (err) {
        console.warn("[Assistente] Markdown:", err);
      }
    }
    return escapeHtml(raw).replace(/\n/g, "<br>");
  }

  /**
   * @param {string} who
   * @param {string} text — texto plano / Markdown (para copiar)
   * @param {boolean} isUser
   * @param {boolean} [renderMarkdown]
   */
  function appendLine(who, text, isUser, renderMarkdown) {
    var box = $("assist-chat");
    if (!box) return;
    var div = document.createElement("div");
    div.className = "msg" + (isUser ? " user" : "");
    var useMd = !isUser && !!renderMarkdown;
    var bubbleClass = "bubble" + (useMd ? " bubble-md" : "");
    var inner = useMd ? markdownToSafeHtml(text) : escapeHtml(text).replace(/\n/g, "<br>");

    var toolbar = document.createElement("div");
    toolbar.className = "msg-toolbar";
    var whoSpan = document.createElement("span");
    whoSpan.className = "who";
    whoSpan.textContent = who;
    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "msg-copy";
    copyBtn.title = "Copiar esta mensagem (para prompt ou outra ferramenta)";
    copyBtn.textContent = "Copiar";
    copyBtn.addEventListener("click", function () {
      void copyPlainToClipboard(text).then(function (ok) {
        if (ok) flashBtn(copyBtn, "Copiado!");
      });
    });
    toolbar.appendChild(whoSpan);
    toolbar.appendChild(copyBtn);

    var bubble = document.createElement("div");
    bubble.className = bubbleClass;
    bubble.innerHTML = inner;

    div.appendChild(toolbar);
    div.appendChild(bubble);
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function renderWelcome() {
    var box = $("assist-chat");
    if (!box) return;
    box.innerHTML = WELCOME_HTML;
    var wb = box.querySelector(".msg-welcome .msg-copy");
    if (wb) {
      wb.addEventListener("click", function () {
        void copyPlainToClipboard(WELCOME_PLAIN).then(function (ok) {
          if (ok) flashBtn(wb, "Copiado!");
        });
      });
    }
  }

  function selectedMode() {
    var r = document.querySelector('input[name="assist-mode"]:checked');
    return r && r.value === "dedicado" ? "dedicado" : "padrao";
  }

  function assistantLabelForMode(mode) {
    return mode === "dedicado" ? "Assistente (IA dedicada)" : "Assistente (IA padrão)";
  }

  function buildThreadMarkdown() {
    if (!messages.length) return "";
    var parts = [];
    messages.forEach(function (m) {
      if (m.role === "user") parts.push("## Você\n\n" + String(m.content || "").trim());
      else if (m.role === "assistant") parts.push("## Assistente\n\n" + String(m.content || "").trim());
    });
    return parts.join("\n\n---\n\n");
  }

  function rebuildFromSession(sess) {
    if (!sess || !Array.isArray(sess.messages)) return;
    messages = sess.messages.map(function (m) {
      return {
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || ""),
      };
    });
    currentSessionId = sess.id || makeId();
    try {
      sessionStorage.setItem(SESS_STORAGE_KEY, currentSessionId);
    } catch (e) {}
    var mode = sess.mode === "dedicado" ? "dedicado" : "padrao";
    var rad = document.querySelector('input[name="assist-mode"][value="' + mode + '"]');
    if (rad) rad.checked = true;

    var box = $("assist-chat");
    if (!box) return;
    box.innerHTML = "";
    var label = assistantLabelForMode(mode);
    messages.forEach(function (m) {
      if (m.role === "user") appendLine("Você", m.content, true, false);
      else appendLine(label, m.content, false, true);
    });
  }

  /** Nova conversa: guarda a actual, reinicia ID e ecrã. */
  function startNewConversation() {
    persistCurrentSession();
    messages = [];
    currentSessionId = makeId();
    try {
      sessionStorage.setItem(SESS_STORAGE_KEY, currentSessionId);
    } catch (e) {}
    renderWelcome();
  }

  /** Limpa o ecrã: guarda histórico antes de apagar. */
  function clearChat() {
    persistCurrentSession();
    messages = [];
    currentSessionId = makeId();
    try {
      sessionStorage.setItem(SESS_STORAGE_KEY, currentSessionId);
    } catch (e) {}
    renderWelcome();
  }

  function refreshHistoryList() {
    var ul = $("assist-history-list");
    if (!ul) return;
    var pack = loadHistoryPack();
    var sessions = pack.sessions || [];
    if (!sessions.length) {
      ul.innerHTML = '<li class="history-empty">Nenhuma conversa guardada ainda. Envie mensagens — o histórico atualiza ao receber respostas.</li>';
      return;
    }
    ul.innerHTML = sessions
      .map(function (s) {
        var id = escapeHtml(s.id);
        var title = escapeHtml(s.title || "Sem título");
        var when = escapeHtml(formatPtDate(s.updatedAt));
        var mode = s.mode === "dedicado" ? "IA dedicada" : "IA padrão";
        return (
          '<li class="history-item" data-id="' +
          id +
          '">' +
          '<div class="history-meta"><strong>' +
          title +
          "</strong><br><span>" +
          when +
          " · " +
          escapeHtml(mode) +
          "</span></div>" +
          '<div class="history-actions">' +
          '<button type="button" class="btn-ghost btn-tiny" data-act="open">Abrir</button>' +
          '<button type="button" class="btn-ghost btn-tiny danger" data-act="del">Apagar</button>' +
          "</div></li>"
        );
      })
      .join("");
  }

  function toggleHistoryPanel() {
    var p = $("assist-history-panel");
    if (!p) return;
    var open = p.hasAttribute("hidden");
    if (open) {
      p.removeAttribute("hidden");
      refreshHistoryList();
    } else p.setAttribute("hidden", "");
  }

  async function send() {
    var input = $("assist-input");
    var text = (input && input.value.trim()) || "";
    if (!text) return;

    var session = await requireAuth();
    if (!session) return;

    if (!getSupabaseUrl()) {
      window.alert("URL do Supabase não definida.");
      return;
    }
    if (location.protocol === "file:") {
      window.alert("Abra o painel por http://localhost (npm run dev), não como file://.");
      return;
    }

    messages.push({ role: "user", content: text });
    appendLine("Você", text, true, false);
    input.value = "";

    var btn = $("assist-send");
    if (btn) btn.disabled = true;

    var mode = selectedMode();
    try {
      var res = await fetch(getSupabaseUrl() + "/functions/v1/blog-admin-assistant", {
        method: "POST",
        headers: fnHeaders(session),
        body: JSON.stringify({ messages: messages, mode: mode }),
      });
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        throw new Error(data.error || data.details || "Erro na função blog-admin-assistant");
      }
      var reply = (data.reply || "").trim();
      if (!reply) throw new Error("Resposta vazia da IA.");
      messages.push({ role: "assistant", content: reply });
      appendLine(assistantLabelForMode(mode), reply, false, true);
      persistCurrentSession();
    } catch (e) {
      messages.pop();
      appendLine("Sistema", (e && e.message) || "Erro", false, false);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    await requireAuth();
    if (typeof window.initSupabase === "function") window.initSupabase();

    try {
      currentSessionId = sessionStorage.getItem(SESS_STORAGE_KEY) || "";
    } catch (e) {
      currentSessionId = "";
    }
    if (!currentSessionId) {
      currentSessionId = makeId();
      try {
        sessionStorage.setItem(SESS_STORAGE_KEY, currentSessionId);
      } catch (e2) {}
    }

    var pack = loadHistoryPack();
    var cur = pack.sessions.find(function (s) {
      return s.id === currentSessionId;
    });
    if (cur && cur.messages && cur.messages.length) rebuildFromSession(cur);
    else renderWelcome();

    $("assist-send") && $("assist-send").addEventListener("click", function () {
      void send();
    });
    $("assist-clear") &&
      $("assist-clear").addEventListener("click", function () {
        if (messages.length && !window.confirm("Limpar a conversa actual? (A conversa fica guardada no histórico antes de limpar.)")) return;
        clearChat();
      });

    $("assist-new") &&
      $("assist-new").addEventListener("click", function () {
        startNewConversation();
      });

    $("assist-copy-thread") &&
      $("assist-copy-thread").addEventListener("click", function () {
        var md = buildThreadMarkdown();
        if (!md) {
          window.alert("Ainda não há mensagens na conversa para copiar.");
          return;
        }
        var hdr =
          "<!-- Blog Vida 360º — Assistente do painel -->\n" +
          "<!-- Copiado em " +
          new Date().toISOString() +
          " -->\n\n";
        void copyPlainToClipboard(hdr + md).then(function (ok) {
          if (ok) flashBtn($("assist-copy-thread"), "Copiado!");
          else window.alert("Não foi possível copiar. Tente de novo ou seleccione o texto manualmente.");
        });
      });

    $("assist-history-toggle") &&
      $("assist-history-toggle").addEventListener("click", function () {
        toggleHistoryPanel();
      });

    $("assist-history-close") &&
      $("assist-history-close").addEventListener("click", function () {
        var p = $("assist-history-panel");
        if (p) p.setAttribute("hidden", "");
      });

    var histList = $("assist-history-list");
    if (histList) {
      histList.addEventListener("click", function (ev) {
        var t = ev.target;
        if (!t || !t.getAttribute) return;
        var act = t.getAttribute("data-act");
        var li = t.closest(".history-item");
        if (!act || !li) return;
        var id = li.getAttribute("data-id");
        if (!id) return;
        if (act === "open") {
          var p = loadHistoryPack();
          var s = p.sessions.find(function (x) {
            return x.id === id;
          });
          if (s) {
            rebuildFromSession(s);
            var panel = $("assist-history-panel");
            if (panel) panel.setAttribute("hidden", "");
          }
        } else if (act === "del") {
          if (!window.confirm("Apagar esta entrada do histórico neste navegador?")) return;
          deleteSessionById(id);
          if (id === currentSessionId) {
            messages = [];
            currentSessionId = makeId();
            try {
              sessionStorage.setItem(SESS_STORAGE_KEY, currentSessionId);
            } catch (e) {}
            renderWelcome();
          }
          refreshHistoryList();
        }
      });
    }

    var inp = $("assist-input");
    if (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          void send();
        }
      });
    }
  });
})();
