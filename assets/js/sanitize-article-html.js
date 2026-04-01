/**
 * Remove do HTML do artigo trechos colados por engano (head, meta OG, favicon, etc.).
 * Usado em post.html antes de exibir e no editor ao salvar.
 */
(function (global) {
  function sanitizeArticleHtml(html) {
    if (!html || typeof html !== 'string') return html;
    var h = html;

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

    // Tags escapadas (coladas como texto: &lt;link … &gt;) — comum após copiar “Ver código fonte”
    h = h.replace(/&lt;link\b[\s\S]*?&gt;/gi, '');
    h = h.replace(/&lt;meta\b[\s\S]*?&gt;/gi, '');
    h = h.replace(/&lt;!--[\s\S]*?--&gt;/gi, '');
    h = h.replace(/&lt;title\b[\s\S]*?&lt;\/title&gt;/gi, '');

    h = h.replace(/<link\b[\s\S]*?>/gi, '');
    h = h.replace(/<meta\b[\s\S]*?>/gi, '');

    // Segunda passagem: às vezes o paste envolve meta/link em <p> ou <div> (após strip, ficam só quebras)
    h = h.replace(/<link\b[\s\S]*?>/gi, '');
    h = h.replace(/<meta\b[\s\S]*?>/gi, '');

    return h.replace(/^\s+|\s+$/g, '').replace(/(?:\s*<br\s*\/?>\s*){4,}/gi, '<br><br><br>');
  }

  global.sanitizeArticleHtml = sanitizeArticleHtml;
})(typeof window !== 'undefined' ? window : globalThis);
