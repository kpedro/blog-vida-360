# 🚀 Como Abrir o Blog Vida 360 no Cursor

**Data:** 13 de janeiro de 2025

---

> **⚠️ IMPORTANTE:** O **Blog Vida 360** é um **projeto totalmente independente**. Ele não faz parte de nenhum outro projeto (como PedagoFlow, Mente em Construção, etc.). Você pode abri-lo sozinho ou junto com outros projetos através de um workspace.

---

### ⚡ **Resumo: como abrir localmente**
1. **Terminal:** `Set-Location C:\Users\Kadson\blog-vida-360` → depois `npx --yes http-server -p 8080`
2. **Onde ver:** no navegador **http://localhost:8080** ou, **dentro do Cursor**, `Ctrl+Shift+P` → **Simple Browser: Show** → `http://localhost:8080`

*(detalhes nas Opções 3 e 4 abaixo)*

---

## 📋 **Opção 1: Abrir Diretamente no Cursor (Recomendado)** ⚡

**Este é o método mais simples e direto para trabalhar apenas no blog:**

### **Método Rápido:**
1. Abra o Cursor
2. **File → Open Folder...**
3. Navegue até: `C:\Users\Kadson\blog-vida-360`
4. Clique em **"Selecionar Pasta"**

**Pronto!** O blog estará aberto como projeto independente no Cursor.

**Vantagens:**
- ✅ Mais rápido e direto
- ✅ Foco total no blog
- ✅ Não precisa de workspace
- ✅ Projeto totalmente independente

---

## 📋 **Opção 2: Usar o Workspace (Opcional)** 🎯

**Use este método apenas se você quiser ver o blog junto com outros projetos:**

### **Passo a Passo:**
1. Abra o Cursor
2. **File → Open Workspace from File...**
3. Navegue até: `C:\Users\Kadson\app-pedagoflow\`
4. Selecione: `ABRIR_WORKSPACE_DOIS_PROJETOS.code-workspace`
5. Clique em **"Open"**

**⚠️ Nota Importante:** 
- O arquivo workspace é apenas uma **configuração** que agrupa vários projetos independentes
- O blog **não faz parte** do PedagoFlow ou de qualquer outro projeto
- Cada projeto no workspace continua sendo **totalmente independente**
- O workspace apenas permite ver múltiplos projetos na mesma janela do Cursor

**Vantagem:** Você verá o Blog Vida 360 junto com outros projetos independentes na mesma janela!

---

## 🌐 **Opção 3: Abrir Localmente (Servidor + Navegador)**

**Resumo:** para ver o blog rodando na sua máquina: (1) suba um servidor no terminal; (2) abra o endereço no navegador ou **numa aba dentro do Cursor** (Opção 4).

### **Passo 1: Subir o servidor no terminal**

No terminal do Cursor (PowerShell), na pasta do blog:

```powershell
# Ir para a pasta do blog
Set-Location C:\Users\Kadson\blog-vida-360

# Opção A: Node.js (recomendado) — no PowerShell use ";" em vez de "&&"
npx --yes http-server -p 8080

# Opção B: Python (se tiver instalado)
python -m http.server 8080

# Opção C: PHP (se tiver instalado)
php -S localhost:8080
```

> **Windows/PowerShell:** Se der erro com `&&`, use só os comandos em linhas separadas ou `;` entre eles (ex.: `Set-Location C:\Users\Kadson\blog-vida-360; npx --yes http-server -p 8080`).

Deixe o terminal aberto enquanto quiser ver o blog. Para parar o servidor: **Ctrl+C**.

### **Passo 2: Onde abrir**

- **No navegador (Chrome, Edge, etc.):** acesse **http://localhost:8080**
- **Em uma aba dentro do Cursor:** use a **Opção 4** abaixo (Simple Browser).

### **Método alternativo: abrir arquivo direto (sem servidor)**
1. No Cursor, clique com botão direito em `index.html`
2. Selecione **"Open with Live Server"** (se tiver a extensão)
3. Ou: botão direito → **"Reveal in File Explorer"** e duplo clique em `index.html`  
*(algumas coisas podem não funcionar sem servidor, por causa de caminhos e CORS.)*

---

## 📱 **Opção 4: Ver em uma aba dentro do Cursor (Simple Browser)**

**Ideal quando você quer ver o blog sem sair do Cursor.**

1. **Suba o servidor** (se ainda não estiver rodando) — veja o **Passo 1** da Opção 3.
2. Pressione **`Ctrl+Shift+P`** para abrir a Paleta de Comandos.
3. Digite: **`Simple Browser: Show`** (ou apenas "Simple Browser").
4. Selecione **"Simple Browser: Show"**.
5. Na barra que aparecer, digite: **`http://localhost:8080`** e pressione **Enter**.

O blog abre em uma aba do próprio Cursor. Para usar outra porta (ex.: 8000), troque o número na URL.

---

## 🎯 **Estrutura do Projeto no Cursor**

Quando abrir, você verá:

```
blog-vida-360/
├── 📄 index.html          ← Página principal
├── 📄 post.html           ← Template de posts
├── 📄 contato.html        ← Formulário de contato
├── 📄 sobre.html          ← Página sobre
├── 📄 produtos.html       ← Página de produtos
├── 📄 politica.html       ← Política de privacidade
├── 📄 sitemap.xml         ← Mapa do site (SEO)
├── 📄 robots.txt          ← Instruções para crawlers
├── 📄 feed.xml            ← RSS Feed
├── 📄 README.md           ← Documentação
├── 📄 MELHORIAS_IMPLEMENTADAS.md
├── 📄 COMO_ABRIR_NO_CURSOR.md  ← Este arquivo
│
├── 📁 assets/
│   ├── 📁 css/
│   │   └── style.css      ← Estilos principais
│   ├── 📁 js/
│   │   ├── script.js      ← Script principal
│   │   ├── comments.js   ← Sistema de comentários
│   │   ├── search.js      ← Sistema de busca
│   │   └── performance.js ← Otimizações
│   └── 📁 images/
│       └── [imagens do blog]
│
└── 📁 posts/
    ├── saude-mental.md
    ├── produtividade.md
    ├── equilibrio-vida.md
    ├── mentalidade-empreendedora.md
    ├── marketing-relacionamento.md
    └── habitos-produtivos.md
```

---

## 🔧 **Extensões Recomendadas para o Cursor**

Para melhor experiência ao trabalhar no blog:

1. **Live Server** - Visualizar mudanças em tempo real
2. **Prettier** - Formatação automática de código
3. **HTML CSS Support** - Autocomplete para HTML/CSS
4. **Markdown Preview** - Visualizar posts .md

---

## 🧪 **Como Testar Localmente**

### **1. Testar Página Principal:**
- Abra `index.html` no navegador
- Teste a **busca** (digite no campo de busca)
- Clique nos posts para ver se carregam

### **2. Testar Posts:**
- Clique em qualquer post na página inicial
- Verifique se o conteúdo Markdown carrega
- Teste o **sistema de comentários**

### **3. Testar Responsividade:**
- Abra as DevTools (F12)
- Clique no ícone de dispositivo móvel
- Teste em diferentes tamanhos de tela

---

## 🚀 **Deploy no GitHub Pages**

O blog já está configurado para GitHub Pages!

### **Para atualizar:**
```bash
cd C:\Users\Kadson\blog-vida-360
git add .
git commit -m "sua mensagem"
git push origin main
```

**URL do Blog:** https://kpedro.github.io/blog-vida-360/

---

## 📝 **Comandos Úteis**

### **Ver status do Git:**
```bash
cd C:\Users\Kadson\blog-vida-360
git status
```

### **Ver histórico:**
```bash
git log --oneline -10
```

### **Abrir no navegador padrão:**
```bash
start index.html
```

---

## ✅ **Checklist de Verificação**

Após abrir o projeto, verifique:

- [ ] Todos os arquivos estão visíveis no explorador
- [ ] `index.html` abre corretamente
- [ ] Posts carregam quando clicados
- [ ] Busca funciona
- [ ] Comentários podem ser adicionados
- [ ] Design está responsivo
- [ ] Sem erros no console (F12)

---

## 🆘 **Problemas Comuns**

### **Problema: Imagens não carregam**
**Solução:** Verifique se os caminhos estão corretos em `assets/images/`

### **Problema: Posts não aparecem**
**Solução:** Verifique se os arquivos `.md` estão na pasta `posts/`

### **Problema: Comentários não salvam**
**Solução:** Verifique se o localStorage está habilitado no navegador

### **Problema: Busca não funciona**
**Solução:** Abra o Console (F12) e verifique se há erros de JavaScript

---

## 📚 **Documentação Adicional**

- `README.md` - Informações gerais do projeto
- `MELHORIAS_IMPLEMENTADAS.md` - Detalhes de todas as melhorias

---

**Pronto para começar!** 🎉
