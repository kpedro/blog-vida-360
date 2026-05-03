/**
 * Planejador de postagens — Blog Vida 360º (admin)
 * Tabela: blog360_post_plan_items (ver BLOG360_POST_PLANNER.sql)
 */
(function () {
  const TABLE = "blog360_post_plan_items";

  function $(id) {
    return document.getElementById(id);
  }

  function getSupabaseUrl() {
    return (window.VITE_SUPABASE_URL || "").trim();
  }

  function getAnonKey() {
    return window.VITE_SUPABASE_ANON_KEY || "";
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
