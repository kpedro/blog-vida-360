# 📧 Como Configurar Resend no Blog Vida 360º

**Data:** 13 de janeiro de 2025

---

## 🎯 **Objetivo**

Configurar o envio automático de emails de boas-vindas via Resend quando um lead se cadastra no blog.

---

## 📋 **Pré-requisitos**

- ✅ Conta no Resend (https://resend.com)
- ✅ Projeto no Vercel
- ✅ Blog já configurado e funcionando

---

## 🔧 **Passo a Passo**

### **1. Criar Conta no Resend**

1. Acesse https://resend.com
2. Crie uma conta (grátis até 3.000 emails/mês)
3. Verifique seu email

---

### **2. Obter API Key do Resend**

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome (ex: "Blog Vida 360")
4. Copie a chave (ela só aparece uma vez!)

**Exemplo:** `re_1234567890abcdefghijklmnopqrstuvwxyz`

---

### **3. Configurar Domínio (Opcional mas Recomendado)**

Para emails não irem para spam:

1. No Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Adicione seu domínio (ex: `seudominio.com`)
4. Configure os registros DNS conforme instruções
5. Aguarde verificação (pode levar algumas horas)

**Se não tiver domínio:** Use o domínio padrão do Resend (ex: `onboarding@resend.dev`)

---

### **4. Configurar Variáveis de Ambiente no Vercel**

1. Acesse https://vercel.com
2. Entre no seu projeto do blog
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

#### **Variável 1: RESEND_API_KEY**
- **Name:** `RESEND_API_KEY`
- **Value:** Cole a API key que você copiou
- **Environments:** Production, Preview, Development

#### **Variável 2: RESEND_FROM_EMAIL**
- **Name:** `RESEND_FROM_EMAIL`
- **Value:** Seu email de remetente usando o domínio verificado
  - **Para pedagoflow.com:** `noreply@pedagoflow.com` (ou `blog@pedagoflow.com`, `newsletter@pedagoflow.com`)
  - Sem domínio verificado: `onboarding@resend.dev`
- **Environments:** Production, Preview, Development

**⚠️ IMPORTANTE:** Use um email do domínio que está verificado no Resend. Se você tem `pedagoflow.com` verificado, use `@pedagoflow.com`.

---

### **5. Fazer Deploy no Vercel**

1. **Se já está conectado ao Git:**
   - Faça commit das mudanças
   - Push para o repositório
   - O Vercel fará deploy automaticamente

2. **Se não está conectado:**
   - No Vercel, vá em **Deployments**
   - Clique em **Redeploy** (ou faça um novo deploy)

---

### **6. Verificar se Funcionou**

1. Acesse seu blog
2. Preencha o formulário de newsletter
3. Verifique seu email (incluindo spam)
4. Você deve receber o email de boas-vindas!

---

## 🧪 **Testar a API Manualmente**

Você pode testar a API diretamente usando curl ou Postman:

```bash
curl -X POST https://seu-dominio.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "seu-email@exemplo.com",
    "nome": "Teste",
    "tipo": "welcome"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "messageId": "abc123...",
  "message": "Email enviado com sucesso"
}
```

---

## 🆘 **Problemas Comuns**

### **Erro: "RESEND_API_KEY não configurada"**

**Solução:**
- Verifique se a variável está configurada no Vercel
- Certifique-se de que fez redeploy após adicionar a variável
- Verifique se o nome da variável está exatamente: `RESEND_API_KEY`

---

### **Erro: "Invalid API key"**

**Solução:**
- Verifique se copiou a chave completa
- Gere uma nova chave no Resend
- Atualize no Vercel e faça redeploy

---

### **Email não chega**

**Soluções:**
1. Verifique a pasta de spam
2. Verifique os logs do Vercel (Functions → Logs)
3. Verifique o dashboard do Resend (Emails → Logs)
4. Teste com outro email

---

### **Erro 401 ou 403**

**Solução:**
- Verifique se a API key está correta
- Verifique se o domínio está verificado (se usando domínio customizado)
- Use o domínio padrão do Resend temporariamente

---

## 📊 **Monitoramento**

### **No Resend:**
- Dashboard → **Emails** → Veja estatísticas
- **Logs** → Veja emails enviados, entregues, falhas

### **No Vercel:**
- **Functions** → **Logs** → Veja logs da API
- Procure por "✅ Email enviado" ou "❌ Erro"

---

## ✅ **Checklist**

- [ ] Conta criada no Resend
- [ ] API Key obtida
- [ ] Domínio configurado (opcional)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Deploy feito no Vercel
- [ ] Teste realizado com sucesso
- [ ] Email de boas-vindas recebido

---

## 🎉 **Pronto!**

Agora todo lead que se cadastrar receberá automaticamente um email de boas-vindas! 🚀

---

**Dúvidas?** Consulte a documentação do Resend: https://resend.com/docs
