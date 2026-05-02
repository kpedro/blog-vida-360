# Orientação — RAG (base de conhecimento) + Supabase + n8n — Chat Especialista Vida 360º

Este documento alinha o **cérebro do chat** (workflow n8n copiado/adaptado do Mini Portal / outro agente) com uma **base vetorial dedicada** no Supabase do Blog Vida 360º, sem misturar com `portal_ia_*` ou tabelas do PedagoFlow.

## 1. O que foi criado no repositório

| Ficheiro | Função |
|----------|--------|
| `supabase/BLOG360_RAG_KNOWLEDGE.sql` | Extensão **pgvector**, tabela **`blog360_rag_chunks`**, índice IVFFLAT, RPC **`blog360_match_rag_chunks`** (threshold manual) e RPCs **`match_blog360_documents`** / **`match_assistant_knowledge`** (compatíveis com o **Supabase Vector Store** do n8n / LangChain). |

### Modelo de dados (resumo)

- **`blog360_rag_chunks`**: cada linha é um **chunk** de texto com **`embedding VECTOR(1536)`** (alinhado a OpenAI **text-embedding-3-small** / **ada-002**).
- Campos úteis:
  - **`content`**: texto que entra no contexto do modelo.
  - **`source_title`** / **`source_uri`**: proveniência (PDF, página do blog, nota interna).
  - **`chunk_index`**: ordem quando um documento é dividido em vários chunks.
  - **`metadata`**: JSON livre (`tags`, `idioma`, `produto`, etc.).
  - **`is_active`**: permite desligar um chunk sem apagar.

### Função SQL `blog360_match_rag_chunks`

Parâmetros:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `query_embedding` | `vector(1536)` | Vetor da **pergunta atual** (mesmo modelo usado na ingestão). |
| `match_threshold` | `float` | Semelhança mínima **0–1** (cosine). Por defeito **0.35** no SQL; suba (ex. 0.45–0.55) se vier muito ruído, baixe se vier pouco contexto. |
| `match_count` | `int` | Máximo de chunks (cap **50** na função). |

Devolve: `id`, `content`, `metadata`, `source_title`, `chunk_index`, `similarity`.

**Segurança:** a função é **`SECURITY DEFINER`** com `search_path = public`. **`EXECUTE`** foi concedido a **`service_role`** — uso típico: **n8n com chave service_role**, não expor a RPC ao browser com anon key sem avaliar risco.

### Nó **Supabase Vector Store** no n8n (modo “Retrieve Documents…”)

O nó segue o [quickstart LangChain + Supabase](https://supabase.com/docs/guides/ai/langchain): a **Query Name** não é opcional — tem de ser uma RPC com os parâmetros `query_embedding`, `match_count` e `filter` (e devolver `id`, `content`, `metadata`, `similarity`). Por isso existem **`match_blog360_documents`** e o alias **`match_assistant_knowledge`** (mesma lógica).

Configuração recomendada no painel do nó:

| Campo | Valor |
|--------|--------|
| **Credential** | Supabase com URL do projeto + **`service_role`** (ou API key com permissão para RPC/tabela, conforme a tua política). |
| **Operation Mode** | Retrieve Documents (As Vector Store for Chain/Tool) — ou o modo que estavas a usar. |
| **Table Name** | **`blog360_rag_chunks`** (substitui `assistant_knowledge`). |
| **Options → Query Name** | **`match_blog360_documents`** **ou** **`match_assistant_knowledge`** (se já tinhas este nome no fluxo copiado). |
| **Rerank Results** | Opcional; só activar se ligares um nó de rerank. |

**Importante:** o nome da **tabela** na base tem de ser **`blog360_rag_chunks`**. O nome da **função** (`Query Name`) é que escolhes entre `match_blog360_documents` e `match_assistant_knowledge` — ambos apontam para os mesmos dados depois de executares o SQL actualizado no Supabase.

Se mudares só o nome da tabela no nó e **não** correres o script SQL no projeto, a função `match_assistant_knowledge` antiga (outro agente) pode continuar a referir outra tabela — por isso convém **recriar** estas funções a partir de `BLOG360_RAG_KNOWLEDGE.sql`.

---

## 2. Passos no Supabase (uma vez)

1. Abrir **SQL Editor** no projeto correto (o mesmo do widget / `VITE_SUPABASE_URL`).
2. Colar e executar o ficheiro **`BLOG360_RAG_KNOWLEDGE.sql`** completo.
3. Confirmar extensão **vector** ativa: **Database → Extensions** (opcional).
4. Após **grande ingestão** de chunks: executar `ANALYZE public.blog360_rag_chunks;` para o índice IVFFLAT compensar.

---

## 3. Fluxo recomendado no n8n (RAG)

Ordem lógica alinhada ao “supercérebro” / agente com ferramentas:

1. **Webhook** — recebe o POST do `@n8n/chat` (ou proxy), com o texto da pergunta.
2. **Embeddings** — nó **OpenAI** (ou compatível):
   - Modelo sugerido: **`text-embedding-3-small`** (1536 dimensões).
   - Entrada: texto da pergunta (ou pergunta + instrução curta “para recuperação de documentos”).
   - Saída: vector numérico (array de 1536 números).
3. **Supabase — RPC `blog360_match_rag_chunks`**:
   - Credencial: **URL do projeto** + **`service_role` key** (guardada só no n8n).
   - Corpo da chamada RPC (JSON), exemplo:

```json
{
  "query_embedding": [0.012, -0.034, "..."],
  "match_threshold": 0.4,
  "match_count": 6
}
```

   - Em nós HTTP: `POST https://<REF>.supabase.co/rest/v1/rpc/blog360_match_rag_chunks` com headers `apikey` + `Authorization: Bearer <service_role>` e `Content-Type: application/json`.

4. **Montar contexto** — nó **Code** ou **Set**:
   - Junta os `content` dos chunks num único bloco (com separadores e, se quiseres, `source_title` entre aspas).
5. **Agente / LLM** — system prompt do Especialista Vida 360º (ver `docs/PROMPT_SISTEMA_AGENTE_CHAT_VIDA360.md`) **+** secção fixa:

```text
Contexto da base de conhecimento (use apenas para fundamentar; se não for relevante, ignore):
---
{{ $json.contexto_rag }}
---
```

6. **Responder ao Webhook** — devolver JSON que o widget espera (ex.: `{ "text": "..." }` conforme já configurado).

### Ferramenta “RAG” no agente (opcional)

Se no fluxo copiado existia uma tool tipo **“Base Athena / RAG1”**:

- **Nome sugerido:** `rag_blog360_conhecimento` (ou mantém o nome da tool no prompt do pai).
- **Descrição:** “Base interna do blog Vida 360º — políticas, textos longos, FAQs indexadas.”
- **Implementação:** mesma sequência Embeddings → RPC → devolver texto ao modelo **dentro** da tool (ou sub-workflow).

---

## 4. Ingestão de conhecimento (popular a tabela)

Opções comuns:

1. **SQL manual** — `INSERT INTO blog360_rag_chunks (source_title, chunk_index, content, embedding, metadata) VALUES (...)`  
   - O embedding pode ser gerado fora (Python, n8n, script) e colado como literal ou via API.
2. **Workflow n8n dedicado** — lê PDF/Markdown → divide em chunks → embeddings → **Insert** linha a linha na tabela (Supabase node com service_role).
3. **Copiar de outro agente** — exportar CSV/JSON do sistema antigo e mapear colunas para `content`, `embedding`, `metadata`; validar **dimensões** do vetor (**1536**).

**Importante:** o modelo de embedding na ingestão deve ser o **mesmo** da query em produção.

---

## 5. Dimensões diferentes de 1536

Se usares modelo com **outro tamanho** (ex. 3072):

1. No SQL Editor: `ALTER TABLE blog360_rag_chunks ALTER COLUMN embedding TYPE vector(3072);` (com tabela vazia ou após backup).
2. Recriar a função `blog360_match_rag_chunks` com `VECTOR(3072)` no parâmetro e na assinatura `GRANT EXECUTE`.
3. Recriar índice IVFFLAT na coluna.

---

## 6. Checklist rápido

- [ ] Script `BLOG360_RAG_KNOWLEDGE.sql` executado sem erros.
- [ ] Pelo menos alguns chunks com `embedding` preenchido e `is_active = true`.
- [ ] n8n usa **service_role** só em fluxos privados; URL e chave não commitadas no Git.
- [ ] Mesmo modelo de embedding na ingestão e na pergunta.
- [ ] `match_threshold` / `match_count` afinados após testes reais.

---

## 7. Referências no repo

- Prompt do chat: `docs/PROMPT_SISTEMA_AGENTE_CHAT_VIDA360.md`
- Inspiração de agente / ferramentas (outro produto): `mini-portal-ia/docs/n8n-cerebro-mini-portal-prompt.md` (conceitos **RAG1 / Base Athena** — aqui a implementação Supabase é **`blog360_rag_chunks`** + **`blog360_match_rag_chunks`**).

---

## 8. Erro `42725: function name "match_assistant_knowledge" is not unique`

Significa que no projeto já existiam **várias funções** com o mesmo nome e **assinaturas diferentes** (overload), vindas de outro fluxo/agente. O PostgreSQL não sabe qual substituir só com `CREATE OR REPLACE`.

**Solução:** usa o script **`BLOG360_RAG_KNOWLEDGE.sql` actualizado** no SQL Editor — no início da secção LangChain há blocos `DO $$ ... $$` que fazem **`DROP FUNCTION ... CASCADE`** de **todas** as overloads de `match_assistant_knowledge` e `match_blog360_documents` antes de voltar a criá-las.

Volta a executar o ficheiro **completo** (ou desde esses blocos `DO` até ao final).
