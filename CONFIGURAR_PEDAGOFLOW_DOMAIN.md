# 📧 Configurar Domínio pedagoflow.com no Resend

**Data:** 13 de janeiro de 2025

---

## 🎯 **Objetivo**

Configurar o domínio `pedagoflow.com` (já verificado no Resend) para enviar emails de boas-vindas do Blog Vida 360º.

---

## 📍 **Onde o Domínio é Usado**

O domínio `pedagoflow.com` entra na configuração através da variável de ambiente `RESEND_FROM_EMAIL` no Vercel.

### **Fluxo:**

1. **Usuário se inscreve no blog** → Formulário preenchido
2. **Lead salvo no Supabase** → `blog360_leads`
3. **JavaScript chama API** → `/api/send-email`
4. **API lê variável** → `process.env.RESEND_FROM_EMAIL`
5. **Resend envia email** → De `pedagoflow.com` para o usuário

---

## ⚙️ **Configuração no Vercel**

### **Passo 1: Acessar Vercel**

1. Acesse https://vercel.com
2. Entre no projeto `blog-vida-360`
3. Vá em **Settings** → **Environment Variables**

### **Passo 2: Configurar RESEND_FROM_EMAIL**

**Variável:** `RESEND_FROM_EMAIL`

**Valor:** Use um email do domínio `pedagoflow.com`, por exemplo:
- `noreply@pedagoflow.com`
- `blog@pedagoflow.com`
- `newsletter@pedagoflow.com`
- `vida360@pedagoflow.com`

**Environments:** Production, Preview, Development

---

## 🔍 **Verificar no Código**

O domínio é usado na linha **30** do arquivo `api/send-email.js`:

```javascript
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@seudominio.com';
```

E na linha **43** é enviado para o Resend:

```javascript
body: JSON.stringify({
  from: FROM_EMAIL,  // ← Aqui usa o domínio pedagoflow.com
  to: [to],
  subject: '🎉 Bem-vindo ao Blog Vida 360º!',
  html: emailHtml,
})
```

---

## ✅ **Checklist**

- [ ] Variável `RESEND_API_KEY` configurada no Vercel
- [ ] Variável `RESEND_FROM_EMAIL` configurada no Vercel com `@pedagoflow.com`
- [ ] Domínio `pedagoflow.com` verificado no Resend (já está ✅)
- [ ] Redeploy feito no Vercel após configurar variáveis
- [ ] Teste realizado com sucesso

---

## 🧪 **Testar**

Após configurar:

1. Preencha o formulário no blog
2. Verifique o Console (F12) - deve aparecer sucesso
3. Verifique seu email (incluindo spam)
4. O email deve vir de `noreply@pedagoflow.com` (ou o email que você configurou)

---

## 📝 **Exemplo de Configuração**

No Vercel, você deve ter:

```
RESEND_API_KEY = re_abc123...
RESEND_FROM_EMAIL = noreply@pedagoflow.com
```

---

**Status:** ⚠️ Aguardando configuração da variável `RESEND_FROM_EMAIL` no Vercel
