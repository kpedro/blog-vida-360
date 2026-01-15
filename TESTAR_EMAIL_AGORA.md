# 🧪 Testar Envio de Email - Blog Vida 360º

**Data:** 13 de janeiro de 2025

---

## ✅ **Configuração Completa**

- ✅ Variável `RESEND_API_KEY` configurada no Vercel
- ✅ Variável `RESEND_FROM_EMAIL` configurada no Vercel com `@pedagoflow.com`
- ✅ Domínio `pedagoflow.com` verificado no Resend
- ✅ Blog deployado no Vercel
- ✅ API endpoint funcionando

---

## 🧪 **Como Testar**

### **Passo 1: Acessar o Blog**

1. Acesse a URL do seu blog no Vercel (ex: `https://blog-vida-360-xxxxx.vercel.app`)
2. Abra o Console do navegador (F12 → Console)

### **Passo 2: Preencher Formulário**

1. Localize o formulário de newsletter na página
2. Preencha com um email válido (use um email seu para testar)
3. Preencha o nome (opcional)
4. Clique em **"Cadastrar"** ou **"Quero Receber Grátis"**

### **Passo 3: Verificar Console**

No Console (F12), você deve ver logs como:

```
📧 [sendWelcomeEmail] Iniciando... {email: "...", nome: "..."}
📧 Enviando email de boas-vindas para: seu-email@exemplo.com
   - API URL: https://seu-projeto.vercel.app/api/send-email
   - Status da resposta: 200
✅ Email enviado com sucesso: re_xxxxx...
```

### **Passo 4: Verificar Email**

1. Verifique sua caixa de entrada
2. Verifique a pasta de **Spam/Lixo Eletrônico**
3. O email deve vir de `noreply@pedagoflow.com` (ou o email que você configurou)
4. Assunto: **"🎉 Bem-vindo ao Blog Vida 360º!"**

### **Passo 5: Verificar Supabase**

1. Acesse o Supabase
2. Vá em **Table Editor** → `blog360_leads`
3. Verifique se o lead foi criado com sucesso

---

## 🔍 **Verificar Logs do Vercel**

Se o email não chegar, verifique os logs:

1. Acesse https://vercel.com
2. Entre no projeto `blog-vida-360`
3. Vá em **Deployments** → Clique no último deploy
4. Vá em **Functions** → `api/send-email`
5. Veja os logs em tempo real

**Logs esperados:**
```
✅ Email enviado com sucesso: re_xxxxx...
```

**Se houver erro:**
```
❌ Erro ao enviar email: {...}
```

---

## 🆘 **Problemas Comuns**

### **Email não chegou**

**Possíveis causas:**
1. **Verifique o Spam** - O email pode estar na pasta de spam
2. **Aguarde alguns minutos** - Pode levar até 5 minutos
3. **Verifique os logs do Vercel** - Veja se há erros na API
4. **Verifique o domínio no Resend** - Confirme que `pedagoflow.com` está verificado

### **Erro 500 na API**

**Solução:**
- Verifique se `RESEND_API_KEY` está configurada corretamente no Vercel
- Verifique se `RESEND_FROM_EMAIL` está com o formato correto (ex: `noreply@pedagoflow.com`)
- Faça um redeploy após configurar as variáveis

### **Erro 400 (Email inválido)**

**Solução:**
- Verifique se o email está no formato correto (ex: `usuario@dominio.com`)
- Verifique se não há espaços no email

### **Erro de CORS**

**Solução:**
- Isso não deve acontecer, mas se acontecer, verifique se o blog está acessando a URL correta do Vercel

---

## ✅ **Checklist de Teste**

- [ ] Formulário preenchido com sucesso
- [ ] Console mostra sucesso (status 200)
- [ ] Lead salvo no Supabase
- [ ] Email recebido na caixa de entrada
- [ ] Email veio de `@pedagoflow.com`
- [ ] Template de email está correto
- [ ] Links no email funcionam

---

## 🎉 **Sucesso!**

Se tudo funcionou:
- ✅ Sistema de captura de leads está funcionando
- ✅ Integração com Resend está funcionando
- ✅ Emails de boas-vindas estão sendo enviados
- ✅ Domínio `pedagoflow.com` está sendo usado corretamente

**Próximos passos:**
- Criar mais conteúdo para o blog
- Configurar campanhas de email marketing
- Implementar analytics avançado
- Adicionar mais formulários de captura

---

**Status:** 🟢 Pronto para testar!
