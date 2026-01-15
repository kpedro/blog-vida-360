# ✅ Verificar Configuração Resend no Vercel

**Data:** 13 de janeiro de 2025

---

## 🔍 **Verificação Rápida**

Se as variáveis já estão no Vercel mas o email não funciona, verifique:

---

## 1️⃣ **Nomes das Variáveis**

No Vercel, as variáveis devem estar exatamente assim:

- ✅ `RESEND_API_KEY` (não `VITE_RESEND_API_KEY`)
- ✅ `RESEND_FROM_EMAIL` (não `VITE_RESEND_FROM_EMAIL`)

**⚠️ IMPORTANTE:** A API usa `process.env.RESEND_API_KEY`, não `VITE_*`

---

## 2️⃣ **Valores das Variáveis**

### **RESEND_API_KEY:**
- Deve começar com `re_`
- Exemplo: `re_1234567890abcdefghijklmnopqrstuvwxyz`
- Deve ter pelo menos 40 caracteres

### **RESEND_FROM_EMAIL:**
- Se não tem domínio verificado: `onboarding@resend.dev`
- Se tem domínio verificado: `noreply@seudominio.com`
- Deve ser um email válido

---

## 3️⃣ **Environments (Ambientes)**

Certifique-se de que as variáveis estão marcadas para:
- ✅ **Production**
- ✅ **Preview** (opcional)
- ✅ **Development** (opcional)

---

## 4️⃣ **Redeploy Obrigatório**

**⚠️ CRÍTICO:** Após adicionar/modificar variáveis, você DEVE fazer redeploy!

### **Opção 1: Redeploy Manual**
1. No Vercel, vá em **Deployments**
2. Clique nos **3 pontinhos** (⋯) do último deploy
3. Clique em **Redeploy**
4. Aguarde o deploy terminar (1-2 minutos)

### **Opção 2: Trigger via Git**
1. Faça uma pequena alteração (ex: adicione um espaço em branco)
2. Commit e push
3. O Vercel fará deploy automático

---

## 5️⃣ **Verificar se Funcionou**

Após o redeploy, teste:

1. Acesse o blog no Vercel
2. Preencha o formulário
3. Abra o Console (F12)
4. Procure por:

**✅ Se funcionar:**
```
✅ Email de boas-vindas enviado com sucesso!
   - Message ID: abc123...
```

**❌ Se ainda der erro:**
```
❌ Erro: Configuração de email não disponível
```

---

## 6️⃣ **Verificar Logs do Vercel**

1. No Vercel, vá em **Functions** → **Logs**
2. Procure por logs da função `api/send-email`
3. Veja se aparece:

**✅ Sucesso:**
```
✅ Email enviado com sucesso: abc123...
```

**❌ Erro:**
```
❌ RESEND_API_KEY não configurada
```
ou
```
❌ Invalid API key
```

---

## 🆘 **Problemas Comuns**

### **Erro: "RESEND_API_KEY não configurada"**

**Causas possíveis:**
1. Variável não foi adicionada
2. Nome está errado (deve ser `RESEND_API_KEY`, não `VITE_RESEND_API_KEY`)
3. Não foi feito redeploy após adicionar

**Solução:**
1. Verifique o nome exato da variável
2. Faça redeploy manual
3. Aguarde 1-2 minutos
4. Teste novamente

---

### **Erro: "Invalid API key"**

**Causa:** API key incorreta ou expirada

**Solução:**
1. Gere nova API key no Resend
2. Atualize no Vercel
3. Faça redeploy
4. Teste novamente

---

### **Erro: "domain not verified"**

**Causa:** Email de remetente usando domínio não verificado

**Solução:**
1. Use temporariamente: `onboarding@resend.dev`
2. Ou verifique seu domínio no Resend
3. Atualize `RESEND_FROM_EMAIL` no Vercel
4. Faça redeploy

---

## ✅ **Checklist de Verificação**

- [ ] Variável `RESEND_API_KEY` existe no Vercel
- [ ] Variável `RESEND_FROM_EMAIL` existe no Vercel
- [ ] Nomes estão corretos (sem `VITE_` no início)
- [ ] Valores estão corretos
- [ ] Environments marcados (Production)
- [ ] **Redeploy foi feito após adicionar variáveis**
- [ ] Logs do Vercel verificados
- [ ] Teste realizado após redeploy

---

## 🧪 **Teste Manual da API**

Após o redeploy, teste diretamente:

```bash
curl -X POST https://blog-vida-360.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "seu-email@exemplo.com",
    "nome": "Teste",
    "tipo": "welcome"
  }'
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

## 📋 **Próximos Passos**

1. **Verifique os nomes das variáveis** (devem ser `RESEND_API_KEY` e `RESEND_FROM_EMAIL`)
2. **Faça redeploy manual** no Vercel
3. **Aguarde 1-2 minutos**
4. **Teste novamente** o formulário
5. **Verifique os logs** do Vercel se ainda der erro

---

**Status:** 🔍 Verificando configuração

Me diga:
1. Os nomes das variáveis estão exatamente `RESEND_API_KEY` e `RESEND_FROM_EMAIL`?
2. Você fez redeploy após adicionar as variáveis?
3. O que aparece nos logs do Vercel (Functions → Logs)?

Com essas informações, posso ajudar a resolver! 🚀
