/**
 * Remove do HTML do artigo trechos colados por engano (head, meta OG, favicon, etc.).
 * Usado em post.html antes de exibir e no editor ao salvar.
 */
(function (global) {
  function looksLikeHeadDumpText(text) {
    var t = (text || '').replace(/\s+/g, ' ');
    if (t.length < 40) return false;
    if (t.indexOf('og-banner.png') >= 0 && (t.indexOf('og:title') >= 0 || t.indexOf('property=') >= 0 || t.indexOf('og:image') >= 0)) {
      return true;
    }
    if (t.indexOf('favicon.svg') >= 0 && (t.indexOf('og:') >= 0 || t.indexOf('twitter:') >= 0)) {
      return true;
    }
    // Dump colado após mudança de domínio (canonical com blogvida360 + ids og-)
    if (/blogvida360\.com\.br/i.test(t) && /canonical-link|id\s*=\s*["']canonical-link["']/i.test(t) && (/og:title|property\s*=\s*["']og:/i.test(t) || /id\s*=\s*["']og-/i.test(t))) {
      return true;
    }
    if (/blogvida360\.com\.br\/post\.html\?post=/i.test(t) && (/Metatags\s+Dinâmicos|Open Graph|twitter:image/i.test(t))) {
      return true;
    }
    var hasOg = /property\s*=\s*["']og:|og:title|og:image|og:url|og:description/i.test(t);
    var hasTw = /twitter:(?:card|title|image|description)|name\s*=\s*["']twitter:/i.test(t);
    var hasSite = /favicon\.svg|og-banner\.png|Metatags\s+Dinâmicos|id\s*=\s*["']og-/i.test(t);
    var hasTags = /<(?:meta|link)\b/i.test(t) || /&lt;(?:meta|link)\b/i.test(t);
    if (hasSite && (hasOg || hasTw)) return true;
    if (hasTags && hasOg && hasTw) return true;
    if (/id\s*=\s*["']og-(?:title|image|url|description)/i.test(t) && hasTags) return true;
    return false;
  }

  /** Bloco colado da própria post.html (favicon + OG + Twitter). */
  function stripKnownHeadPasteBlock(h) {
    var out = h;
    out = out.replace(
      /<!--\s*Favicon\s*-->[\s\S]*?<meta[^>]*name\s*=\s*["']twitter:image:alt["'][^>]*\/?>/gi,
      ''
    );
    out = out.replace(
      /<link[^>]*favicon\.svg[^>]*>[\s\S]*?<meta[^>]*name\s*=\s*["']twitter:image:alt["'][^>]*\/?>/gi,
      ''
    );
    out = out.replace(
      /<!--\s*Favicon\s*-->[\s\S]*?<meta[^>]*name\s*=\s*["']twitter:image["'][^>]*\/?>/gi,
      ''
    );
    out = out.replace(
      /<link[^>]*favicon\.svg[^>]*>[\s\S]*?<meta[^>]*name\s*=\s*["']twitter:image["'][^>]*\/?>/gi,
      ''
    );
    // Ordem com canonical antes do favicon (comum após copiar página com domínio novo)
    out = out.replace(
      /<link[^>]*rel\s*=\s*["']canonical["'][^>]*>[\s\S]*?<meta[^>]*name\s*=\s*["']twitter:image:alt["'][^>]*\/?>/gi,
      ''
    );
    out = out.replace(
      /<!--\s*Open Graph Metatags Dinâmicos\s*-->[\s\S]*?<meta[^>]*name\s*=\s*["']twitter:image:alt["'][^>]*\/?>/gi,
      ''
    );
    out = out.replace(
      /<!--\s*Twitter Card Metatags Dinâmicos\s*-->[\s\S]*?<meta[^>]*name\s*=\s*["']twitter:image:alt["'][^>]*\/?>/gi,
      ''
    );
    return out;
  }

  /** Remove bloco colado do <head> da post.html em texto/Markdown (antes do parse). */
  function stripHeadPastePreamble(str) {
    if (!str || typeof str !== 'string') return str;
    var s = str.replace(/\r\n/g, '\n');
    var patterns = [
      /(?:^|\n)\s*<!--\s*Favicon\s*-->[\s\S]*?<meta[^>]*\bname=["']twitter:image:alt["'][^>]*\/?>/gi,
      /(?:^|\n)\s*<!--\s*Favicon\s*-->[\s\S]*?<meta[^>]*\bname=["']twitter:image["'][^>]*\/?>/gi,
      /(?:^|\n)\s*<link[^>]*favicon\.svg[^>]*>[\s\S]*?<meta[^>]*\bname=["']twitter:image:alt["'][^>]*\/?>/gi,
      /(?:^|\n)\s*<link[^>]*favicon\.svg[^>]*>[\s\S]*?<meta[^>]*\bname=["']twitter:image["'][^>]*\/?>/gi,
      /(?:^|\n)\s*<link[^>]*rel=["']canonical["'][^>]*>[\s\S]*?<meta[^>]*\bname=["']twitter:image:alt["'][^>]*\/?>/gi
    ];
    for (var i = 0; i < patterns.length; i++) {
      s = s.replace(patterns[i], '\n');
    }
    return s.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n').trim();
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
        var tx = el.textContent || '';
        if (looksLikeHeadDumpText(tx)) el.remove();
        else if (/blogvida360\.com\.br/i.test(tx) && /<(meta|link)\b/i.test(tx) && (/og:title|twitter:card|canonical-link/i.test(tx))) el.remove();
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

      var guard = 0;
      while (guard++ < 40) {
        var fe = root.firstElementChild;
        if (!fe) break;
        var ih = fe.innerHTML || '';
        var tx = fe.textContent || '';
        var kill =
          looksLikeHeadDumpText(tx) ||
          (ih.indexOf('og-banner.png') >= 0 && ih.indexOf('id="og-title"') >= 0) ||
          (ih.indexOf('og-banner.png') >= 0 && ih.indexOf("id='og-title'") >= 0) ||
          (ih.indexOf('property="og:title"') >= 0 && ih.indexOf('Vida 360º - Blog') >= 0 && ih.indexOf('og-banner') >= 0) ||
          (ih.indexOf('canonical-link') >= 0 && ih.indexOf('blogvida360') >= 0 && ih.indexOf('og-title') >= 0);
        if (!kill) break;
        fe.remove();
      }

      return tpl.innerHTML;
    } catch (e) {
      return null;
    }
  }

  function sanitizeArticleHtml(html) {
    if (!html || typeof html !== 'string') return html;
    var h = stripHeadPastePreamble(html);

    h = h.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
    h = h.replace(/<!DOCTYPE[^>]*>/gi, '');
    h = h.replace(/<\/?html[^>]*>/gi, '');

    var bodyM = h.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
    if (bodyM) h = bodyM[1];

    h = h.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
    h = h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

    h = stripKnownHeadPasteBlock(h);

    h = h.replace(/<pre\b[^>]*>[\s\S]*?canonical-link[\s\S]*?(?:twitter:image:alt|og:site_name)[\s\S]*?<\/pre>/gi, '');
    h = h.replace(/<pre\b[^>]*>[\s\S]*?blogvida360\.com\.br\/post\.html[\s\S]*?Metatags Dinâmicos[\s\S]*?<\/pre>/gi, '');

    var domClean = sanitizeWithTemplate(h);
    if (domClean !== null) h = domClean;

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

    h = stripKnownHeadPasteBlock(h);

    var domClean2 = sanitizeWithTemplate(h);
    if (domClean2 !== null) h = domClean2;

    return h.replace(/^\s+|\s+$/g, '').replace(/(?:\s*<br\s*\/?>\s*){4,}/gi, '<br><br><br>');
  }

  function scoreSanitizedBodyLen(s) {
    var cleaned = sanitizeArticleHtml(s);
    return (cleaned || '').replace(/\s/g, '').length;
  }

  /** Prioriza content / conteudo_markdown (gravados pelo editor) e evita conteudo legado só com metatags. */
  function pickBlog360PostBodyRaw(p) {
    if (!p || typeof p !== 'object') return '';
    var order = ['content', 'conteudo_markdown', 'conteudo'];
    var candidates = [];
    for (var i = 0; i < order.length; i++) {
      var v = p[order[i]];
      if (v != null && String(v).trim()) candidates.push(String(v).trim());
    }
    if (candidates.length === 0) return '';
    if (candidates.length === 1) return candidates[0];
    var best = candidates[0];
    var bestScore = scoreSanitizedBodyLen(best);
    for (var j = 1; j < candidates.length; j++) {
      var sc = scoreSanitizedBodyLen(candidates[j]);
      if (sc > bestScore) {
        bestScore = sc;
        best = candidates[j];
      }
    }
    return best;
  }

  global.sanitizeArticleHtml = sanitizeArticleHtml;
  global.pickBlog360PostBodyRaw = pickBlog360PostBodyRaw;
})(typeof window !== 'undefined' ? window : globalThis);
