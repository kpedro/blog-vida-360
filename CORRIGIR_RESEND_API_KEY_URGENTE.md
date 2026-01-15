# 🚨 CORRIGIR RESEND_API_KEY - URGENTE

**Data:** 13 de janeiro de 2025

---

## ❌ **Problema Identificado**

A API está retornando erro 500:
```
Erro: Configuração de email não disponível
```

**Causa:** A variável no Vercel está com o nome errado.

---

## 🔧 **Solução (5 minutos)**

### **Passo 1: Acessar Vercel**
1. Acesse https://vercel.com
2. Entre no projeto `blog-vida-360`
3. Vá em **Settings** → **Environment Variables**

### **Passo 2: Adicionar RESEND_API_KEY (sem VITE_)**

1. Clique em **Add New**
2. Preencha:
   - **Name:** `RESEND_API_KEY` (exatamente assim, sem `VITE_`)
   - **Value:** Cole o mesmo valor que está em `VITE_RESEND_API_KEY` (a chave que começa com `re_`)
   - **Environments:** Marque todos (Production, Preview, Development)
3. Clique em **Save**

### **Passo 3: Redeploy**

**Importante:** Após adicionar a variável, você PRECISA fazer redeploy!

1. Vá na aba **Deployments**
2. Clique nos 3 pontinhos (...) do último deploy
3. Clique em **Redeploy**
4. Aguarde 1-2 minutos

---

## ✅ **Verificar se Funcionou**

Após o redeploy:

1. Acesse o blog no Vercel
2. Abra o Console (F12)
3. Preencha o formulário
4. Você deve ver:
   ```
   ✅ Email enviado com sucesso: re_xxxxx...
   ```

---

## 📋 **Resumo das Variáveis Corretas**

Após a correção, você deve ter no Vercel:

### **Variáveis usadas pela API (obrigatórias):**
- ✅ `RESEND_API_KEY` = sua chave do Resend (começando com `re_`)
- ✅ `RESEND_FROM_EMAIL` = `noreply@pedagoflow.com` (já está correta)

### **Variáveis do frontend (opcionais, podem ser removidas):**
- `VITE_RESEND_API_KEY` - Não é usada pela API, pode ser removida
- `VITE_RESEND_FROM_EMAIL` - Não é usada pela API, pode ser removida

---

## 🎯 **O que causou o erro**

O prefixo `VITE_` é usado por frameworks como Vite para expor variáveis no frontend (navegador).

Mas a API `api/send-email.js` é uma **Serverless Function** (backend), que roda no servidor do Vercel, não no navegador. Por isso ela precisa de variáveis **sem o prefixo `VITE_`**.

---

**Status:** 🔴 Aguardando correção no Vercel
