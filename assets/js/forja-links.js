/**
 * Links canónicos Forja Campeã a partir do Blog Vida 360º.
 * UTM consistente para medir tráfego editorial → sistema.
 */
(function (global) {
  var SITE = 'https://forjacampea.com.br';

  function buildForjaUrl(path, campaign, content) {
    var url = SITE + (path.charAt(0) === '/' ? path : '/' + path);
    var params = new URLSearchParams();
    var attr = global.BLOG360_ATTRIBUTION && global.BLOG360_ATTRIBUTION.getAttribution
      ? global.BLOG360_ATTRIBUTION.getAttribution()
      : null;
    params.set('utm_source', (attr && attr.utm_source) || 'blog_vida360');
    params.set('utm_medium', (attr && attr.utm_medium) || 'referral');
    params.set('utm_campaign', campaign || (attr && attr.utm_campaign) || 'blog_bridge');
    if (content) params.set('utm_content', content);
    else if (attr && attr.utm_content) params.set('utm_content', attr.utm_content);
    return url + '?' + params.toString();
  }

  global.BLOG360_FORJA = {
    siteUrl: SITE,
    bridgePath: 'produtos.html',
    urls: {
      comoFunciona: function (content) {
        return buildForjaUrl('/como-funciona', 'blog_bridge', content || 'como_funciona');
      },
      paraLideres: function (content) {
        return buildForjaUrl('/para-lideres', 'blog_bridge', content || 'para_lideres');
      },
      entrar: function (content) {
        return buildForjaUrl('/entrar', 'blog_bridge', content || 'entrar');
      },
    },
    buildUrl: buildForjaUrl,
  };
})(typeof window !== 'undefined' ? window : globalThis);
