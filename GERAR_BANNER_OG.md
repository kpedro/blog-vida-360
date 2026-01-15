# 📸 Como Gerar o Banner para Redes Sociais

**Objetivo:** Criar uma imagem 1200x630px para preview do blog quando compartilhado no Facebook, LinkedIn, WhatsApp, Twitter, etc.

---

## 🎨 Opção 1: Capturar do HTML (Rápido)

### **Passo a Passo:**

1. **Abra o arquivo no navegador:**
   - Vá em `assets/images/og-banner.html`
   - Clique com botão direito > "Abrir com" > Navegador

2. **Ajuste o zoom:**
   - Pressione `Ctrl + 0` (Windows) ou `Cmd + 0` (Mac)
   - Garante que está 100%

3. **Capture a imagem:**
   
   **Método A - DevTools (Chrome/Edge):**
   - Pressione `F12`
   - Clique nos 3 pontinhos verticais (⋮) no canto superior direito do DevTools
   - Selecione "Capture screenshot" ou "Capturar captura de tela"
   - A imagem será baixada automaticamente
   
   **Método B - Extensões:**
   - Instale extensão: [FireShot](https://chrome.google.com/webstore/detail/take-webpage-screenshots/mcbpblocgmgfnpjjppndjkmgjaogfceg) ou [Awesome Screenshot](https://www.awesomescreenshot.com/)
   - Clique na extensão > "Capture visible part"
   - Salve a imagem

4. **Salvar:**
   - Nome: `og-banner.png` ou `og-banner.jpg`
   - Local: `C:\Users\Kadson\blog-vida-360\assets\images\`

---

## 🎨 Opção 2: Criar no Canva (Profissional)

### **Passo a Passo:**

1. **Acesse:** https://www.canva.com/

2. **Criar design:**
   - Clique em "Criar um design"
   - Selecione "Tamanho personalizado"
   - Digite: **1200 x 630 pixels**
   - Clique em "Criar novo design"

3. **Design sugerido:**

   **Fundo:**
   - Cor sólida: `#2C3E50` (azul escuro)
   - Ou gradiente: `#2C3E50` → `#34495E`

   **Texto principal:**
   - Fonte: Poppins ou Montserrat (Bold)
   - Tamanho: 72pt
   - Cor: `#ECF0F1` (branco suave)
   - Texto: "Vida 360º"

   **Subtítulo:**
   - Fonte: Poppins (Regular)
   - Tamanho: 36pt
   - Cor: `#ECF0F1`
   - Texto: "Transforme sua vida com bem-estar completo"

   **Destaque:**
   - Palavra "bem-estar completo" em `#E74C3C` (vermelho)

   **Descrição:**
   - Fonte: Poppins (Light)
   - Tamanho: 24pt
   - Cor: `#ECF0F1` (90% opacidade)
   - Texto: "Dicas práticas sobre saúde, produtividade, mentalidade e equilíbrio"

   **Ícones (opcional):**
   - 💚 Saúde | ⚡ Produtividade | 🧠 Mentalidade | ⚖️ Equilíbrio
   - Posicione na parte inferior

   **Elementos decorativos:**
   - Círculos vazados com borda `#E74C3C`
   - Opacidade baixa (10-20%)
   - Posicione nas bordas

4. **Baixar:**
   - Clique em "Compartilhar" > "Baixar"
   - Formato: PNG (alta qualidade) ou JPG
   - Baixe a imagem

5. **Salvar:**
   - Nome: `og-banner.png`
   - Local: `C:\Users\Kadson\blog-vida-360\assets\images\`

---

## 🎨 Opção 3: Template Pronto no Canva

Use um template profissional:

1. Acesse Canva
2. Pesquise: **"Facebook Post"** ou **"Social Media Post"**
3. Filtre por tamanho: 1200x630px
4. Escolha um template clean/minimalista
5. Personalize com:
   - Logo/nome: "Vida 360º"
   - Cores: `#2C3E50` e `#E74C3C`
   - Texto do blog
6. Baixe como PNG

---

## 📋 Especificações Técnicas

### **Dimensões:**
- **Largura:** 1200px
- **Altura:** 630px
- **Proporção:** 1.91:1

### **Formatos aceitos:**
- PNG (melhor qualidade, maior peso)
- JPG (boa qualidade, menor peso)

### **Peso recomendado:**
- Máximo: 8 MB (Facebook/LinkedIn)
- Ideal: 300 KB - 1 MB

### **Onde é usado:**
- Facebook
- LinkedIn
- Twitter
- WhatsApp
- Telegram
- Slack
- Discord

---

## 🔧 Implementar no Blog

Após criar a imagem, atualize o `index.html`:

```html
<head>
  <!-- ... outras tags ... -->
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="assets/images/favicon.svg">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://blog-vida-360.vercel.app/">
  <meta property="og:title" content="Vida 360º - Blog de Saúde, Bem-estar e Produtividade">
  <meta property="og:description" content="Transforme sua vida com dicas práticas sobre saúde, produtividade, mentalidade e equilíbrio para uma vida mais plena.">
  <meta property="og:image" content="https://blog-vida-360.vercel.app/assets/images/og-banner.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://blog-vida-360.vercel.app/">
  <meta name="twitter:title" content="Vida 360º - Blog de Saúde, Bem-estar e Produtividade">
  <meta name="twitter:description" content="Transforme sua vida com dicas práticas sobre saúde, produtividade, mentalidade e equilíbrio.">
  <meta name="twitter:image" content="https://blog-vida-360.vercel.app/assets/images/og-banner.png">
</head>
```

---

## ✅ Testar o Banner

Após fazer deploy, teste em:

1. **Facebook Sharing Debugger:**
   - https://developers.facebook.com/tools/debug/
   - Cole a URL: `https://blog-vida-360.vercel.app/`
   - Clique em "Depurar"

2. **LinkedIn Post Inspector:**
   - https://www.linkedin.com/post-inspector/
   - Cole a URL do blog

3. **Twitter Card Validator:**
   - https://cards-dev.twitter.com/validator
   - Cole a URL do blog

4. **WhatsApp:**
   - Envie o link para você mesmo
   - Verifique o preview

---

## 🎨 Paleta de Cores do Blog

Use estas cores ao criar no Canva:

- **Primária:** `#2C3E50` (Azul escuro profissional)
- **Secundária:** `#34495E` (Azul médio)
- **Destaque:** `#E74C3C` (Vermelho vibrante)
- **Texto claro:** `#ECF0F1` (Branco suave)
- **Texto escuro:** `#2C3E50`
- **Cinza claro:** `#BDC3C7`

---

## 📊 Boas Práticas

1. **Texto legível:** Contraste alto entre fundo e texto
2. **Hierarquia visual:** Título grande, subtítulo médio, descrição menor
3. **Espaçamento:** Não encher demais, deixe "ar"
4. **Logo/marca:** Posicione de forma destacada
5. **CTA (opcional):** "Leia mais", "Acesse agora"
6. **Consistência:** Use as mesmas cores e fontes do blog

---

## ✅ Checklist Final

- [ ] Imagem criada (1200x630px)
- [ ] Salva em `assets/images/og-banner.png`
- [ ] Favicon SVG criado
- [ ] Meta tags Open Graph adicionadas no `index.html`
- [ ] Commit e push para GitHub
- [ ] Deploy no Vercel
- [ ] Testar no Facebook Debugger
- [ ] Testar compartilhamento no WhatsApp

---

**Tempo estimado:** 15-30 minutos

**Resultado:** Preview profissional quando compartilhar o blog! 🎉
