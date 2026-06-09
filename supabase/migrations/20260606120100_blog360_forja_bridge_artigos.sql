-- ============================================
-- Artigos ponte: Sistema Forja Campeã (Blog Vida 360º)
-- Execute no SQL Editor do Supabase (projeto blog360).
-- Reexecutar: ON CONFLICT (slug) atualiza título/resumo/conteúdo.
-- ============================================

INSERT INTO public.blog360_posts (
  titulo, slug, conteudo_markdown, resumo, categoria, tags, author, status, publicado, published_at
) VALUES
(
  'O que é o Sistema Forja Campeã (e por que o blog indica)',
  'o-que-e-sistema-forja-campea',
  '# O que é o Sistema Forja Campeã

O **Vida 360º** continua sendo um blog de conteúdo sobre rotina, equilíbrio e bem-estar. Quando falamos de **construir marketing de rede com método**, recomendamos o **Sistema Forja Campeã** — uma plataforma de duplicação, treinamento e liderança com ferramentas e IA.

## Não é substituto do seu produto

A Forja **não vende produtos no blog**. Ela organiza **como você trabalha a rede** — na operação do Kadson, com foco em **Amway** e método replicável para a equipe.

## Os três pilares que você vai ouvir sempre

1. **Plano 72h** — ativação prática nos primeiros dias (processo, não palestra motivacional).
2. **7 passos de duplicação** — sequência replicável para a equipe.
3. **Liderança em camadas** — quem lidera quem, com trilhas e acompanhamento.

## Tom honesto

Sem promessa de renda fácil. O foco é **organização, repetição e ferramentas** para quem já decidiu empreender em rede.

---

**Próximo passo:** [Conheça o Sistema Forja no blog](/produtos.html) ou acesse [como funciona na Forja](https://forjacampea.com.br/como-funciona?utm_source=blog_vida360&utm_medium=referral&utm_campaign=artigo_ponte).',
  'Entenda a diferença entre conteúdo de bem-estar no blog e o Sistema Forja Campeã para quem constrói rede com método.',
  'sistema-forja',
  ARRAY['forja-campea', 'sistema', 'marketing-de-rede'],
  'Kadson Pedro',
  'published',
  true,
  NOW() - INTERVAL '5 days'
),
(
  'Plano 72h: o que fazer nos primeiros três dias na rede',
  'plano-72h-primeiros-tres-dias',
  '# Plano 72h: os primeiros três dias contam

Muita gente entra na rede com entusiasmo e trava na **segunda semana** porque não tinha um roteiro claro. O **Plano 72h** do Sistema Forja Campeã existe para isso: transformar o início em **passos executáveis**.

## Dia 1 — Clareza

- Defina **com quem** você vai falar nesta semana (lista curta, realista).
- Escreva **uma frase** sobre por que você acredita no que oferece (consumo ou oportunidade).
- Agende **um bloco de 30 minutos** só para contatos — sem multitarefa.

## Dia 2 — Conversa

- Faça **3 conversas** (não monólogos): pergunte, escute, anote objeções reais.
- Compartilhe **um conteúdo seu** (post do blog, story, áudio curto) — autoridade antes de convite.

## Dia 3 — Ritmo

- Revise o que funcionou e o que não funcionou.
- Marque **próxima ação** para cada pessoa com data.
- Entre no fluxo do sistema (trilha, equipe, ferramentas).

## O que o 72h não é

Não é correr atrás de todo mundo. É **ritmo sustentável** com registro do que foi feito.

---

Quer ver o sistema completo? [Sistema Forja Campeã](/produtos.html).',
  'Roteiro prático para os três primeiros dias em marketing de rede — alinhado ao Plano 72h da Forja.',
  'plano-72h',
  ARRAY['plano-72h', 'ativacao', 'forja-campea'],
  'Kadson Pedro',
  'published',
  true,
  NOW() - INTERVAL '4 days'
),
(
  'Equipe parada? Duplicação começa com processo, não com discurso',
  'equipe-parada-duplicacao-processo',
  '# Equipe parada? Duplicação começa com processo

Se sua equipe **não replica**, o problema raramente é «falta de motivação». Na maioria das vezes é **falta de sequência clara**: o que fazer no dia 1, no dia 7, no dia 30.

## Sinais de equipe travada

- Todo mundo «estuda» mas ninguém convida.
- Só o upline posta conteúdo.
- Reuniões viram palestra, sem checklist de saída.

## O que muda com método

O Sistema Forja Campeã trabalha **7 passos de duplicação**: cada passo tem entrega, linguagem e exemplo. A pessoa nova não precisa inventar — precisa **seguir e adaptar ao tom dela**.

## Papel do líder

Seu trabalho não é ser o mais carismático da sala. É **garantir que o próximo sabe o que fazer amanhã de manhã**.

## Conteúdo + sistema

O blog Vida 360º alimenta **credibilidade** (bem-estar, rotina, mentalidade). A Forja alimenta **operação** (quem faz o quê e quando).

---

[Conheça o Sistema Forja](/produtos.html) · [Como funciona](https://forjacampea.com.br/como-funciona?utm_source=blog_vida360&utm_medium=referral&utm_campaign=artigo_duplicacao)',
  'Por que equipes de rede travam e como duplicação com processo destrava o time.',
  'duplicacao',
  ARRAY['duplicacao', 'equipe', 'forja-campea'],
  'Kadson Pedro',
  'published',
  true,
  NOW() - INTERVAL '3 days'
),
(
  'Liderança em camadas: você não precisa carregar tudo sozinho',
  'lideranca-em-camadas-na-pratica',
  '# Liderança em camadas na prática

Liderar rede não é responder **todas** as mensagens sozinho. É desenhar **camadas**: quem acolhe o novo, quem treina o passo 3, quem cuida do ritmo semanal.

## Camada 1 — Acolhimento

Primeiras 72h: boas-vindas, expectativa realista, um único próximo passo.

## Camada 2 — Hábito

Semana 2–4: contato semanal, conteúdo compartilhado, registro simples (planilha ou app).

## Camada 3 — Multiplicação

Quem já replica ajuda quem está na camada 1 — com roteiro, não com improviso.

## Ferramentas

Quem lidera de verdade precisa de **CRM, fila de conteúdo e estúdio de campanhas**. No Sistema Forja, isso vive na plataforma (upline Pro).

## Sem hype

Liderança boa é **previsível e repetível**. Seu time confia quando sabe o que esperar.

---

[Sistema Forja Campeã](/produtos.html)',
  'Como distribuir responsabilidades na equipe de rede sem sobrecarregar o upline.',
  'lideranca',
  ARRAY['lideranca', 'forja-campea', 'equipe'],
  'Kadson Pedro',
  'published',
  true,
  NOW() - INTERVAL '2 days'
),
(
  'Disciplina e rotina: mentalidade de campeã sem promessa vazia',
  'disciplina-rotina-mentalidade-campea',
  '# Disciplina e rotina (sem promessa vazia)

«Mentalidade de campeã» não é acordar às 4h e postar frase motivacional. É **escolher poucas ações e cumprir** — especialmente quando ninguém está olhando.

## Três âncoras que funcionam em rede

1. **Bloco fixo de prospecção** (mesmo horário, 3x por semana).
2. **Conteúdo que você reutiliza** (artigo do blog, legenda, áudio).
3. **Revisão de 15 minutos** no domingo (o que repetir na semana seguinte).

## Bem-estar e negócio

Cuidar do sono e do estresse **não é luxo** — é infraestrutura. Por isso o Vida 360º fala de rotina **e** a Forja fala de processo: um alimenta o outro.

## Convite suave

Se você sente que sua rede precisa de **método**, não de mais um discurso, o caminho indicado pelo blog é o [Sistema Forja Campeã](/produtos.html).

---

*Sem promessa de ganhos. Conteúdo educativo sobre hábitos e organização.*',
  'Disciplina aplicada a quem constrói rede — conecta bem-estar do blog com método Forja.',
  'sistema-forja',
  ARRAY['mentalidade', 'rotina', 'forja-campea'],
  'Kadson Pedro',
  'published',
  true,
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  conteudo_markdown = EXCLUDED.conteudo_markdown,
  resumo = EXCLUDED.resumo,
  categoria = EXCLUDED.categoria,
  tags = EXCLUDED.tags,
  author = EXCLUDED.author,
  status = EXCLUDED.status,
  publicado = EXCLUDED.publicado,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();
