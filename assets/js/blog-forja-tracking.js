/**
 * Eventos de funil — cliques Forja e visualização da ponte produtos.html
 */
(function (global) {
  var FORJA_HOST = 'forjacampea.com.br';

  function getClient() {
    var c = global.supabaseClient;
    if (!c && typeof global.initSupabase === 'function') {
      c = global.initSupabase();
      global.supabaseClient = c;
    }
    return c && c.client ? c : null;
  }

  function track(evento, metadata) {
    var client = getClient();
    if (!client || typeof client.trackEvent !== 'function') return;
    client.trackEvent(evento, global.location && global.location.pathname, metadata || {}).catch(function () {});
  }

  function labelFromAnchor(a) {
    var t = (a.getAttribute('data-forja-track') || a.textContent || a.getAttribute('aria-label') || '').trim();
    return t.slice(0, 120) || 'cta';
  }

  function initClickTracking() {
    global.document.addEventListener(
      'click',
      function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!a || !a.href) return;
        var href = String(a.href);
        var isForja = href.indexOf(FORJA_HOST) !== -1 || a.hasAttribute('data-forja-track');
        var isBridge = /produtos\.html/i.test(href) && (global.location.pathname || '').indexOf('produtos') === -1;
        if (!isForja && !isBridge) return;
        track('forja_cta_click', {
          destination: href,
          label: labelFromAnchor(a),
          bridge: isBridge && !isForja,
          attribution: global.BLOG360_ATTRIBUTION ? global.BLOG360_ATTRIBUTION.getAttribution() : null,
        });
      },
      true
    );
  }

  function initBridgeView() {
    var path = (global.location && global.location.pathname) || '';
    if (path.indexOf('produtos') === -1) return;
    track('forja_bridge_view', {
      attribution: global.BLOG360_ATTRIBUTION ? global.BLOG360_ATTRIBUTION.getAttribution() : null,
    });
  }

  function boot() {
    initClickTracking();
    initBridgeView();
  }

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
