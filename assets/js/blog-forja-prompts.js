/**
 * Presets e snippets — série Sistema Forja Campeã (Blog Vida 360º admin).
 */
(function (global) {
  var FORJA_UTM = 'estudio_admin';

  var STUDIO_SNIPPETS = [
    {
      title: 'Forja: artigo ponte (série)',
      content:
        'Artigo ponte para o blog Vida 360º — categoria sistema-forja. Tema: [TEMA: ex. equipe parada, Plano 72h, liderança em camadas]. Público: consultor(a) de marketing de rede com rotina corrida. Tom editorial acolhedor; explicar o Sistema Forja Campeã como método (72h, 7 passos, liderança) sem substituir a plataforma. Inclua: introdução, 3 subtítulos em Markdown (##), lista prática, conclusão com CTA para /produtos.html. Sem promessa de renda. 900–1300 palavras.',
    },
    {
      title: 'Forja: post Instagram (série)',
      content:
        'Legenda Instagram sobre [TEMA Forja: duplicação, 72h ou liderança]. Gancho na primeira linha; corpo 3–5 linhas; CTA «link na bio» para o blog (não invente URL). Mencione Sistema Forja Campeã como método, não como promessa de ganhos. 5–10 hashtags (#forjacampea #marketingderede). Máx. 2200 caracteres.',
    },
    {
      title: 'Forja: landing ponte (produtos.html)',
      content:
        'Copy curta para reforçar a página ponte Sistema Forja no blog: headline, 3 bullets (Plano 72h, duplicação, estúdio), parágrafo «o blog indica o sistema», CTA «Conhecer o Sistema Forja». Tom ético, sem hype.',
    },
    {
      title: 'Plano 72h — primeiros dias',
      content:
        'Artigo categoria plano-72h: o que fazer nos primeiros três dias ao entrar numa rede (ativação prática, não palestra). Tom do blog; no final convide a conhecer o Sistema Forja Campeã em /produtos.html. Markdown com ##, listas e parágrafo de conclusão.',
    },
    {
      title: 'Duplicação — equipe parada',
      content:
        'Artigo categoria duplicacao: por que a equipe trava e como um processo replicável (7 passos) ajuda. Sem culpar pessoas; foco em método. CTA suave para Sistema Forja. 1000–1200 palavras em Markdown.',
    },
  ];

  var MARKETING_PRESETS = [
    {
      label: 'Forja — faixa + botão',
      text: 'Frase curta para faixa no topo do blog Vida 360º: convidar a conhecer o Sistema Forja Campeã (método para marketing de rede). Tom acolhedor, máx. ~140 caracteres na faixa. Sugira também texto do botão (até 4 palavras). Sem prometer ganhos.',
    },
    {
      label: 'Forja — WhatsApp convite',
      text: 'Mensagem WhatsApp convidando contato a ver como funciona o Sistema Forja Campeã (Plano 72h e duplicação). Tom profissional e humano; incluir placeholder [LINK forjacampea.com.br/como-funciona]. Sem promessa de renda.',
    },
    {
      label: 'Forja — legenda Instagram',
      text: 'Legenda Instagram sobre Sistema Forja Campeã — gancho sobre equipe sem método, corpo com Plano 72h, CTA link na bio. Até 300 caracteres + 5 hashtags. Sem alegações de saúde nem de ganhos.',
    },
    {
      label: 'Forja — e-mail pós-lead',
      text: 'E-mail curto (assunto + corpo) para lead do blog que pediu informação sobre o sistema Forja. 4 parágrafos humanos, CTA para call ou /como-funciona. Sem números inventados de ganhos.',
    },
    {
      label: 'Forja — copy /como-funciona',
      text: 'Texto para página explicativa do sistema: o que é Forja Campeã, Plano 72h, 7 passos, liderança em camadas. Tom claro, sem hype de renda. Pode ser outline com bullets para revisão humana.',
    },
  ];

  var ASSIST_QUICK = [
    'Como encaixar artigos da série Sistema Forja com posts de bem-estar na mesma semana sem quebrar a voz do blog?',
    'Sugira uma trilha de 4 artigos ponte (sistema-forja → plano-72h → duplicacao → lideranca) com títulos e gancho de cada um.',
    'Tenho um post sobre aromaterapia e quero um CTA honesto para o Sistema Forja no final — como redigir?',
    'O que publicar hoje na categoria duplicacao sem soar como promessa de renda?',
  ];

  function forjaUrl(path, content) {
    if (global.BLOG360_FORJA && typeof global.BLOG360_FORJA.buildUrl === 'function') {
      return global.BLOG360_FORJA.buildUrl(path, 'blog_admin_ia', content || FORJA_UTM);
    }
    var base = 'https://forjacampea.com.br';
    var p = path.charAt(0) === '/' ? path : '/' + path;
    return base + p + '?utm_source=blog_vida360&utm_medium=referral&utm_campaign=blog_admin_ia';
  }

  function mergeStudioSnippets(existing) {
    var list = Array.isArray(existing) ? existing.slice() : [];
    var titles = {};
    list.forEach(function (s) {
      if (s && s.title) titles[s.title] = true;
    });
    STUDIO_SNIPPETS.forEach(function (s) {
      if (!titles[s.title]) list.unshift(s);
    });
    return list;
  }

  global.BLOG360_FORJA_PROMPTS = {
    studioSnippets: STUDIO_SNIPPETS,
    marketingPresets: MARKETING_PRESETS,
    assistQuick: ASSIST_QUICK,
    mergeStudioSnippets: mergeStudioSnippets,
    urls: {
      comoFunciona: function () {
        return forjaUrl('/como-funciona', 'como_funciona');
      },
      paraLideres: function () {
        return forjaUrl('/para-lideres', 'para_lideres');
      },
      estudioHandoff: function () {
        return forjaUrl('/como-funciona', 'estudio_handoff');
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
