/**
 * First-touch UTM — Blog Vida 360º → Forja Campeã
 */
(function (global) {
  var STORAGE_KEY = 'blog360_utm_v1';

  function trim(v, max) {
    var s = String(v || '').trim();
    if (!s) return '';
    return s.length > max ? s.slice(0, max) : s;
  }

  function readFromSearch(search) {
    var params = new URLSearchParams(search || '');
    return {
      utm_source: trim(params.get('utm_source'), 120),
      utm_medium: trim(params.get('utm_medium'), 120),
      utm_campaign: trim(params.get('utm_campaign'), 120),
      utm_content: trim(params.get('utm_content'), 120),
      utm_term: trim(params.get('utm_term'), 120),
    };
  }

  function hasUtm(obj) {
    return !!(obj && (obj.utm_source || obj.utm_campaign || obj.utm_medium || obj.utm_content));
  }

  function captureFromUrl() {
    var incoming = readFromSearch(global.location && global.location.search);
    if (!hasUtm(incoming)) return null;
    try {
      var payload = {
        v: 1,
        captured_at: new Date().toISOString(),
        landing_path: (global.location && global.location.pathname) || '',
        utm_source: incoming.utm_source || 'blog_vida360',
        utm_medium: incoming.utm_medium || 'referral',
        utm_campaign: incoming.utm_campaign || '',
        utm_content: incoming.utm_content || '',
        utm_term: incoming.utm_term || '',
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return payload;
    } catch (e) {
      return null;
    }
  }

  function getAttribution() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          utm_source: 'blog_vida360',
          utm_medium: 'referral',
          utm_campaign: '',
          utm_content: '',
          utm_term: '',
        };
      }
      var data = JSON.parse(raw);
      return {
        utm_source: data.utm_source || 'blog_vida360',
        utm_medium: data.utm_medium || 'referral',
        utm_campaign: data.utm_campaign || '',
        utm_content: data.utm_content || '',
        utm_term: data.utm_term || '',
        landing_path: data.landing_path || '',
      };
    } catch (e) {
      return {
        utm_source: 'blog_vida360',
        utm_medium: 'referral',
        utm_campaign: '',
        utm_content: '',
        utm_term: '',
      };
    }
  }

  global.BLOG360_ATTRIBUTION = {
    captureFromUrl: captureFromUrl,
    getAttribution: getAttribution,
    readFromSearch: readFromSearch,
  };

  captureFromUrl();
})(typeof window !== 'undefined' ? window : globalThis);
