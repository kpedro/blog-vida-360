# 🧪 Como Testar o Formulário de Newsletter

**Data:** 13 de janeiro de 2025

---

## 📍 **Onde Está o Formulário**

O formulário de newsletter está localizado:
- **Topo da página inicial** (`index.html`)
- Logo após o texto de boas-vindas
- Antes da barra de busca

---

## 🔍 **Verificar se Está Visível**

### **1. Abrir o Blog**
- Abra `index.html` no navegador
- Ou acesse: https://kpedro.github.io/blog-vida-360/

### **2. Localizar o Formulário**
Você deve ver uma caixa com:
- Título: "📧 Receba Conteúdo Exclusivo!"
- Texto: "Cadastre-se e receba nosso **Guia Completo de Bem-Estar** grátis!"
- Campo de email
- Botão: "Quero Receber Grátis"

### **3. Se Não Aparecer**

**Verifique no Console (F12):**
- Abra DevTools (F12)
- Vá na aba **Console**
- Procure por erros relacionados a:
  - CSS não carregado
  - JavaScript não carregado
  - Erros de Supabase

**Verifique no Network (F12):**
- Abra DevTools (F12)
- Vá na aba **Network**
- Recarregue a página (F5)
- Verifique se `leads.css` está sendo carregado (status 200)

---

## 🧪 **Testar o Formulário**

### **1. Preencher Email**
- Digite um email válido (ex: `teste@exemplo.com`)
- Clique em "Quero Receber Grátis"

### **2. Verificar no Console**
- Abra DevTools (F12) → Console
- Deve aparecer mensagens de sucesso ou erro

### **3. Verificar no Supabase**
- Acesse https://supabase.com
- Vá em **Table Editor**
- Abra a tabela `blog360_leads`
- O email deve aparecer na lista

---

## 🆘 **Problemas Comuns**

### **Formulário não aparece**
- ✅ Verifique se o arquivo `assets/css/leads.css` existe
- ✅ Verifique se o link está correto no HTML: `<link rel="stylesheet" href="assets/css/leads.css">`
- ✅ Limpe o cache do navegador (Ctrl+Shift+R)

### **Formulário aparece mas não funciona**
- ✅ Verifique se as credenciais do Supabase estão corretas
- ✅ Verifique se o script `assets/js/supabase.js` está carregando
- ✅ Verifique se o script `assets/js/leads.js` está carregando
- ✅ Abra o Console (F12) e veja se há erros

### **Erro ao enviar**
- ✅ Verifique se as tabelas foram criadas no Supabase
- ✅ Verifique se as políticas RLS permitem INSERT
- ✅ Verifique se as credenciais estão corretas

---

## ✅ **Teste Completo**

1. ✅ Formulário visível na página
2. ✅ Campo de email funcional
3. ✅ Botão clicável
4. ✅ Mensagem de sucesso após envio
5. ✅ Lead salvo no Supabase
6. ✅ Pop-up aparece após 60s ou 50% scroll

---

**Status:** 🟢 Pronto para testar!
