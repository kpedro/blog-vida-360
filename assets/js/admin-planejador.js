/**
 * Planejador de postagens — Blog Vida 360º (admin)
 * Tabela: blog360_post_plan_items (ver BLOG360_POST_PLANNER.sql)
 */
(function () {
  const TABLE = "blog360_post_plan_items";
  const STORAGE_ASSIST_PLANNER = "blog360_assist_planner_seed";

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

  function showBanner(elId, text, isErr) {
    var el = $(elId);
    if (!el) return;
    el.textContent = text || "";
    el.className = "banner " + (isErr ? "err" : "ok");
    el.style.display = text ? "block" : "none";
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var items = [];

  async function loadItems() {
    var session = await requireAuth();
    if (!session) return;
    var c = window.supabaseClient;
    var res = await c.from(TABLE).select("*").order("sort_order", { ascending: true });
    if (res.error) {
      var msg = res.error.message || String(res.error);
      if (/does not exist|schema cache/i.test(msg)) {
        msg =
          "Tabela não encontrada. Execute BLOG360_POST_PLANNER.sql no Supabase (e confirme que blog360_updated_at existe — rode BLOG360_SITE_SETTINGS.sql se precisar).";
      }
      showBanner("planner-banner", msg, true);
      items = [];
      render();
      return;
    }
    items = res.data || [];
    showBanner("planner-banner", "", false);
    render();
  }

  function render() {
    var body = $("planner-tbody");
    if (!body) return;
    if (!items.length) {
      body.innerHTML =
        '<tr><td colspan="10" class="muted" style="padding:1.5rem;">Nenhum item ainda. Use «Adicionar ideia» para começar a trilha.</td></tr>';
      renderNextFocusPanel();
      return;
    }
    body.innerHTML = items
      .map(function (row, idx) {
        var id = row.id;
        return (
          "<tr data-id=\"" +
          escapeHtml(id) +
          "\">" +
          "<td class=\"num\">" +
          (idx + 1) +
          "</td>" +
          "<td><select class=\"cell-status\" data-id=\"" +
          escapeHtml(id) +
          "\">" +
          ["idea", "planned", "in_progress", "published", "skipped"]
            .map(function (st) {
              return (
                "<option value=\"" +
                st +
                "\"" +
                (row.status === st ? " selected" : "") +
                ">" +
                labelStatus(st) +
                "</option>"
              );
            })
            .join("") +
          "</select></td>" +
          "<td><input type=\"text\" class=\"cell-cat\" data-id=\"" +
          escapeHtml(id) +
          "\" value=\"" +
          escapeHtml(row.category) +
          "\" list=\"planner-cats\" placeholder=\"Categoria\"></td>" +
          "<td><input type=\"text\" class=\"cell-title\" data-id=\"" +
          escapeHtml(id) +
          "\" value=\"" +
          escapeHtml(row.title) +
          "\" placeholder=\"Título / tema\"></td>" +
          "<td><input type=\"text\" class=\"cell-beat\" data-id=\"" +
          escapeHtml(id) +
          "\" value=\"" +
          escapeHtml(row.narrative_beat) +
          "\" placeholder=\"Papel na história\"></td>" +
          "<td><textarea class=\"cell-idea\" data-id=\"" +
          escapeHtml(id) +
          "\" rows=\"2\" placeholder=\"Ângulo, outline\">" +
          escapeHtml(row.idea) +
          "</textarea></td>" +
          "<td><input type=\"date\" class=\"cell-date\" data-id=\"" +
          escapeHtml(id) +
          "\" value=\"" +
          escapeHtml(row.planned_date || "") +
          "\"></td>" +
          "<td><input type=\"text\" class=\"cell-slug\" data-id=\"" +
          escapeHtml(id) +
          "\" value=\"" +
          escapeHtml(row.linked_article_slug || "") +
          "\" placeholder=\"slug-publicado\"></td>" +
          "<td><textarea class=\"cell-notes\" data-id=\"" +
          escapeHtml(id) +
          "\" rows=\"2\" placeholder=\"Notas\">" +
          escapeHtml(row.notes) +
          "</textarea></td>" +
          "<td class=\"actions\">" +
          "<button type=\"button\" class=\"btn-sm\" data-act=\"save\" data-id=\"" +
          escapeHtml(id) +
          "\">Guardar</button>" +
          "<button type=\"button\" class=\"btn-sm\" data-act=\"up\" data-id=\"" +
          escapeHtml(id) +
          "\"" +
          (idx === 0 ? " disabled" : "") +
          ">↑</button>" +
          "<button type=\"button\" class=\"btn-sm\" data-act=\"down\" data-id=\"" +
          escapeHtml(id) +
          "\"" +
          (idx === items.length - 1 ? " disabled" : "") +
          ">↓</button>" +
          "<button type=\"button\" class=\"btn-sm danger\" data-act=\"del\" data-id=\"" +
          escapeHtml(id) +
          "\">Apagar</button>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    renderNextFocusPanel();
  }

  function getNextQueueItem() {
    for (var i = 0; i < items.length; i++) {
      if (items[i].status !== "published" && items[i].status !== "skipped") {
        return { row: items[i], position: i + 1 };
      }
    }
    return null;
  }

  function plannerHints(next) {
    if (!next || !next.row) return [];
    var r = next.row;
    var h = [];
    if (!(String(r.idea || "").trim())) {
      h.push("A «Ideia» deste próximo slot está vazia — bom momento para detalhar ou pedir brainstorming ao assistente.");
    }
    if (!(String(r.narrative_beat || "").trim())) {
      h.push("Preencha o «Gancho na narrativa» para manter o fio editorial coerente.");
    }
    if (r.planned_date) {
      var t = Date.parse(r.planned_date + "T12:00:00");
      if (!isNaN(t) && t < Date.now() - 86400000) {
        h.push("A data planeada já passou — actualize a data ou o estado quando fizer sentido.");
      }
    }
    if ((r.status || "") === "idea") {
      h.push("Ainda em «Ideia» — quando firmar o tema, pode mudar para «Planeado» ou «Em progresso».");
    }
    return h;
  }

  function buildPlannerSummaryMarkdown() {
    var lines = items.map(function (r, i) {
      return (
        (i + 1) +
        ". **" +
        String(r.title || "sem título").replace(/\*\*/g, "") +
        "** — " +
        labelStatus(r.status) +
        (r.category ? " · " + r.category : "")
      );
    });
    var next = getNextQueueItem();
    var tail = "";
    if (next) {
      var nr = next.row;
      tail =
        "\n\n### Próximo na sequência\n\n" +
        "- **Título:** " +
        String(nr.title || "").replace(/\*\*/g, "") +
        "\n- **Estado:** " +
        labelStatus(nr.status) +
        "\n- **Categoria:** " +
        (nr.category || "") +
        "\n- **Gancho na narrativa:** " +
        (String(nr.narrative_beat || "").trim() || "_vazio_") +
        "\n- **Ideia:** " +
        (String(nr.idea || "").trim().replace(/\n+/g, " ") || "_vazio_") +
        "\n- **Data planeada:** " +
        (nr.planned_date || "_sem data_") +
        "\n- **Notas:** " +
        (String(nr.notes || "").trim().replace(/\n+/g, " ") || "_vazio_");
    }
    return "## Fila do planejador (ordem)\n\n" + lines.join("\n") + tail;
  }

  function hidePlannerIaPanel() {
    var pan = $("planner-ia-panel");
    var pre = $("planner-ia-pre");
    if (pre) pre.textContent = "";
    if (pan) pan.setAttribute("hidden", "");
  }

  function showPlannerIaPanel(text) {
    var pan = $("planner-ia-panel");
    var pre = $("planner-ia-pre");
    if (pre) pre.textContent = text || "";
    if (pan) {
      pan.removeAttribute("hidden");
      try {
        pan.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (e) {}
    }
  }

  function buildSuggestIaPrompt() {
    var md = buildPlannerSummaryMarkdown();
    if (md.length > 9000) md = md.slice(0, 9000) + "\n\n[… fila truncada]";
    return [
      "És o assistente editorial do Blog Vida 360º (bem-estar, aromaterapia segura, rotina). Segue o resumo da minha fila de posts — a ordem é a sequência sugerida na narrativa.",
      "",
      "Foca no bloco «Próximo na sequência». Responde em português, de forma compacta:",
      "",
      "1) Três opções de título atractivo para esse próximo post (lista numerada).",
      "2) Uma linha de gancho opcional para Instagram ou redes.",
      "3) Diz «Ordem: ok» ou «Ordem: ajustar» e uma frase curta se sugerires trocar a prioridade de algum item.",
      "",
      "Não inventes dados médicos. Se faltar contexto, assinala-o numa linha.",
      "",
      md,
    ].join("\n");
  }

  async function suggestNextWithIa() {
    var next = getNextQueueItem();
    if (!next) {
      window.alert("Não há próximo item na fila para sugerir.");
      return;
    }
    if (location.protocol === "file:") {
      window.alert("Abra o painel por http://localhost (npm run dev), não como file://.");
      return;
    }
    if (!getSupabaseUrl()) {
      window.alert("URL do Supabase não definida.");
      return;
    }
    var session = await getSession();
    if (!session) return;

    var btn = $("btn-planner-suggest-ia");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "A gerar…";
    }
    hidePlannerIaPanel();
    try {
      var res = await fetch(getSupabaseUrl() + "/functions/v1/blog-admin-assistant", {
        method: "POST",
        headers: fnHeaders(session),
        body: JSON.stringify({
          messages: [{ role: "user", content: buildSuggestIaPrompt() }],
          mode: "padrao",
        }),
      });
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) throw new Error(data.error || data.details || "Erro na função blog-admin-assistant");
      var reply = String((data && data.reply) || "").trim();
      if (!reply) throw new Error("Resposta vazia da IA.");
      showPlannerIaPanel(reply);
      showBanner("planner-banner", "Sugestão da IA pronta (modo rápido). Pode copiar ou levar ao assistente para aprofundar.", false);
    } catch (e) {
      showBanner("planner-banner", (e && e.message) || "Erro ao pedir sugestão. Deploy blog-admin-assistant e GEMINI_API?", true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Sugerir títulos (IA)";
      }
    }
  }

  function goPlannerToAssistant() {
    if (!items.length) return;
    var md = buildPlannerSummaryMarkdown();
    var pre = [
      "Tenho o planejamento editorial abaixo no quadro do blog. O **próximo na fila** é o indicado em «Próximo na sequência».",
      "",
      "Ajuda-me a: (1) definir o melhor ângulo para esse próximo post; (2) sugerir 2–3 ganchos de abertura; (3) dizer se a ordem da fila faz sentido ou se devo trocar prioridades.",
      "",
      md,
    ].join("\n");
    var text = pre.length > 20000 ? pre.slice(0, 20000) + "\n\n[… truncado]" : pre;
    try {
      sessionStorage.setItem(STORAGE_ASSIST_PLANNER, JSON.stringify({ v: 1, prefill: text }));
    } catch (e) {
      window.alert("Armazenamento cheio. Copie o resumo do planejador manualmente.");
      return;
    }
    window.location.href = "admin-assistente-painel.html?from_planner=1";
  }

  function renderNextFocusPanel() {
    var root = $("planner-next-panel");
    if (!root) return;
    if (!items.length) {
      root.style.display = "none";
      root.innerHTML = "";
      hidePlannerIaPanel();
      return;
    }
    root.style.display = "block";
    var next = getNextQueueItem();
    if (!next) {
      root.innerHTML =
        "<p class=\"next-title\"><strong>Fila</strong></p>" +
        "<p>Todos os itens estão <strong>publicados</strong> ou em <strong>skip</strong>. Adicione uma nova ideia ou reabra um item.</p>";
      hidePlannerIaPanel();
      return;
    }
    var r = next.row;
    var hints = plannerHints(next);
    var hintsHtml = hints.length
      ? "<ul class=\"next-hints\">" +
        hints
          .map(function (x) {
            return "<li>" + escapeHtml(x) + "</li>";
          })
          .join("") +
        "</ul>"
      : "";
    root.innerHTML =
      "<p class=\"next-title\"><strong>Próximo na sequência</strong> (posição " +
      next.position +
      ")</p>" +
      "<p class=\"next-meta\">" +
      escapeHtml(r.title || "(sem título)") +
      " · <span>" +
      escapeHtml(labelStatus(r.status)) +
      "</span>" +
      (r.category ? " · " + escapeHtml(r.category) : "") +
      "</p>" +
      (String(r.narrative_beat || "").trim()
        ? "<p class=\"next-beat\"><em>Gancho na narrativa:</em> " + escapeHtml(r.narrative_beat) + "</p>"
        : "") +
      (r.planned_date ? "<p class=\"next-date\"><em>Data planeada:</em> " + escapeHtml(r.planned_date) + "</p>" : "") +
      hintsHtml +
      "<div class=\"planner-next-actions\">" +
      "<button type=\"button\" class=\"btn secondary\" id=\"btn-planner-suggest-ia\">Sugerir títulos (IA)</button>" +
      "<button type=\"button\" class=\"btn secondary\" id=\"btn-planner-assistant\">Discutir com o assistente do painel</button>" +
      "</div>" +
      "<p class=\"hint small\">«Sugerir títulos» usa a mesma API em modo rápido. «Discutir» abre o chat completo. Envie o resumo da fila + o próximo post para priorizar e afinar.</p>";

    var btnA = $("btn-planner-assistant");
    if (btnA) {
      btnA.onclick = function () {
        goPlannerToAssistant();
      };
    }
    var btnS = $("btn-planner-suggest-ia");
    if (btnS) {
      btnS.onclick = function () {
        void suggestNextWithIa();
      };
    }
  }

  function labelStatus(st) {
    var m = {
      idea: "Ideia",
      planned: "Planeado",
      in_progress: "Em progresso",
      published: "Publicado",
      skipped: "Adiado / skip",
    };
    return m[st] || st;
  }

  function collectRow(id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return null;
    function val(sel) {
      var el = tr.querySelector(sel);
      return el ? el.value.trim() : "";
    }
    return {
      status: val(".cell-status"),
      category: val(".cell-cat") || "geral",
      title: val(".cell-title"),
      narrative_beat: val(".cell-beat"),
      idea: val(".cell-idea"),
      planned_date: val(".cell-date") || null,
      linked_article_slug: val(".cell-slug") || null,
      notes: val(".cell-notes"),
    };
  }

  async function saveRow(id) {
    var session = await requireAuth();
    if (!session) return;
    var patch = collectRow(id);
    if (!patch) return;
    var c = window.supabaseClient;
    var res = await c.from(TABLE).update(patch).eq("id", id);
    if (res.error) {
      showBanner("planner-banner", res.error.message || "Erro ao guardar", true);
      return;
    }
    showBanner("planner-banner", "Linha guardada.", false);
    await loadItems();
  }

  async function deleteRow(id) {
    if (!window.confirm("Apagar esta linha do planejador?")) return;
    var session = await requireAuth();
    if (!session) return;
    var c = window.supabaseClient;
    var res = await c.from(TABLE).delete().eq("id", id);
    if (res.error) {
      showBanner("planner-banner", res.error.message || "Erro ao apagar", true);
      return;
    }
    await loadItems();
  }

  async function addRow() {
    var session = await requireAuth();
    if (!session) return;
    var c = window.supabaseClient;
    var u = await c.auth.getUser();
    var uid = u.data.user && u.data.user.id;
    if (!uid) {
      showBanner("planner-banner", "Sem utilizador autenticado.", true);
      return;
    }
    var maxOrder = 0;
    items.forEach(function (r) {
      if (typeof r.sort_order === "number" && r.sort_order > maxOrder) maxOrder = r.sort_order;
    });
    var res = await c.from(TABLE).insert({
      user_id: uid,
      sort_order: maxOrder + 10,
      status: "idea",
      category: "geral",
      title: "Nova ideia",
      idea: "",
      narrative_beat: "",
      notes: "",
    });
    if (res.error) {
      showBanner("planner-banner", res.error.message || "Erro ao criar", true);
      return;
    }
    await loadItems();
  }

  async function moveRow(id, dir) {
    var ix = items.findIndex(function (r) {
      return r.id === id;
    });
    if (ix < 0) return;
    var jx = dir === "up" ? ix - 1 : ix + 1;
    if (jx < 0 || jx >= items.length) return;
    var a = items[ix];
    var b = items[jx];
    var sa = a.sort_order;
    var sb = b.sort_order;
    var session = await requireAuth();
    if (!session) return;
    var c = window.supabaseClient;
    var r1 = await c.from(TABLE).update({ sort_order: sb }).eq("id", a.id);
    if (r1.error) {
      showBanner("planner-banner", r1.error.message, true);
      return;
    }
    var r2 = await c.from(TABLE).update({ sort_order: sa }).eq("id", b.id);
    if (r2.error) {
      showBanner("planner-banner", r2.error.message, true);
      return;
    }
    await loadItems();
  }

  function copyNarrativeSummary() {
    if (!items.length) {
      window.alert("Nada para copiar.");
      return;
    }
    var lines = items.map(function (r, i) {
      var bits = [
        (i + 1) + ". " + (r.title || "(sem título)"),
        "[" + labelStatus(r.status) + (r.category ? " · " + r.category : "") + "]",
      ];
      if (r.narrative_beat) bits.push("Narrativa: " + r.narrative_beat);
      if (r.idea) bits.push("Ideia: " + r.idea.replace(/\n+/g, " "));
      if (r.planned_date) bits.push("Data: " + r.planned_date);
      if (r.linked_article_slug) bits.push("Slug: " + r.linked_article_slug);
      return bits.join("\n   ");
    });
    var text = "Fio editorial — Blog Vida 360º\n\n" + lines.join("\n\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          showBanner("planner-banner", "Resumo copiado para a área de transferência.", false);
        },
        function () {
          window.prompt("Copie o texto:", text);
        }
      );
    } else {
      window.prompt("Copie o texto:", text);
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    await requireAuth();
    if (typeof window.initSupabase === "function") window.initSupabase();

    $("btn-planner-add") && $("btn-planner-add").addEventListener("click", function () {
      void addRow();
    });
    $("btn-planner-refresh") &&
      $("btn-planner-refresh").addEventListener("click", function () {
        void loadItems();
      });
    $("btn-planner-copy") &&
      $("btn-planner-copy").addEventListener("click", function () {
        copyNarrativeSummary();
      });

    $("btn-planner-ia-copy") &&
      $("btn-planner-ia-copy").addEventListener("click", function () {
        var pre = $("planner-ia-pre");
        var t = (pre && pre.textContent) || "";
        if (!t.trim()) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          void navigator.clipboard.writeText(t).then(
            function () {
              showBanner("planner-banner", "Sugestão copiada.", false);
            },
            function () {
              window.prompt("Copie o texto:", t);
            }
          );
        } else {
          window.prompt("Copie o texto:", t);
        }
      });

    var tbody = $("planner-tbody");
    if (tbody) {
      tbody.addEventListener("click", function (ev) {
        var t = ev.target;
        if (!t || !t.getAttribute) return;
        var act = t.getAttribute("data-act");
        var id = t.getAttribute("data-id");
        if (!act || !id) return;
        if (act === "save") void saveRow(id);
        else if (act === "del") void deleteRow(id);
        else if (act === "up") void moveRow(id, "up");
        else if (act === "down") void moveRow(id, "down");
      });
    }

    await loadItems();
  });
})();
