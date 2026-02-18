# Como debugar o link nas redes sociais

Guia para testar e corrigir a prévia (imagem, título, descrição) quando você compartilha um link do blog em redes sociais e mensageiros.

---

## O que cada rede usa

| Rede / App        | Padrão principal   | Meta tags mais usadas |
|-------------------|--------------------|------------------------|
| **Facebook**      | Open Graph         | `og:title`, `og:description`, `og:image`, `og:url` |
| **LinkedIn**      | Open Graph         | Mesmas do Facebook |
| **WhatsApp**      | Open Graph         | Mesmas do Facebook |
| **Telegram**      | Open Graph         | Mesmas do Facebook |
| **Twitter/X**     | Twitter Cards      | `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` |
| **Pinterest**     | Open Graph         | `og:image` (imagem grande funciona melhor) |
| **Discord**       | Open Graph         | Mesmas do Facebook |
| **Slack**         | Open Graph         | Mesmas do Facebook |

Se o seu HTML já tem **Open Graph** e **Twitter Card** preenchidos, a maioria das redes consegue mostrar título, descrição e imagem.

---

## Ferramentas oficiais para debugar

### 1. Facebook (vale para WhatsApp, Telegram, etc.)

- **URL:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Uso:** Cole a URL da página (ex: `https://blog-vida-360.vercel.app/post.html?post=meu-artigo`) e clique em **Depurar**.
- **O que faz:** Mostra o que o Facebook “enxerga” (título, descrição, imagem) e permite **Atualizar a prévia** (limpa o cache).
- **Dica:** Depois de mudar `og:image` ou texto, use **Atualizar a prévia** para ver o novo resultado sem esperar o cache expirar.

### 2. Twitter / X

- **URL:** [Twitter Card Validator](https://cards-dev.twitter.com/validator) (pode pedir login).
- **Uso:** Cole a URL da página e valide.
- **O que faz:** Mostra como o card vai aparecer no Twitter e avisa se alguma tag está faltando ou inválida.

### 3. LinkedIn

- **URL:** [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- **Uso:** Cole a URL da página.
- **O que faz:** Mostra a prévia que o LinkedIn gera e permite “re-scrape” para atualizar após mudanças.

### 4. Pinterest

- **URL:** [Pinterest Rich Pins Validator](https://developers.pinterest.com/tools/url-debugger/)
- **Uso:** Cole a URL.
- **O que faz:** Valida se a página tem meta tags suficientes para Rich Pins (usa Open Graph).

---

## Checklist rápido no seu HTML

Garanta que no `<head>` exista algo assim (ajuste os valores para sua página):

```html
<!-- Open Graph (Facebook, WhatsApp, LinkedIn, Telegram, Discord, Slack) -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://blog-vida-360.vercel.app/">
<meta property="og:title" content="Título que aparece na prévia">
<meta property="og:description" content="Descrição curta que aparece na prévia">
<meta property="og:image" content="https://blog-vida-360.vercel.app/assets/images/og-banner.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="pt_BR">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://blog-vida-360.vercel.app/">
<meta name="twitter:title" content="Título que aparece na prévia">
<meta name="twitter:description" content="Descrição curta">
<meta name="twitter:image" content="https://blog-vida-360.vercel.app/assets/images/og-banner.png">
```

---

## Problemas comuns e como resolver

### 1. Imagem não aparece ou está cortada

- **Causa:** Tamanho ou proporção inadequados.
- **Recomendação:** Use imagem **absoluta** (URL completa) em `og:image` e `twitter:image`. Tamanho sugerido: **1200×630 px** (proporção 1.91:1). Evite imagens muito altas ou quadradas se quiser “card largo”.
- **Debugar:** No Facebook Debugger, veja a imagem que ele detectou; se estiver errada, confira a URL da imagem no HTML.

### 2. Prévia antiga mesmo depois de mudar o site

- **Causa:** Cache da rede social.
- **Solução:**  
  - **Facebook/WhatsApp:** usar o [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) e clicar em **Atualizar a prévia**.  
  - **LinkedIn:** usar o [Post Inspector](https://www.linkedin.com/post-inspector/) e pedir novo fetch.  
  - **Twitter:** usar o [Card Validator](https://cards-dev.twitter.com/validator) para forçar nova leitura.

### 3. URL da imagem quebrada

- **Causa:** `og:image` ou `twitter:image` com caminho relativo (ex: `/assets/og-banner.png`) ou URL inacessível.
- **Solução:** Use **sempre URL absoluta** e acessível em qualquer rede, por exemplo:  
  `https://blog-vida-360.vercel.app/assets/images/og-banner.png`  
  Teste a URL da imagem no navegador (abrir em aba anônima) para garantir que retorna 200 e a imagem.

### 4. Título ou descrição errados / genéricos

- **Causa:** Meta tags fixas para todas as páginas ou tags vazias.
- **Solução:** Em páginas dinâmicas (ex: post), preencher `og:title`, `og:description` e `og:image` com os dados do post (título, resumo, imagem do artigo). No blog, isso pode ser feito no HTML estático por página ou via JS/backend ao servir o HTML.

### 5. WhatsApp mostra prévia diferente do Facebook

- **Causa:** WhatsApp usa o mesmo protocolo (Open Graph) que o Facebook, mas pode haver cache próprio.
- **Solução:** Garanta que `og:*` e `twitter:image` estão corretos. Para “atualizar” no WhatsApp, use o Facebook Debugger na mesma URL; em muitos casos o WhatsApp atualiza depois. Testar em outro chat ou após um tempo também ajuda.

---

## Ordem sugerida para debugar

1. **Corrigir o HTML:** meta tags com URL absoluta, imagem 1200×630, título e descrição preenchidos.
2. **Testar a URL da imagem:** abrir no navegador e ver se carrega.
3. **Facebook Debugger:** colar a URL da página → Depurar → Atualizar a prévia.
4. **Twitter Card Validator:** colar a URL e ver se o card aparece como esperado.
5. **LinkedIn Post Inspector:** colar a URL e re-scrape.
6. **Teste real:** enviar o link no WhatsApp/Telegram/Facebook e ver a prévia no app.

---

## Links rápidos

| Ferramenta              | URL |
|-------------------------|-----|
| Facebook Sharing Debugger | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator    | https://cards-dev.twitter.com/validator |
| LinkedIn Post Inspector   | https://www.linkedin.com/post-inspector/ |
| Pinterest URL Debugger   | https://developers.pinterest.com/tools/url-debugger/ |

Com isso você consegue debugar e ajustar o link do blog em todas as redes que usam Open Graph e Twitter Cards.
