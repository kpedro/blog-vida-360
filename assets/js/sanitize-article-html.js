/**
 * Remove do HTML do artigo trechos colados por engano (head, meta OG, favicon, etc.).
 * Usado em post.html antes de exibir e no editor ao salvar.
 */
(function (global) {
  function looksLikeHeadDumpText(text) {
    var t = (text || '').replace(/\s+/g, ' ');
    if (t.length < 80) return false;
    var hasOg = /property\s*=\s*["']og:|og:title|og:image|og:url|og:description/i.test(t);
    var hasTw = /twitter:(?:card|title|image|description)|name\s*=\s*["']twitter:/i.test(t);
    var hasSite = /favicon\.svg|og-banner\.png|Metatags\s+Dinâmicos|id\s*=\s*["']og-/i.test(t);
    var hasTags = /<(?:meta|link)\b/i.test(t) || /&lt;(?:meta|link)\b/i.test(t);
    if (hasSite && (hasOg || hasTw)) return true;
    if (hasTags && hasOg && hasTw) return true;
    if (/id\s*=\s*["']og-(?:title|image|url|description)/i.test(t) && hasTags) return true;
    return false;
  }

  function sanitizeWithTemplate(html) {
    if (typeof document === 'undefined' || !document.createElement) return null;
    try {
      var tpl = document.createElement('template');
      tpl.innerHTML = html;
      var root = tpl.content;

      root.querySelectorAll('link, meta, title, base').forEach(function (el) {
        el.remove();
      });

      root.querySelectorAll('pre, code, samp, kbd').forEach(function (el) {
        if (looksLikeHeadDumpText(el.textContent || '')) el.remove();
      });

      root.querySelectorAll('p').forEach(function (el) {
        if (looksLikeHeadDumpText(el.textContent || '')) el.remove();
      });

      root.querySelectorAll('div').forEach(function (el) {
        var kids = el.children;
        var i;
        var onlyInline = true;
        for (i = 0; i < kids.length; i++) {
          var tn = kids[i].tagName;
          if (tn !== 'BR' && tn !== 'SPAN' && tn !== 'B' && tn !== 'I' && tn !== 'STRONG' && tn !== 'EM') {
            onlyInline = false;
            break;
          }
        }
        if (kids.length === 0 || onlyInline) {
          if (looksLikeHeadDumpText(el.textContent || '')) el.remove();
        }
      });

      return tpl.innerHTML;
    } catch (e) {
      return null;
    }
  }

  function sanitizeArticleHtml(html) {
    if (!html || typeof html !== 'string') return html;
    var h = html;

    var domClean = sanitizeWithTemplate(h);
    if (domClean !== null) h = domClean;

    h = h.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
    h = h.replace(/<!DOCTYPE[^>]*>/gi, '');
    h = h.replace(/<\/?html[^>]*>/gi, '');

    var bodyM = h.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
    if (bodyM) h = bodyM[1];

    h = h.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
    h = h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

    h = h.replace(/<pre\b[^>]*>[\s\S]*?(?:Open Graph Metatags|Twitter Card Metatags|Metatags Dinâmicos|property=["']og:|twitter:title|og:title|og:url|og:image|twitter:image|favicon\.svg|og-banner\.png|rel=["']icon["'])[\s\S]*?<\/pre>/gi, '');
    h = h.replace(/<pre\b[^>]*>\s*<code\b[^>]*>[\s\S]*?(?:Open Graph|og:title|twitter:card|favicon\.svg|og:image)[\s\S]*?<\/code>\s*<\/pre>/gi, '');
    h = h.replace(/<pre\b[^>]*>[\s\S]*?&lt;(?:link|meta)\b[\s\S]*?<\/pre>/gi, '');

    h = h.replace(/<!--\s*Open Graph[\s\S]*?-->/gi, '');
    h = h.replace(/<!--\s*Twitter Card[\s\S]*?-->/gi, '');
    h = h.replace(/<!--\s*Favicon[\s\S]*?-->/gi, '');
    h = h.replace(/<!--\s*Script inline[\s\S]*?-->/gi, '');

    h = h.replace(/&lt;link\b[\s\S]*?&gt;/gi, '');
    h = h.replace(/&lt;meta\b[\s\S]*?&gt;/gi, '');
    h = h.replace(/&lt;!--[\s\S]*?--&gt;/gi, '');
    h = h.replace(/&lt;title\b[\s\S]*?&lt;\/title&gt;/gi, '');

    h = h.replace(/<link\b[^>]*>/gi, '');
    h = h.replace(/<meta\b[^>]*>/gi, '');

    h = h.replace(/<link\b[^>]*>/gi, '');
    h = h.replace(/<meta\b[^>]*>/gi, '');

    h = h.replace(/^\s+|\s+$/g, '').replace(/(?:\s*<br\s*\/?>\s*){4,}/gi, '<br><br><br>');

    var domClean2 = sanitizeWithTemplate(h);
    if (domClean2 !== null) h = domClean2;

    return h.replace(/^\s+|\s+$/g, '').replace(/(?:\s*<br\s*\/?>\s*){4,}/gi, '<br><br><br>');
  }

  global.sanitizeArticleHtml = sanitizeArticleHtml;
})(typeof window !== 'undefined' ? window : globalThis);
