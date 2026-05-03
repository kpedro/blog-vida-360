/**
 * Assistente do painel admin — Blog Vida 360º
 * Edge Function: blog-admin-assistant (modo padrao | dedicado)
 * Histórico: localStorage (neste navegador)
 */
(function () {
  /** Mensagens: { role, content, images? } — images só na última mensagem do utilizador ao chamar a API */
  var messages = [];

  /** Anexos antes de enviar: { mimeType, dataBase64 }[] (sem prefixo data:) */
  var pendingImages = [];
  var MAX_PENDING_IMAGES = 4;
  var MAX_IMAGE_FILE_BYTES = 4 * 1024 * 1024;

  var STORAGE_KEY = "blog360_admin_assistant_history_v1";
  var SESS_STORAGE_KEY = "blog360_admin_assist_current_sess";
  /** Handoff para Estúdio → «Montar com assistente» (blog-prompt-coach) */
  var STORAGE_COACH_SEED = "blog360_coach_seed";
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

  function clearPendingImages() {
    pendingImages = [];
    renderPendingImages();
  }

  function dataUrlToPart(dataUrl) {
    var m = String(dataUrl || "").match(/^data:([^;]+);base64,([\s\S]+)$/i);
    if (!m) return null;
    var mime = m[1].toLowerCase().trim().split(";")[0];
    var b64 = m[2].replace(/\s/g, "");
    if (!b64 || b64.length < 40) return null;
    return { mimeType: mime, dataBase64: b64 };
  }

  function renderPendingImages() {
    var wrap = $("assist-pending-preview");
    if (!wrap) return;
    if (!pendingImages.length) {
      wrap.innerHTML = "";
      wrap.style.display = "none";
      return;
    }
    wrap.style.display = "flex";
    wrap.innerHTML = pendingImages
      .map(function (p, idx) {
        var src = "data:" + p.mimeType + ";base64," + p.dataBase64;
        return (
          '<div class="pending-thumb" data-idx="' +
          idx +
          '">' +
          '<img src="' +
          escapeHtml(src) +
          '" alt="">' +
          '<button type="button" class="pending-remove" data-idx="' +
          idx +
          '" title="Remover">×</button></div>'
        );
      })
      .join("");
    wrap.querySelectorAll(".pending-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(btn.getAttribute("data-idx"), 10);
        if (!isNaN(i)) {
          pendingImages.splice(i, 1);
          renderPendingImages();
        }
      });
    });
  }

  function readFileAsImagePart(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf("image/") !== 0) {
        reject(new Error("Seleccione uma imagem (PNG, JPEG, WebP ou GIF)."));
        return;
      }
      if (file.size > MAX_IMAGE_FILE_BYTES) {
        reject(new Error("Imagem demasiado grande (máx. 4 MB por ficheiro)."));
        return;
      }
      if (file.type === "image/gif" && file.size > 1.5 * 1024 * 1024) {
        reject(new Error("GIF muito grande; use PNG ou JPEG, ou um GIF até ~1,5 MB."));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = String(reader.result || "");
        var direct = dataUrlToPart(dataUrl);
        if (!direct) {
          reject(new Error("Não foi possível ler a imagem."));
          return;
        }
        if (file.size <= 1.25 * 1024 * 1024 && file.type !== "image/gif") {
          resolve(direct);
          return;
        }
        var img = new Image();
        img.onload = function () {
          try {
            var maxW = 1600;
            var w = img.width;
            var h = img.height;
            var cw = w;
            var ch = h;
            if (w > maxW) {
              cw = maxW;
              ch = Math.round((h * maxW) / w);
            }
            var canvas = document.createElement("canvas");
            canvas.width = cw;
            canvas.height = ch;
            var ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(direct);
              return;
            }
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, cw, ch);
            ctx.drawImage(img, 0, 0, cw, ch);
            var mime = file.type === "image/png" ? "image/png" : "image/jpeg";
            var out =
              mime === "image/png"
                ? canvas.toDataURL("image/png")
                : canvas.toDataURL("image/jpeg", 0.82);
            var part = dataUrlToPart(out);
            if (!part) resolve(direct);
            else resolve(part);
          } catch (e) {
            resolve(direct);
          }
        };
        img.onerror = function () {
          resolve(direct);
        };
        img.src = dataUrl;
      };
      reader.onerror = function () {
        reject(new Error("Falha ao ler o ficheiro."));
      };
      reader.readAsDataURL(file);
    });
  }

  async function addPendingFromFile(file) {
    if (pendingImages.length >= MAX_PENDING_IMAGES) {
      window.alert("No máximo " + MAX_PENDING_IMAGES + " imagens por mensagem.");
      return;
    }
    try {
      var part = await readFileAsImagePart(file);
      pendingImages.push(part);
      renderPendingImages();
    } catch (e) {
      window.alert((e && e.message) || "Erro ao anexar imagem.");
    }
  }

  function appendUserBubble(text, imagePartsForPreview) {
    var box = $("assist-chat");
    if (!box) return;
    var div = document.createElement("div");
    div.className = "msg user";
    var toolbar = document.createElement("div");
    toolbar.className = "msg-toolbar";
    var whoSpan = document.createElement("span");
    whoSpan.className = "who";
    whoSpan.textContent = "Você";
    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "msg-copy";
    copyBtn.textContent = "Copiar";
    var nImg = imagePartsForPreview && imagePartsForPreview.length ? imagePartsForPreview.length : 0;
    var copyPlain =
      String(text || "").trim() +
      (nImg ? "\n\n[" + nImg + " print(s) anexo(s) — a cópia é só o texto; use o print no ecrã se precisar do ficheiro]" : "");
    copyBtn.addEventListener("click", function () {
      void copyPlainToClipboard(copyPlain).then(function (ok) {
        if (ok) flashBtn(copyBtn, "Copiado!");
      });
    });
    toolbar.appendChild(whoSpan);
    toolbar.appendChild(copyBtn);

    var bubble = document.createElement("div");
    bubble.className = "bubble bubble-user-images";
    var inner = escapeHtml(text || "").replace(/\n/g, "<br>");
    if (nImg) {
      inner +=
        '<div class="user-images-row">' +
        imagePartsForPreview
          .map(function (p) {
            var src = "data:" + p.mimeType + ";base64," + p.dataBase64;
            return '<img src="' + escapeHtml(src) + '" alt="Print anexo">';
          })
          .join("") +
        "</div>";
    }
    bubble.innerHTML = inner;

    div.appendChild(toolbar);
    div.appendChild(bubble);
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function removeLastUserBubbleFromDom() {
    var box = $("assist-chat");
    if (!box) return;
    var nodes = box.querySelectorAll(".msg.user");
    var last = nodes[nodes.length - 1];
    if (last) last.remove();
  }

  function serializeMessagesForApi(msgs) {
    var lastUser = -1;
    for (var i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user") {
        lastUser = i;
        break;
      }
    }
    return msgs.map(function (m, i) {
      if (m.role === "user" && i === lastUser) {
        var o = { role: "user", content: m.content || "" };
        if (m.images && m.images.length) o.images = m.images;
        return o;
      }
      return { role: m.role, content: m.content || "" };
    });
  }

  function stripImagesFromLastUserMessage() {
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        if (messages[i].images) delete messages[i].images;
        break;
      }
    }
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
    updateStudioCoachButton();
  }

  function selectedMode() {
    var r = document.querySelector('input[name="assist-mode"]:checked');
    return r && r.value === "dedicado" ? "dedicado" : "padrao";
  }

  function assistantLabelForMode(mode) {
    return mode === "dedicado" ? "Assistente (IA dedicada)" : "Assistente (IA padrão)";
  }

  function buildThreadMarkdownFromMsgs(msgs) {
    if (!msgs || !msgs.length) return "";
    var parts = [];
    msgs.forEach(function (m) {
      if (m.role === "user") parts.push("## Você\n\n" + String(m.content || "").trim());
      else if (m.role === "assistant") parts.push("## Assistente do painel\n\n" + String(m.content || "").trim());
    });
    return parts.join("\n\n---\n\n");
  }

  function buildThreadMarkdown() {
    return buildThreadMarkdownFromMsgs(messages);
  }

  function buildCoachSeedWrap(md) {
    return [
      "Quero transformar o contexto abaixo (conversa com o Assistente do painel do blog) num único PROMPT completo e reutilizável para o campo «Comando / instruções» deste Estúdio.",
      "",
      "Requisitos do prompt final: tema claro, público-alvo, tom acolhedor, formato (artigo / post para redes / landing), tamanho aproximado e o que evitar (por exemplo: sem promessas médicas).",
      "",
      "Se faltar só um ou dois detalhes essenciais, faça no máximo 2 perguntas curtas; caso contrário avance para entregar o prompt completo.",
      "",
      "--- INÍCIO DO CONTEXTO ---",
      "",
      String(md || "").trim(),
      "",
      "--- FIM DO CONTEXTO ---",
    ].join("\n");
  }

  function goToStudioCoachFromMarkdown(md) {
    var core = String(md || "").trim();
    if (!core) {
      window.alert("Não há conversa com mensagens para enviar ao Estúdio.");
      return;
    }
    var seed = buildCoachSeedWrap(core);
    if (seed.length > 24000) seed = seed.slice(0, 24000) + "\n\n[… contexto truncado]";
    try {
      sessionStorage.setItem(STORAGE_COACH_SEED, JSON.stringify({ v: 1, initialUserMessage: seed }));
    } catch (e) {
      window.alert(
        "Armazenamento cheio ou bloqueado. Use «Copiar conversa» e depois no Estúdio abra «Montar com assistente» e cole."
      );
      return;
    }
    window.location.href = "admin-estudio-conteudo.html?open_coach=1";
  }

  function goToStudioCoachCurrent() {
    goToStudioCoachFromMarkdown(buildThreadMarkdown());
  }

  function updateStudioCoachButton() {
    var b = $("assist-to-studio-coach");
    if (!b) return;
    b.disabled = !messages.length;
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
      if (m.role === "user") appendUserBubble(m.content || "", []);
      else appendLine(label, m.content, false, true);
    });
    updateStudioCoachButton();
  }

  /** Nova conversa: guarda a actual, reinicia ID e ecrã. */
  function startNewConversation() {
    persistCurrentSession();
    messages = [];
    clearPendingImages();
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
    clearPendingImages();
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
          '<button type="button" class="btn-ghost btn-tiny" data-act="studio" title="Montar com assistente no Estúdio">Estúdio</button>' +
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
    var snapText = text;
    var snapPending = pendingImages.map(function (p) {
      return { mimeType: p.mimeType, dataBase64: p.dataBase64 };
    });

    if (!text && !pendingImages.length) return;

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

    var imgs = pendingImages.map(function (p) {
      return { mimeType: p.mimeType, dataBase64: p.dataBase64 };
    });
    var bodyContent = text || (imgs.length ? "(Print em anexo)" : "");

    messages.push({
      role: "user",
      content: bodyContent,
      images: imgs.length ? imgs : undefined,
    });

    var displayLine = text || (imgs.length ? "Print anexo" : "");
    appendUserBubble(displayLine, imgs);

    input.value = "";
    clearPendingImages();

    var btn = $("assist-send");
    if (btn) btn.disabled = true;

    var mode = selectedMode();
    try {
      var res = await fetch(getSupabaseUrl() + "/functions/v1/blog-admin-assistant", {
        method: "POST",
        headers: fnHeaders(session),
        body: JSON.stringify({
          messages: serializeMessagesForApi(messages),
          mode: mode,
        }),
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
      stripImagesFromLastUserMessage();
      appendLine(assistantLabelForMode(mode), reply, false, true);
      persistCurrentSession();
      updateStudioCoachButton();
    } catch (e) {
      messages.pop();
      removeLastUserBubbleFromDom();
      if (input) input.value = snapText;
      pendingImages = snapPending;
      renderPendingImages();
      appendLine("Sistema", (e && e.message) || "Erro", false, false);
      updateStudioCoachButton();
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

    $("assist-to-studio-coach") &&
      $("assist-to-studio-coach").addEventListener("click", function () {
        if (!messages.length) return;
        goToStudioCoachCurrent();
      });

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
        } else if (act === "studio") {
          var p3 = loadHistoryPack();
          var s3 = p3.sessions.find(function (x) {
            return x.id === id;
          });
          if (s3 && s3.messages && s3.messages.length) {
            goToStudioCoachFromMarkdown(buildThreadMarkdownFromMsgs(s3.messages));
          } else window.alert("Esta entrada não tem mensagens para enviar.");
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
      inp.addEventListener("paste", function (e) {
        var cd = e.clipboardData;
        if (!cd || !cd.items) return;
        for (var i = 0; i < cd.items.length; i++) {
          if (cd.items[i].type && cd.items[i].type.indexOf("image") === 0) {
            e.preventDefault();
            var f = cd.items[i].getAsFile();
            if (f) void addPendingFromFile(f);
            return;
          }
        }
      });
    }

    var fin = $("assist-file-input");
    var fab = $("assist-attach-btn");
    if (fab && fin) {
      fab.addEventListener("click", function () {
        fin.click();
      });
      fin.addEventListener("change", function () {
        var files = fin.files;
        if (!files || !files.length) return;
        for (var j = 0; j < files.length; j++) {
          if (pendingImages.length >= MAX_PENDING_IMAGES) break;
          void addPendingFromFile(files[j]);
        }
        fin.value = "";
      });
    }

    updateStudioCoachButton();
  });
})();
