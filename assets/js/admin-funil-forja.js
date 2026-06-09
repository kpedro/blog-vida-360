/**
 * Painel funil Blog Vida 360º → Sistema Forja Campeã
 */
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function card(title, value, sub) {
    return (
      '<article class="card"><h3>' +
      title +
      '</h3><div class="num">' +
      value +
      '</div>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') +
      '</article>'
    );
  }

  async function requireAuth() {
    var c = window.supabaseClient;
    if (!c && typeof window.initSupabase === 'function') {
      c = window.initSupabase();
      window.supabaseClient = c;
    }
    if (!c || !c.auth) {
      window.location.href = 'admin-login.html';
      return null;
    }
    var sessionRes = await c.auth.getSession();
    if (!sessionRes.data.session) {
      window.location.href = 'admin-login.html';
      return null;
    }
    return sessionRes.data.session;
  }

  async function loadFunnel() {
    var errEl = $('funnel-error');
    var warnEl = $('funnel-warn');
    if (errEl) errEl.textContent = '';
    if (warnEl) warnEl.style.display = 'none';

    var session = await requireAuth();
    if (!session) return;

    var url = (window.VITE_SUPABASE_URL || '').trim();
    var anon = window.VITE_SUPABASE_ANON_KEY || '';
    if (!url) {
      if (errEl) errEl.textContent = 'URL Supabase não configurada.';
      return;
    }

    try {
      var res = await fetch(url + '/functions/v1/blog360-forja-funnel', {
        headers: {
          Authorization: 'Bearer ' + session.access_token,
          apikey: anon,
        },
      });
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);

      var blog = data.blog || {};
      var crm = data.forja_crm || {};

      $('funnel-grid-blog').innerHTML =
        card('Cliques CTA Forja', blog.forja_cta_clicks_7d ?? 0, '7 dias') +
        card('Views ponte produtos', blog.forja_bridge_views_7d ?? 0, '7 dias') +
        card('Leads formulário Forja', blog.leads_form_forja_7d ?? 0, '7 dias · total ' + (blog.leads_form_forja_total ?? 0)) +
        card('Taxa clique → lead', (blog.click_to_lead_pct_7d ?? 0) + '%', '7 dias') +
        card('Sync CRM ok', blog.leads_synced_fc ?? 0, 'blog360_leads.fc_sync_status=synced');

      $('funnel-grid-crm').innerHTML =
        card('Leads CRM (blog)', crm.leads_utm_blog_7d ?? 0, '7 dias · total ' + (crm.leads_utm_blog_total ?? 0)) +
        card('Cliques 30 dias', blog.forja_cta_clicks_30d ?? 0, 'referência mensal');

      if (!crm.service_role_configured && warnEl) {
        warnEl.style.display = 'block';
        warnEl.textContent =
          'Secret SUPABASE_SERVICE_ROLE_KEY ausente na Edge Function blog360-forja-funnel / blog360-sync-forja-lead. ' +
          'Leads do formulário guardam-se no blog, mas o espelho em fc_contato_leads precisa do service role.';
      }
    } catch (e) {
      if (errEl) {
        errEl.textContent =
          (e && e.message) ||
          'Erro ao carregar funil. Confirme login admin, SQL BLOG360_FORJA_FUNNEL.sql e deploy da função blog360-forja-funnel.';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.initSupabase === 'function') window.initSupabase();
    loadFunnel();
    var btn = $('btn-refresh');
    if (btn) btn.addEventListener('click', function () {
      loadFunnel();
    });
  });
})();
