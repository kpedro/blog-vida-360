/**
 * Categorias editoriais do Blog Vida 360º (inclui ponte Sistema Forja Campeã).
 */
(function (global) {
  var FORJA_GROUP = ['sistema-forja', 'forja-campea', 'plano-72h', 'duplicacao', 'lideranca', 'forja'];

  var LABELS = {
    'sistema-forja': 'Sistema Forja',
    'forja-campea': 'Forja Campeã',
    'plano-72h': 'Plano 72h',
    duplicacao: 'Duplicação',
    lideranca: 'Liderança',
    saude: 'Saúde',
    'bem-estar': 'Bem-estar',
    sono: 'Sono',
    'ansiedade-leve': 'Ansiedade leve',
    aromaterapia: 'Aromaterapia',
    'oleos-essenciais': 'Óleos essenciais',
    'foco-produtividade': 'Foco e produtividade',
    produtividade: 'Produtividade',
    mentalidade: 'Mentalidade',
    equilibrio: 'Equilíbrio',
  };

  var ALIASES = {
    'sistema-forja': FORJA_GROUP,
    'forja-campea': FORJA_GROUP,
    'foco-produtividade': ['foco-produtividade', 'produtividade', 'foco'],
    'oleos-essenciais': ['oleos-essenciais', 'oleo-essencial', 'aromaterapia'],
    'ansiedade-leve': ['ansiedade-leve', 'ansiedade', 'saude-mental'],
    'plano-72h': ['plano-72h', 'plano 72h', 'sistema-forja', 'forja-campea'],
    duplicacao: ['duplicacao', 'duplicação', '7-passos', 'sistema-forja'],
    lideranca: ['lideranca', 'liderança', 'sistema-forja'],
  };

  global.BLOG360_CATEGORIES = {
    forjaGroup: FORJA_GROUP,
    labels: LABELS,
    aliases: ALIASES,
    label: function (slug) {
      return LABELS[slug] || String(slug || '').replace(/-/g, ' ');
    },
    aliasesFor: function (slug) {
      return ALIASES[slug] || [slug];
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
