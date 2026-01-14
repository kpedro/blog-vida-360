# 🔧 Como Configurar o Supabase no Blog Vida 360º

**Data:** 13 de janeiro de 2025

---

## 📋 **Passo a Passo**

### **1. Obter Credenciais do Supabase**

1. Acesse https://supabase.com
2. Entre no seu projeto
3. Vá em **Settings → API**
4. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave anon)

---

### **2. Configurar no HTML**

Abra o arquivo `index.html` e localize o script de configuração (linha ~254):

```javascript
window.VITE_SUPABASE_URL = 'https://seu-projeto.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'sua-chave-anon-aqui';
```

**Substitua pelos seus valores:**
```javascript
window.VITE_SUPABASE_URL = 'https://xxxxx.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

### **3. Executar Schema SQL**

1. No Supabase, vá em **SQL Editor**
2. Abra o arquivo `supabase/schema.sql`
3. Cole todo o conteúdo
4. Clique em **Run** (ou F5)

✅ As tabelas serão criadas com o prefixo `blog360_`

---

### **4. Verificar Tabelas Criadas**

No Supabase, vá em **Table Editor** e verifique se as seguintes tabelas existem:

- ✅ `blog360_leads`
- ✅ `blog360_posts`
- ✅ `blog360_affiliate_links`
- ✅ `blog360_email_campaigns`
- ✅ `blog360_analytics`
- ✅ `blog360_newsletter_subscriptions`

---

### **5. Testar Captura de Leads**

1. Abra o blog no navegador
2. Preencha o formulário de newsletter
3. Verifique no Supabase (Table Editor → `blog360_leads`) se o lead foi criado

---

## 🔒 **Segurança**

- ✅ Use apenas a chave **anon** (não a service_role)
- ✅ As políticas RLS estão configuradas
- ✅ Prefixo `blog360_` evita conflitos com outros projetos

---

## ⚠️ **Importante**

- **NÃO** commite as credenciais no Git
- Use variáveis de ambiente em produção
- Para GitHub Pages, configure via meta tags ou script inline (como está agora)

---

## 🆘 **Problemas Comuns**

### **Erro: "Supabase credentials não configuradas"**
- Verifique se as credenciais estão corretas no `index.html`
- Verifique se o script do Supabase CDN carregou

### **Erro: "relation does not exist"**
- Execute o schema SQL novamente
- Verifique se as tabelas foram criadas com prefixo `blog360_`

### **Formulário não salva**
- Abra o Console do navegador (F12)
- Verifique se há erros
- Verifique se as políticas RLS permitem INSERT

---

**Pronto!** 🎉 Agora o blog está conectado ao Supabase!
