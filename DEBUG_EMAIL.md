# 🔍 Debug - Email de Boas-vindas Não Chegou

**Data:** 13 de janeiro de 2025

---

## ❌ **Problema**

Lead foi salvo no Supabase ✅, mas email de boas-vindas não chegou ❌

---

## 🔍 **Como Diagnosticar**

### **1. Verificar Console do Navegador**

1. Abra o blog no navegador
2. Abra DevTools (F12)
3. Vá na aba **Console**
4. Preencha o formulário novamente
5. Procure por estas mensagens:

**✅ Se aparecer:**
```
📧 Enviando email de boas-vindas para: seu-email@exemplo.com
✅ Email de boas-vindas enviado com sucesso! abc123...
```

**❌ Se aparecer:**
```
⚠️ Erro ao enviar email de boas-vindas: ...
```

---

### **2. Verificar Network (Rede)**

1. No DevTools, vá na aba **Network**
2. Recarregue a página (F5)
3. Preencha o formulário
4. Procure por uma requisição para `/api/send-email`
5. Clique nela e veja:
   - **Status:** Deve ser 200 (sucesso) ou 500 (erro)
   - **Response:** Veja a mensagem de resposta

**Possíveis respostas:**

✅ **200 OK:**
```json
{
  "success": true,
  "messageId": "abc123...",
  "message": "Email enviado com sucesso"
}
```

❌ **500 Error:**
```json
{
  "error": "RESEND_API_KEY não configurada"
}
```

❌ **500 Error:**
```json
{
  "error": "Configuração de email não disponível"
}
```

---

### **3. Verificar Logs do Vercel**

1. Acesse https://vercel.com
2. Entre no seu projeto
3. Vá em **Functions** → **Logs**
4. Procure por logs da função `api/send-email`
5. Veja se há erros

**Logs esperados:**
- `✅ Email enviado com sucesso: abc123...`
- `❌ RESEND_API_KEY não configurada`
- `❌ Erro ao enviar email: ...`

---

### **4. Verificar Variáveis de Ambiente no Vercel**

1. No Vercel, vá em **Settings** → **Environment Variables**
2. Verifique se existem:
   - `RESEND_API_KEY` ✅ ou ❌
   - `RESEND_FROM_EMAIL` ✅ ou ❌

**Se não existirem:**
- Você precisa configurar o Resend primeiro
- Veja `CONFIGURAR_RESEND.md`

---

## 🆘 **Soluções por Erro**

### **Erro: "RESEND_API_KEY não configurada"**

**Causa:** Variável de ambiente não configurada no Vercel

**Solução:**
1. Crie conta no Resend (https://resend.com)
2. Obtenha API key
3. No Vercel, adicione `RESEND_API_KEY`
4. Faça redeploy

---

### **Erro: "Invalid API key"**

**Causa:** API key incorreta ou expirada

**Solução:**
1. Gere nova API key no Resend
2. Atualize no Vercel
3. Faça redeploy

---

### **Erro: "domain not verified"**

**Causa:** Domínio não verificado no Resend

**Solução:**
1. Use o domínio padrão: `onboarding@resend.dev`
2. Ou verifique seu domínio no Resend
3. Atualize `RESEND_FROM_EMAIL` no Vercel

---

### **Erro: "Failed to fetch" ou CORS**

**Causa:** API não está acessível ou erro de rede

**Solução:**
1. Verifique se a API está funcionando:
   - Acesse: `https://blog-vida-360.vercel.app/api/send-email`
   - Deve retornar erro 405 (método não permitido) - isso é normal
2. Verifique se o deploy foi bem-sucedido
3. Verifique logs do Vercel

---

### **Email não chega (mas API retorna sucesso)**

**Causa:** Email pode estar na pasta de spam

**Soluções:**
1. Verifique pasta de spam
2. Verifique logs do Resend (dashboard → Emails → Logs)
3. Verifique se o email de destino está correto
4. Teste com outro email

---

## 🧪 **Teste Manual da API**

Você pode testar a API diretamente:

```bash
curl -X POST https://blog-vida-360.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "seu-email@exemplo.com",
    "nome": "Teste",
    "tipo": "welcome"
  }'
```

**Resposta esperada (sem Resend configurado):**
```json
{
  "error": "Configuração de email não disponível"
}
```

**Resposta esperada (com Resend configurado):**
```json
{
  "success": true,
  "messageId": "abc123...",
  "message": "Email enviado com sucesso"
}
```

---

## ✅ **Checklist de Verificação**

- [ ] Console do navegador verificado (F12)
- [ ] Network tab verificado (requisição `/api/send-email`)
- [ ] Logs do Vercel verificados
- [ ] Variáveis de ambiente verificadas no Vercel
- [ ] Resend configurado (se necessário)
- [ ] Redeploy feito após configurar variáveis
- [ ] Pasta de spam verificada
- [ ] Logs do Resend verificados

---

## 📋 **Próximos Passos**

1. **Se Resend NÃO está configurado:**
   - Siga o guia `CONFIGURAR_RESEND.md`
   - Configure variáveis no Vercel
   - Faça redeploy

2. **Se Resend JÁ está configurado:**
   - Verifique logs do Vercel
   - Verifique logs do Resend
   - Teste manualmente a API
   - Verifique pasta de spam

---

**Status:** 🔍 Aguardando diagnóstico

Me envie:
1. O que aparece no Console (F12)
2. O que aparece no Network (requisição `/api/send-email`)
3. Se as variáveis estão configuradas no Vercel

Com essas informações, posso ajudar a resolver! 🚀
