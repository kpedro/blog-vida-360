# Quiz no Blog Vida 360º

## O que foi implementado

- **Página:** `quiz-suplementacao.html` — Quiz *"Você realmente precisa de suplementação para saúde metabólica?"*
- **Perguntas:** 4 (vegetais diários, cansaço, alimentação regular, exames/insuficiências).
- **Resultado:** 3 faixas (base boa / vale avaliar / sinais indicam), com CTA para WhatsApp com o resultado no texto.
- **Menu:** link "Quiz" adicionado em todas as páginas do blog.
- **Home:** bloco de destaque para o quiz acima da busca.

## Como usar

1. Acesse **Quiz** no menu ou o link na home.
2. Responda as 4 perguntas (Anterior / Próxima).
3. Na última pergunta, clique em **Ver resultado**.
4. Leia o resultado e use o botão para abrir o WhatsApp com a mensagem já preenchida (resultado + pedido de análise).

## Personalizar

- **Perguntas / opções:** edite o HTML em `quiz-suplementacao.html` (inputs `name="q1"` … `q4` e `value` 0, 1 ou 2).
- **Faixas de resultado:** em `assets/js/quiz.js`, altere `getResultBand(score)` (limites e textos).
- **Número WhatsApp:** em `assets/js/quiz.js`, variável `WHATSAPP_NUMBER`.

## Integração com n8n (automação)

O quiz hoje **não envia** dados para nenhum backend. Para automatizar no n8n:

### Opção 1: Webhook no n8n

1. Crie um workflow no n8n com trigger **Webhook**.
2. Copie a URL do webhook (POST).
3. No blog, ao exibir o resultado, chame esse webhook via JavaScript (fetch):

   ```js
   fetch('https://seu-n8n.com/webhook/quiz-suplementacao', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       quiz_id: 'suplementacao',
       score: score,
       band: band.id,
       timestamp: new Date().toISOString()
     })
   }).catch(function() {});
   ```

4. No n8n, use os dados (score, band) para enviar mensagem no WhatsApp, salvar em planilha, etc.

### Opção 2: Supabase + n8n

1. Crie no Supabase uma tabela, por exemplo:

   ```sql
   create table blog360_quiz_respostas (
     id uuid default gen_random_uuid() primary key,
     quiz_id text not null,
     score int not null,
     band text not null,
     created_at timestamptz default now()
   );
   ```

2. No `quiz.js`, ao mostrar o resultado, chame o Supabase:

   ```js
   window.supabaseClient.from('blog360_quiz_respostas').insert({
     quiz_id: 'suplementacao',
     score: score,
     band: band.id
   });
   ```

3. No n8n, use o trigger **Supabase** (novo registro) e encadeie envio por WhatsApp, email, etc.

## Próximos passos possíveis

- **Isca digital:** pedir e-mail antes de mostrar o resultado e enviar o resultado por e-mail (integração com Resend ou n8n).
- **Mais quizzes:** duplicar `quiz-suplementacao.html` e `quiz.js` (ou generalizar o JS para vários quizzes) e criar novas páginas (ex.: rotina, sono).
- **Artigo + quiz:** em um post sobre suplementação, incluir um CTA “Faça o quiz” no meio ou no final, linkando para `quiz-suplementacao.html`.
