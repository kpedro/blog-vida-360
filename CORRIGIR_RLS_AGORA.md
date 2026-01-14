# 🔧 Corrigir Políticas RLS - URGENTE

**Data:** 13 de janeiro de 2025

---

## ❌ **Problema**

Erro **42501**: `new row violates row-level security policy for table "blog360_leads"`

A política RLS está bloqueando a inserção de leads mesmo com a política definida.

---

## ✅ **Solução**

Execute o script SQL abaixo no Supabase para corrigir as políticas RLS.

---

## 📋 **Passo a Passo**

### **1. Acesse o Supabase**
1. Vá para https://supabase.com
2. Entre no seu projeto
3. Clique em **SQL Editor** (no menu lateral)

### **2. Execute o Script**

Copie e cole o conteúdo do arquivo `supabase/CORRIGIR_RLS_LEADS.sql` no SQL Editor e clique em **Run** (ou F5).

**OU** copie e cole este script diretamente:

```sql
-- Garantir que RLS está habilitado
ALTER TABLE public.blog360_leads ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Blog360: Qualquer um pode criar lead" ON public.blog360_leads;
DROP POLICY IF EXISTS "Blog360: Leads podem ver seus próprios dados" ON public.blog360_leads;
DROP POLICY IF EXISTS "Blog360: Public read leads" ON public.blog360_leads;

-- Criar política de INSERT (permite qualquer um criar lead)
CREATE POLICY "Blog360: Qualquer um pode criar lead"
  ON public.blog360_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Criar política de SELECT (permite qualquer um ler leads)
CREATE POLICY "Blog360: Qualquer um pode ler leads"
  ON public.blog360_leads
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

### **3. Verificar se Funcionou**

Após executar, você deve ver uma mensagem de sucesso. Para confirmar, execute:

```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'blog360_leads';
```

Você deve ver 2 políticas:
- `Blog360: Qualquer um pode criar lead` (INSERT)
- `Blog360: Qualquer um pode ler leads` (SELECT)

### **4. Testar Manualmente (Opcional)**

No SQL Editor, teste se a inserção funciona:

```sql
INSERT INTO public.blog360_leads (email, origem, ativo)
VALUES ('teste-rls@exemplo.com', 'teste', true)
RETURNING *;
```

Se funcionar, você verá o registro criado.

### **5. Testar no Blog**

1. Recarregue a página do blog (Ctrl+Shift+R)
2. Preencha o formulário
3. Verifique no Console (F12) se não há mais erros
4. Verifique no Supabase (Table Editor → `blog360_leads`) se o lead foi criado

---

## 🆘 **Se Ainda Der Erro**

### **Erro: "policy already exists"**
- Ignore, significa que a política já existe
- Continue com o próximo passo

### **Erro: "permission denied"**
- Verifique se você está logado como admin no Supabase
- Tente executar o script novamente

### **Erro: "relation does not exist"**
- Execute o schema completo primeiro (`supabase/schema.sql`)
- Depois execute este script de correção

---

## ✅ **Status**

🟡 **Aguardando execução do script no Supabase**

Depois de executar, teste o formulário novamente! 🚀
