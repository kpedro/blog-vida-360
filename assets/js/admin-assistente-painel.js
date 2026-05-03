/**
 * Assistente do painel admin — Blog Vida 360º
 * Edge Function: blog-admin-assistant (modo padrao | dedicado)
 */
(function () {
  var messages = [];

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

  /** Respostas da IA vêm em Markdown; utilizador e erros ficam em texto puro. */
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
   * @param {string} text
   * @param {boolean} isUser
   * @param {boolean} [renderMarkdown] — só para bolhas do assistente (não «Sistema»)
   */
  function appendLine(who, text, isUser, renderMarkdown) {
    var box = $("assist-chat");
    if (!box) return;
    var div = document.createElement("div");
    div.className = "msg" + (isUser ? " user" : "");
    var useMd = !isUser && !!renderMarkdown;
    var bubbleClass = "bubble" + (useMd ? " bubble-md" : "");
    var inner = useMd ? markdownToSafeHtml(text) : escapeHtml(text).replace(/\n/g, "<br>");
    div.innerHTML =
      '<span class="who">' + escapeHtml(who) + "</span>" + '<div class="' + bubbleClass + '">' + inner + "</div>";
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function selectedMode() {
    var r = document.querySelector('input[name="assist-mode"]:checked');
    return r && r.value === "dedicado" ? "dedicado" : "padrao";
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
      appendLine(
        mode === "dedicado" ? "Assistente (IA dedicada)" : "Assistente (IA padrão)",
        reply,
        false,
        true
      );
    } catch (e) {
      messages.pop();
      appendLine("Sistema", (e && e.message) || "Erro", false, false);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function clearChat() {
    messages = [];
    var box = $("assist-chat");
    if (box) {
      box.innerHTML =
        '<div class="msg"><span class="who">Assistente</span><div class="bubble">Olá. Pergunte sobre sequência de posts, categorias, o que publicar a seguir ou dúvidas do painel. Escolha <strong>IA padrão</strong> para respostas rápidas ou <strong>IA dedicada</strong> para plano e narrativa mais profundos.</div></div>';
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    await requireAuth();
    if (typeof window.initSupabase === "function") window.initSupabase();

    clearChat();

    $("assist-send") && $("assist-send").addEventListener("click", function () {
      void send();
    });
    $("assist-clear") &&
      $("assist-clear").addEventListener("click", function () {
        clearChat();
      });

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
