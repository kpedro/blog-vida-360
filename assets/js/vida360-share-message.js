/**
 * Mensagem de compartilhamento — Blog Vida 360º (emoji + CTA + hashtags).
 * Alinhado ao padrão PedagoFlow (schoolBlogShareMessage).
 */
(function (global) {
  const DEFAULT_SITE = 'https://www.blogvida360.com.br/';

  const TOPIC_EMOJI = [
    [/aromat|óleo|essencial|doterra|lavanda|difusor/i, '🌿'],
    [/sono|dormir|insônia|noite/i, '😴'],
    [/ansiedade|calma|respira|mindful|medita/i, '🧘'],
    [/foco|produtiv|rotina|hábito/i, '⚡'],
    [/mente|mental|emocional|bem.?estar/i, '💙'],
    [/nutri|aliment|saúde/i, '🥗'],
    [/família|mãe|pai|filh/i, '👨‍👩‍👧'],
  ];

  const CATEGORY_EMOJI = {
    'BEM-ESTAR': '💙',
    DICAS: '✨',
    EVENTOS: '📢',
    AROMATERAPIA: '🌿',
    SONO: '😴',
    MINDFULNESS: '🧘',
  };

  const BASE_HASHTAGS = ['#Vida360', '#BemEstar', '#BlogVida360'];

  const TOPIC_HASHTAGS = [
    [/aromat|óleo|essencial|doterra/i, '#Aromaterapia'],
    [/sono|dormir|insônia/i, '#Sono'],
    [/ansiedade|calma|respira/i, '#Mindfulness'],
    [/foco|produtiv/i, '#Produtividade'],
    [/forja|amway/i, '#ForjaCampea'],
  ];

  function stripPlain(raw) {
    let s = String(raw || '').replace(/\r\n/g, '\n');
    s = s.replace(/^```[^\n]*\n([\s\S]*?)^```\s*$/gm, (_, inner) => String(inner));
    s = s.replace(/^#{1,6}\s+/gm, '');
    s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, (_, label) => label);
    s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
    s = s.replace(/\*([^*\n]+)\*/g, '$1');
    s = s.replace(/`([^`]+)`/g, '$1');
    s = s.replace(/^\s*[-*+]\s+/gm, '');
    s = s.replace(/^\s*\d+\.\s+/gm, '');
    s = s.replace(/\n{3,}/g, '\n\n').trim();
    return s;
  }

  /** Remove bloco repetido quando título/resumo/corpo foram concatenados com o mesmo início. */
  function dedupeRepeatedBlock(text) {
    const plain = stripPlain(text).replace(/\s+/g, ' ').trim();
    if (plain.length < 80) return plain;
    const half = Math.floor(plain.length / 2);
    for (let len = Math.min(220, half); len >= 36; len--) {
      const chunk = plain.slice(0, len).trim();
      if (chunk.length < 36) continue;
      const again = plain.indexOf(chunk, Math.max(len - 8, 24));
      if (again > 20 && again < half + 80) {
        const cut = plain.slice(0, again).trim();
        return cut.endsWith('…') ? cut : `${cut}…`;
      }
    }
    return plain;
  }

  function summaryForShare(text, maxLen) {
    const plain = dedupeRepeatedBlock(text);
    if (!plain) return '';
    if (plain.length <= maxLen) return plain;
    const cut = plain.slice(0, maxLen);
    const sp = cut.lastIndexOf(' ');
    const trimmed = sp > maxLen * 0.55 ? cut.slice(0, sp) : cut;
    return `${trimmed.trim()}…`;
  }

  function openingEmoji(text, category) {
    const cat = String(category || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ');
    if (cat && CATEGORY_EMOJI[cat]) return CATEGORY_EMOJI[cat];
    const blob = `${text} ${category || ''}`;
    for (const [re, emoji] of TOPIC_EMOJI) {
      if (re.test(blob)) return emoji;
    }
    return '✨';
  }

  function hashtagFromLabel(label, maxLen) {
    const ascii = String(label || '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim();
    if (!ascii) return null;
    const words = ascii.split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return null;
    const joined =
      words.length >= 2
        ? words
            .slice(0, 3)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('')
        : words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    const tag = joined.replace(/\s+/g, '');
    if (!tag) return null;
    return `#${tag.length > maxLen ? tag.slice(0, maxLen) : tag}`;
  }

  function hashtagsForShare(text, category) {
    const tags = new Set(BASE_HASHTAGS);
    const blob = `${text} ${category || ''}`;
    for (const [re, tag] of TOPIC_HASHTAGS) {
      if (re.test(blob)) tags.add(tag);
    }
    const catTag = hashtagFromLabel(category, 24);
    if (catTag) tags.add(catTag);
    return [...tags].slice(0, 6);
  }

  /**
   * @param {{ text: string, shareUrl?: string, category?: string, maxSummaryLen?: number, includeHashtags?: boolean }} opts
   */
  function buildShareMessage(opts) {
    const text = String((opts && opts.text) || '').trim();
    const shareUrl = String((opts && opts.shareUrl) || DEFAULT_SITE).trim() || DEFAULT_SITE;
    const category = opts && opts.category;
    const maxSummaryLen = (opts && opts.maxSummaryLen) || 520;
    const summary = summaryForShare(text, maxSummaryLen);
    const emoji = openingEmoji(text, category);
    const parts = [];

    if (summary) {
      parts.push(`${emoji} ${summary}`);
    } else {
      parts.push(`${emoji} Confira no Blog Vida 360º.`);
    }

    parts.push('');
    parts.push('👉 LEIA MAIS:');
    parts.push(shareUrl);

    if (!opts || opts.includeHashtags !== false) {
      const tags = hashtagsForShare(text, category);
      if (tags.length) {
        parts.push('');
        parts.push(tags.join(' '));
      }
    }

    return parts.join('\n').trim();
  }

  /** Texto curto para WhatsApp Status (evita parágrafos longos em fundo verde). */
  function buildStatusShareMessage(opts) {
    const text = String((opts && opts.text) || '').trim();
    const shareUrl = String((opts && opts.shareUrl) || DEFAULT_SITE).trim() || DEFAULT_SITE;
    const category = opts && opts.category;
    const summary = summaryForShare(text, (opts && opts.maxSummaryLen) || 160);
    const emoji = openingEmoji(text, category);
    const shortUrl = shareUrl.replace(/^https?:\/\//i, '');
    const parts = [];

    if (summary) {
      parts.push(`${emoji} ${summary}`);
    } else {
      parts.push(`${emoji} Novo no Blog Vida 360º.`);
    }

    parts.push('');
    parts.push(`👉 LEIA MAIS: ${shortUrl}`);

    if (opts && opts.includeHashtags === true) {
      const tags = hashtagsForShare(text, category).slice(0, 3);
      if (tags.length) {
        parts.push('');
        parts.push(tags.join(' '));
      }
    }

    return parts.join('\n').trim();
  }

  global.Vida360ShareMessage = {
    DEFAULT_SITE,
    buildShareMessage,
    buildStatusShareMessage,
    stripPlain,
  };
})(typeof window !== 'undefined' ? window : globalThis);
