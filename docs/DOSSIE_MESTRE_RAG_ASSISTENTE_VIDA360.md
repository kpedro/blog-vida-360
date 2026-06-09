# Dossiê Mestre — Base RAG do Assistente Vida 360º

Documento-fonte para **indexação no RAG** (n8n + Supabase `blog360_rag_chunks` ou Google Drive). Substitui o antigo *Dossiê Mestre doTERRA* como base principal do assistente do blog **blogvida360.com.br**.

**Versão:** 2026-06 · alinhado a `docs/PROMPT_SISTEMA_AGENTE_CHAT_VIDA360.md` e ao widget `assets/js/chat-widget.js`.

---

## Objetivo deste documento

Concentrar informações **institucionais, editoriais, de encaminhamento e operacionais** para o assistente virtual responder com dados consistentes. O RAG deve recuperar estes blocos e o **system prompt** define o comportamento final (prioridades, tom, o que não fazer).

**Dois eixos — não misturar na mesma resposta comercial:**

| Eixo | O quê | Quando usar |
|------|--------|-------------|
| **Editorial** | Blog Vida 360º — bem-estar, rotina, sono, foco, mentalidade, artigos educativos | Perguntas de conteúdo, hábitos, artigos |
| **Negócio com método** | **Sistema Forja Campeã** — duplicação, Plano 72h, liderança, ferramentas com IA | Rede, Amway, renda extra, equipe parada, «como funciona o sistema» |

---

## Posicionamento do Vida 360º (editorial)

O **Vida 360º** é um blog brasileiro criado por **Kadson Pedro**. Traduz temas de saúde integral, bem-estar, produtividade, mentalidade e rotina em linguagem simples, aplicável e responsável.

- Conteúdo **educativo** — não substitui médico, nutricionista, psicólogo ou outros profissionais qualificados.
- Tom acolhedor, direto, sem promessas milagrosas nem alegações médicas absolutas.
- Parte do acervo trata de **aromaterapia e óleos essenciais** de forma genérica/educativa; o blog **não** é exclusivamente sobre aromaterapia.
- Parcerias editoriais, sugestões de pauta e assuntos gerais do blog → página **Contato**.

### Como o assistente deve descrever o blog

Quando perguntarem «o que é o Vida 360º»:

- Blog de conteúdo sobre **bem-estar, rotina e equilíbrio** no dia a dia.
- Também publica **série editorial** sobre **marketing de rede com método**, que aponta para o **Sistema Forja Campeã**.
- Oferece artigos, guia gratuito (isca digital) e canais de conversa (assistente, WhatsApp, contato).

### Categorias editoriais úteis no RAG

- **Bem-estar geral:** sono, ansiedade leve, saúde mental, rotina, produtividade equilibrada.
- **Série Forja no blog:** `sistema-forja`, `plano-72h`, `duplicacao`, `lideranca`.
- **Legado educativo:** alguns artigos antigos mencionam aromaterapia/óleos — tratar só como **conteúdo informativo**, sem cadastro de marca.

---

## Posicionamento do Sistema Forja Campeã (negócio)

O **Sistema Forja Campeã** é a **plataforma de método** que o blog **recomenda** para quem quer construir **marketing de rede com organização** — não é substituto do blog nem loja de produtos no domínio blogvida360.com.br.

### O que a Forja organiza

1. **Plano 72h** — ativação prática nos primeiros três dias (passos executáveis, não só motivação).
2. **7 passos de duplicação** — sequência replicável para a equipe, com trilhas e acompanhamento.
3. **Liderança em camadas** — quem lidera quem, com papéis claros.
4. **Estúdio / ferramentas com IA** — materiais, campanhas e apoio a quem lidera rede (upline Pro).

### Amway na operação do Kadson

- Na **operação do Kadson Pedro**, o ecossistema Forja trabalha com **Amway** como empresa de produtos/rede.
- A Forja **não vende produtos no blog**; organiza **como a rede replica, treina e lidera**.
- **Não** apresentar outra oportunidade de rede (ex.: doTERRA) como caminho comercial **atual** indicado pelo Vida 360º.

### Tom honesto sobre renda

- **Sem** promessa de renda fixa, lucro garantido ou enriquecimento rápido.
- Resultados dependem de **atividade real**, consistência, equipe, liderança e regras da empresa/produto.
- Foco do discurso: **método, organização, duplicação e ferramentas**.

---

## Regra crítica — doTERRA (legado)

O antigo dossiê RAG era centrado em doTERRA. **Isso não é mais a orientação comercial do assistente.**

| Situação | O que fazer |
|----------|-------------|
| Usuário pergunta **só** sobre óleos/aromaterapia de forma **educativa** | Responder com linguagem segura (bem-estar, rotina, autocuidado). **Não** dar links `doterra.me`. |
| Usuário quer **cadastro, consultor, oportunidade de negócio, renda extra, Amway, rede** | Encaminhar para **Sistema Forja Campeã** (links abaixo). Esclarecer que a oportunidade **atual** do blog é Forja/Amway. |
| Usuário mistura doTERRA com negócio | Separar os eixos: conteúdo educativo vs. **Forja** para rede. |

**Nunca** incluir no RAG ativo blocos com links oficiais de cadastro doTERRA (`doterra.me/...`) como encaminhamento principal.

---

## Links operacionais oficiais

Usar **exatamente** estes URLs quando encaminhar (UTM do chat já incluídos onde aplicável).

### WhatsApp — Kadson Pedro (conversa humana)

Texto pré-preenchido (igual ao widget):

`Olá, Kadson! Vim pelo blog Vida 360º pelo assistente de IA e gostaria de continuar a conversa aqui no WhatsApp.`

**URL completo (não alterar encoding):**

```
https://wa.me/5592994314016?text=Ol%C3%A1%2C%20Kadson!%20Vim%20pelo%20blog%20Vida%20360%C2%BA%20pelo%20assistente%20de%20IA%20e%20gostaria%20de%20continuar%20a%20conversa%20aqui%20no%20WhatsApp.
```

WhatsApp genérico pelo blog (sem texto do assistente):

```
https://wa.me/5592994314016?text=Ol%C3%A1%2C%20Kadson!%20Vim%20pelo%20blog%20Vida%20360%C2%BA%20e%20gostaria%20de%20conversar.
```

### Sistema Forja — página no blog (interesse + série editorial)

```
https://www.blogvida360.com.br/produtos.html
```

Formulário na mesma página: origem `form_forja_sistema` — interesse em vagas / saber mais.

### Sistema Forja — plataforma (como funciona)

```
https://forjacampea.com.br/como-funciona?utm_source=blog_vida360&utm_medium=referral&utm_campaign=chat_assistente
```

### Sistema Forja — para quem já lidera rede

```
https://forjacampea.com.br/para-lideres?utm_source=blog_vida360&utm_medium=referral&utm_campaign=chat_assistente
```

### Artigos ponte (ler antes de decidir)

| Tema | URL |
|------|-----|
| Hub Sistema Forja | `https://www.blogvida360.com.br/artigos.html?categoria=sistema-forja` |
| Plano 72h | `https://www.blogvida360.com.br/artigos.html?categoria=plano-72h` |
| Duplicação | `https://www.blogvida360.com.br/artigos.html?categoria=duplicacao` |
| Liderança | `https://www.blogvida360.com.br/artigos.html?categoria=lideranca` |

Artigo âncora (slug): `o-que-e-sistema-forja-campea`

### Contato editorial do blog (não é canal Forja)

```
https://www.blogvida360.com.br/contato.html
```

### Oportunidades (visão geral blog + Forja)

```
https://www.blogvida360.com.br/oportunidades.html
```

---

## Regras de resposta (produtos, saúde e negócio)

### Saúde e bem-estar

- Não diagnosticar doenças nem prometer cura.
- Não substituir orientação médica, farmacêutica ou nutricional.
- Falar em bem-estar, rotina, hábitos, autocuidado e experiência educativa.
- Gestantes, crianças, pele sensível ou condições de saúde → orientar profissional qualificado antes de qualquer uso.
- Emergência médica → serviços de emergência ou profissionais de saúde.

### Negócio e Forja

- Não garantir renda, bônus fixos ou resultados automáticos.
- Explicar Forja como **método + ferramentas + trilhas**, com Amway na operação do Kadson.
- Um **caminho principal** por resposta (link B produtos.html **ou** forjacampea.com.br **ou** WhatsApp — conforme intenção).

---

## Estrutura de intenções — o que recuperar e responder

### Intenção: conhecer o blog Vida 360º

Responder: propósito editorial, temas (sono, rotina, bem-estar), guia gratuito, artigos.  
Link opcional: home ou artigos.

### Intenção: bem-estar, sono, rotina, artigos

Resposta educativa curta; sugerir buscar artigos no blog.  
Sem empurrar cadastro comercial.

### Intenção: o que é o Sistema Forja / como funciona

Explicar pilares (72h, duplicação, liderança, IA). Blog recomenda; operação em forjacampea.com.br.  
Links: `produtos.html` + `forjacampea.com.br/como-funciona`.

### Intenção: Amway, marketing de rede, duplicação, equipe parada, Plano 72h, liderança, renda extra «com método»

Tratar como **Sistema Forja Campeã** (Amway na operação Kadson).  
Links: série editorial + `produtos.html` ou plataforma Forja.  
Sem promessa de renda.

### Intenção: quero entrar / cadastro / vagas Forja

Indicar página no blog com formulário de interesse:

```
https://www.blogvida360.com.br/produtos.html
```

Complementar com link «como funciona» na plataforma se pedirem detalhe operacional.

### Intenção: falar com humano / Kadson / WhatsApp

Obrigatório link WhatsApp com mensagem pronta (URL completo acima).

### Intenção: parceria, pauta, assunto editorial do blog

```
https://www.blogvida360.com.br/contato.html
```

### Intenção: doTERRA (marca, óleos) — só curiosidade educativa

Resposta informativa genérica se houver contexto nos artigos.  
**Não** links doterra.me. Se misturar com negócio → redirecionar **Forja**.

---

## Blocos prontos para chunking (copiar para ingestão)

Cada bloco abaixo pode virar **1 chunk** no Supabase (`source_title` sugerido entre parênteses).

### Bloco — Institucional Vida 360º (`vida360_institucional`)

O Vida 360º é um blog brasileiro de bem-estar, rotina, sono, foco e mentalidade, com conteúdo educativo em português claro. Também publica artigos ponte sobre marketing de rede com método, recomendando o Sistema Forja Campeã. Criador: Kadson Pedro.

### Bloco — Institucional Forja (`forja_institucional`)

O Sistema Forja Campeã é a plataforma de duplicação, treinamento, liderança e ferramentas com IA que o blog Vida 360º recomenda para quem constrói marketing de rede com método. Pilares: Plano 72h, 7 passos de duplicação, liderança em camadas. Na operação do Kadson, foco em Amway. Sem promessa de renda fácil.

### Bloco — Plano 72h (`forja_plano_72h`)

Plano 72h (Forja): roteiro prático para os três primeiros dias na rede — clareza de contatos (dia 1), conversas reais (dia 2), ritmo e próximas ações (dia 3). Objetivo: passos executáveis, não palestra motivacional vazia.

### Bloco — Duplicação (`forja_duplicacao`)

Duplicação (Forja): equipe parada costuma faltar sequência clara, não motivação. Os 7 passos de duplicação dão entrega, linguagem e exemplo replicável. Líder garante que o novo sabe o que fazer amanhã.

### Bloco — Liderança (`forja_lideranca`)

Liderança em camadas (Forja): estrutura de quem acompanha quem, trilhas e papéis — evita que um único upline carregue tudo sozinho.

### Bloco — Link interesse Forja no blog (`link_produtos_forja`)

Para saber mais ou deixar e-mail sobre o Sistema Forja Campeã, use a página oficial no blog: https://www.blogvida360.com.br/produtos.html

### Bloco — Link plataforma Forja (`link_forja_como_funciona`)

Para ver como funciona o sistema na plataforma: https://forjacampea.com.br/como-funciona?utm_source=blog_vida360&utm_medium=referral&utm_campaign=chat_assistente

### Bloco — Link líderes Forja (`link_forja_lideres`)

Para quem já lidera rede e quer ferramentas/trilhas: https://forjacampea.com.br/para-lideres?utm_source=blog_vida360&utm_medium=referral&utm_campaign=chat_assistente

### Bloco — WhatsApp assistente (`link_whatsapp_assistente`)

WhatsApp Kadson Pedro (mensagem pronta pelo assistente): https://wa.me/5592994314016?text=Ol%C3%A1%2C%20Kadson!%20Vim%20pelo%20blog%20Vida%20360%C2%BA%20pelo%20assistente%20de%20IA%20e%20gostaria%20de%20continuar%20a%20conversa%20aqui%20no%20WhatsApp.

### Bloco — Contato editorial (`link_contato_blog`)

Parcerias e assuntos editoriais do blog (não cadastro Forja): https://www.blogvida360.com.br/contato.html

### Bloco — Não promover doTERRA comercial (`regra_nao_doterra`)

O assistente do Vida 360º não deve oferecer cadastro doTERRA nem links doterra.me. Oportunidade de rede indicada pelo blog: Sistema Forja Campeã (Amway na operação Kadson). doTERRA só em contexto educativo de artigos antigos, se perguntarem especificamente.

### Bloco — Saúde conformidade (`regra_saude`)

Conteúdo educativo; não substitui profissionais de saúde. Sem cura garantida. Emergência → serviços de emergência.

---

## Metadados sugeridos por chunk (Supabase)

Ao inserir em `blog360_rag_chunks.metadata`:

```json
{
  "dominio": "blog360",
  "eixo": "editorial | forja | links | regras",
  "tags": ["forja", "plano-72h", "whatsapp"],
  "idioma": "pt-BR",
  "versao": "2026-06",
  "ativo_comercial": true
}
```

Chunks do antigo dossiê doTERRA: definir `"ativo_comercial": false` ou `is_active = false` na tabela.

---

## Manutenção do documento

Revisar quando houver mudança em:

- URLs Forja, UTM ou WhatsApp (`chat-widget.js`, `PROMPT_SISTEMA_AGENTE_CHAT_VIDA360.md`).
- Copy de `produtos.html`, `contato.html`, artigos ponte ou faixa global (`blog360_site_settings`).
- Posicionamento Amway/Forja ou novas categorias editoriais.

**Fluxo recomendado:**

1. Atualizar este Markdown no repositório.
2. Reindexar no n8n (workflow de ingestão) ou Google Drive ligado ao RAG.
3. Desativar chunks obsoletos (`is_active = false`) — ver `supabase/BLOG360_RAG_DESATIVAR_DOTERRA.sql`.
4. Testar perguntas: «o que é Forja», «Amway», «doTERRA cadastro», «sono», «WhatsApp».

---

## Referências no repositório

| Ficheiro | Uso |
|----------|-----|
| `docs/PROMPT_SISTEMA_AGENTE_CHAT_VIDA360.md` | System prompt do LLM no n8n |
| `docs/N8N_RAG_SUPABASE_ORIENTACAO.md` | Tabela `blog360_rag_chunks`, RPC, nó Vector Store |
| `supabase/BLOG360_RAG_KNOWLEDGE.sql` | Schema pgvector + funções match |
| `assets/js/chat-widget.js` | Botões e defaults de links do widget |
