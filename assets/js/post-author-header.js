/**
 * Cabeçalho do autor no artigo — Blog Vida 360º (avatar + nome + função + data).
 * Inspirado no PedagoFlow (SchoolMuralAuthorHeader); dados vêm do post + site_settings.
 */
(function (global) {
  const DEFAULT_AVATAR = 'assets/images/avatar-vida360.png';

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeAvatarUrl(url) {
    const v = String(url || '').trim();
    if (!v || /^blob:/i.test(v)) return null;
    if (/^data:image\//i.test(v)) return v;
    if (/^https?:\/\//i.test(v)) return v;
    if (v.startsWith('/')) return v;
    return v;
  }

  function authorInitials(name) {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatPublishedLabel(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const dataFmt = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const horaFmt = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return 'Publicado em ' + dataFmt + ' às ' + horaFmt;
    } catch (_) {
      return 'Publicado em ' + String(iso).slice(0, 10);
    }
  }

  /**
   * @param {{ mountId?: string, mountEl?: HTMLElement, authorName?: string, roleLabel?: string, avatarUrl?: string, dateLabel?: string }} opts
   */
  function render(opts) {
    const mount =
      (opts && opts.mountEl) ||
      (opts && opts.mountId ? document.getElementById(opts.mountId) : null);
    if (!mount) return false;

    const authorName = String((opts && opts.authorName) || '').trim();
    const roleLabel = String((opts && opts.roleLabel) || '').trim();
    const dateLabel = String((opts && opts.dateLabel) || '').trim();
    const avatarSrc = normalizeAvatarUrl(opts && opts.avatarUrl) || DEFAULT_AVATAR;
    const initials = authorInitials(authorName || 'Autor');

    if (!authorName && !dateLabel) {
      mount.style.display = 'none';
      mount.innerHTML = '';
      return false;
    }

    const nameLine = roleLabel
      ? `<span class="article-author-name">${escapeHtml(authorName)}</span><span class="article-author-sep" aria-hidden="true"> | </span><span class="article-author-role">${escapeHtml(roleLabel)}</span>`
      : `<span class="article-author-name">${escapeHtml(authorName)}</span>`;

    const aria = roleLabel
      ? `Publicado por ${authorName}, ${roleLabel}`
      : authorName
        ? `Publicado por ${authorName}`
        : 'Informações de publicação';

    mount.innerHTML =
      '<div class="article-author-inner" role="group" aria-label="' +
      escapeHtml(aria) +
      '">' +
      '<div class="article-author-avatar-wrap">' +
      `<img class="article-author-avatar" src="${escapeHtml(avatarSrc)}" alt="" width="44" height="44" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />` +
      `<span class="article-author-avatar-fallback" style="display:none" aria-hidden="true">${escapeHtml(initials)}</span>` +
      '</div>' +
      '<div class="article-author-text">' +
      (authorName ? `<p class="article-author-line">${nameLine}</p>` : '') +
      (dateLabel ? `<p class="article-author-date">${escapeHtml(dateLabel)}</p>` : '') +
      '</div>' +
      '</div>';

    mount.style.display = '';
    return true;
  }

  global.Blog360PostAuthorHeader = {
    DEFAULT_AVATAR,
    render,
    formatPublishedLabel,
    normalizeAvatarUrl,
    authorInitials,
  };
})(typeof window !== 'undefined' ? window : globalThis);
