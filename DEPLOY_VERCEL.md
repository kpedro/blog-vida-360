# 🚀 Como Fazer Deploy do Blog no Vercel

**Data:** 13 de janeiro de 2025

---

## 🎯 **Objetivo**

Fazer deploy do Blog Vida 360º no Vercel para habilitar:
- ✅ API de envio de emails (Resend)
- ✅ Edge Functions
- ✅ Deploy automático via Git
- ✅ HTTPS e CDN global

---

## 📋 **Pré-requisitos**

- ✅ Conta no GitHub (ou GitLab/Bitbucket)
- ✅ Blog já commitado no repositório
- ✅ Conta no Vercel (grátis)

---

## 🔧 **Passo a Passo**

### **1. Criar Conta no Vercel**

1. Acesse https://vercel.com
2. Clique em **Sign Up**
3. Escolha **Continue with GitHub** (ou GitLab/Bitbucket)
4. Autorize o Vercel a acessar seus repositórios

---

### **2. Conectar Repositório**

1. No dashboard do Vercel, clique em **Add New...** → **Project**
2. Selecione o repositório `blog-vida-360`
3. Clique em **Import**

---

### **3. Configurar Projeto**

O Vercel detectará automaticamente que é um site estático. Configure:

#### **Project Settings:**
- **Framework Preset:** Other (ou Static HTML)
- **Root Directory:** `./` (raiz do projeto)
- **Build Command:** (deixe vazio - não precisa build)
- **Output Directory:** `./` (raiz do projeto)

#### **Environment Variables:**
Por enquanto, deixe vazio. Vamos configurar depois quando configurar o Resend.

---

### **4. Fazer Deploy**

1. Clique em **Deploy**
2. Aguarde o deploy (1-2 minutos)
3. Quando terminar, você verá uma URL como: `blog-vida-360-xxxxx.vercel.app`

---

### **5. Configurar Domínio Customizado (Opcional)**

1. No projeto, vá em **Settings** → **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `blog.seudominio.com`)
4. Configure os registros DNS conforme instruções
5. Aguarde verificação (pode levar algumas horas)

---

### **6. Verificar Deploy**

1. Acesse a URL do Vercel (ex: `https://blog-vida-360-xxxxx.vercel.app`)
2. Verifique se o blog está funcionando
3. Teste o formulário de newsletter
4. Verifique se os leads estão sendo salvos no Supabase

---

## 🔄 **Deploy Automático**

Agora, sempre que você fizer `git push`:
- ✅ O Vercel detectará automaticamente
- ✅ Fará deploy automático
- ✅ Você receberá notificação por email

---

## 📝 **Estrutura de Arquivos**

O Vercel precisa destes arquivos na raiz:

- ✅ `index.html` - Página principal
- ✅ `vercel.json` - Configuração do Vercel (já criado)
- ✅ `api/` - Pasta com Edge Functions (já criada)

---

## 🧪 **Testar API após Deploy**

Após o deploy, teste a API:

```bash
curl -X POST https://seu-projeto.vercel.app/api/send-email \
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
  "error": "RESEND_API_KEY não configurada"
}
```

Isso é normal! Significa que a API está funcionando, só falta configurar o Resend.

---

## ⚙️ **Configurar Variáveis de Ambiente**

Após o deploy, configure as variáveis:

1. No Vercel, vá em **Settings** → **Environment Variables**
2. Adicione:
   - `RESEND_API_KEY` = sua chave do Resend
   - `RESEND_FROM_EMAIL` = seu email de remetente
3. Clique em **Save**
4. Faça **Redeploy** (ou aguarde deploy automático)

---

## 🆘 **Problemas Comuns**

### **Erro: "Build failed"**

**Solução:**
- Verifique se não há erros de sintaxe nos arquivos
- Verifique os logs do build no Vercel
- Certifique-se de que `vercel.json` está correto

---

### **Erro: "404 Not Found" na API**

**Solução:**
- Verifique se o arquivo `api/send-email.js` existe
- Verifique se `vercel.json` está configurado corretamente
- Faça redeploy

---

### **Site não atualiza após push**

**Solução:**
- Verifique se o repositório está conectado corretamente
- Verifique se o webhook do Vercel está ativo
- Faça redeploy manual se necessário

---

## ✅ **Checklist**

- [ ] Conta criada no Vercel
- [ ] Repositório conectado
- [ ] Deploy realizado com sucesso
- [ ] Site acessível na URL do Vercel
- [ ] Formulário funcionando
- [ ] API endpoint acessível (mesmo que retorne erro de config)
- [ ] Variáveis de ambiente configuradas (quando configurar Resend)

---

## 🎉 **Pronto!**

Agora seu blog está no Vercel! 🚀

**Próximos passos:**
1. Configurar Resend (veja `CONFIGURAR_RESEND.md`)
2. Adicionar variáveis de ambiente no Vercel
3. Testar envio de emails

---

**Dúvidas?** Consulte a documentação do Vercel: https://vercel.com/docs
