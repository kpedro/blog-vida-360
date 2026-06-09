/**
 * Presets de estilo visual para imagens IA — Blog Vida 360º + Sistema Forja.
 */
(function (global) {
  var STORAGE_STYLE = 'blog360_studio_image_style_v1';
  var STORAGE_EXTRA = 'blog360_studio_image_custom_style_v1';
  var DEFAULT_STYLE_ID = 'vida_editorial';

  var PRESETS = [
    {
      id: 'vida_editorial',
      label: 'Vida 360º (editorial)',
      hint: 'Foto ou ilustração acolhedora — bem-estar, rotina, luz natural.',
      temperature: 0.58,
      styleBlock:
        'ESTILO VISUAL OBRIGATÓRIO — Vida 360º Editorial:\n' +
        '- Fotografia ou ilustração limpa, acolhedora, luminosa\n' +
        '- Temas: natureza, autocuidado, rotina, calma, hábitos saudáveis\n' +
        '- Cores suaves; composição com espaço para overlay no rodapé',
    },
    {
      id: 'forja_geek',
      label: 'Forja Geek (geração Z)',
      hint: 'Ilustração digital cinematográfica, energia jovem, glow âmbar — como posts Plano 72h.',
      temperature: 0.72,
      styleBlock:
        'ESTILO VISUAL OBRIGATÓRIO — Forja Geek:\n' +
        '- Ilustração digital premium cinematográfica (NÃO foto stock genérica)\n' +
        '- Paleta: fundo escuro, highlights âmbar/dourado (#f59e0b), rim light dramático\n' +
        '- Geek/gamer + empreendedorismo; composição limpa para overlay no rodapé',
    },
    {
      id: 'forja_fantasy',
      label: 'Forja Fantasy (capa)',
      hint: 'RPG digital art — forja medieval, pôr do sol, personagens épicos.',
      temperature: 0.68,
      styleBlock:
        'ESTILO VISUAL OBRIGATÓRIO — Forja Fantasy:\n' +
        '- Digital painting concept art RPG premium\n' +
        '- Forja medieval, luz quente de brasa e pôr do sol',
    },
    {
      id: 'forja_cyber',
      label: 'Cyber / Synthwave',
      hint: 'Neon azul e magenta, grid retro-futurista.',
      temperature: 0.7,
      styleBlock:
        'ESTILO VISUAL OBRIGATÓRIO — Forja Cyber:\n' +
        '- Synthwave moderado: neon azul/magenta, grid geométrico, glow tech',
    },
    {
      id: 'forja_photo',
      label: 'Foto profissional',
      hint: 'Fotografia realista, luz natural, equipe ou home office.',
      temperature: 0.55,
      styleBlock:
        'ESTILO VISUAL OBRIGATÓRIO — Forja Foto:\n' +
        '- Fotografia realista profissional, pessoas diversas, tom motivacional',
    },
    {
      id: 'none',
      label: 'Sem preset (só descrição)',
      hint: 'Usa apenas o texto que você escreveu — mais variação.',
      temperature: 0.9,
      styleBlock: '',
    },
  ];

  function getPreset(id) {
    for (var i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return PRESETS[0];
  }

  function loadStyleId() {
    try {
      var raw = localStorage.getItem(STORAGE_STYLE);
      if (raw && getPreset(raw).id === raw) return raw;
    } catch (e) {}
    return DEFAULT_STYLE_ID;
  }

  function saveStyleId(id) {
    try {
      localStorage.setItem(STORAGE_STYLE, id);
    } catch (e) {}
  }

  function loadExtraBlock() {
    try {
      return (localStorage.getItem(STORAGE_EXTRA) || '').trim();
    } catch (e) {
      return '';
    }
  }

  function saveExtraBlock(block) {
    try {
      localStorage.setItem(STORAGE_EXTRA, String(block || '').trim());
    } catch (e) {}
  }

  global.BLOG360_STUDIO_IMAGE_STYLES = {
    PRESETS: PRESETS,
    DEFAULT_STYLE_ID: DEFAULT_STYLE_ID,
    getPreset: getPreset,
    loadStyleId: loadStyleId,
    saveStyleId: saveStyleId,
    loadExtraBlock: loadExtraBlock,
    saveExtraBlock: saveExtraBlock,
  };
})(typeof window !== 'undefined' ? window : globalThis);
