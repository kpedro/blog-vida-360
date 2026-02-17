# 🔧 Solução Rápida: Entrar no Painel Admin

## Problema: Email de confirmação não chega

Se o email de confirmação não está chegando, você tem **3 opções**:

---

## ✅ **Opção 1: Desabilitar confirmação de email (MAIS RÁPIDO)**

**Esta é a solução mais simples e rápida:**

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione o projeto do blog (`qrjmvqedoypxmnvfdetg`)
3. Vá em **Authentication** → **Providers** → **Email**
4. **Desative** a opção **"Confirm email"** (toggle OFF)
5. **Salve** as alterações
6. Agora você pode fazer login normalmente em `admin-login.html` com seu email e senha

**Vantagem:** Funciona imediatamente, sem precisar de código adicional.

**Desvantagem:** Qualquer pessoa que se cadastrar não precisará confirmar email (ok para desenvolvimento/teste).

---

## ✅ **Opção 2: Confirmar email manualmente no Supabase**

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** → **Users**
3. Encontre seu usuário pelo email
4. Clique nos **3 pontinhos** ao lado do usuário → **Send password reset email** ou **Confirm user**
5. Ou clique no usuário e marque **"Email confirmed"** manualmente
6. Depois faça login normalmente

---

## ✅ **Opção 3: Usar a página definir-senha-uma-vez.html**

1. Abra `http://localhost:8080/definir-senha-uma-vez.html`
2. Preencha:
   - Seu email
   - Chave **service_role** do Supabase (Project Settings → API → service_role)
   - Nova senha
3. Clique em "Definir senha e confirmar email"

**Se der erro de CORS:** A Opção 1 (desabilitar confirmação) é mais simples.

---

## 🎯 **Recomendação**

Para desenvolvimento/teste: **Use a Opção 1** (desabilitar confirmação de email).

Para produção: Reative a confirmação depois e configure o email corretamente no Supabase.
