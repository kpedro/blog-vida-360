# Como Testar Compartilhamento nas Redes Sociais

## O que foi corrigido:

1. **Meta tags Open Graph** atualizadas dinamicamente com:
   - Título do artigo
   - Resumo/descrição do artigo
   - Imagem de destaque do artigo
   - URL completa do artigo

2. **Twitter Cards** configurados com:
   - Título, descrição e imagem do artigo

3. **Script inline** no `<head>` que tenta atualizar as meta tags antes do carregamento completo

## Como testar:

### 1. Facebook Sharing Debugger
- Acesse: https://developers.facebook.com/tools/debug/
- Cole a URL do artigo (ex: `https://blog-vida-360.vercel.app/post.html?post=meu-artigo`)
- Clique em "Debugar"
- Clique em "Buscar Novamente" para forçar atualização do cache

### 2. Twitter Card Validator
- Acesse: https://cards-dev.twitter.com/validator
- Cole a URL do artigo
- Verifique se aparece título, descrição e imagem

### 3. LinkedIn Post Inspector
- Acesse: https://www.linkedin.com/post-inspector/
- Cole a URL do artigo
- Verifique o preview

### 4. WhatsApp Web
- Abra o WhatsApp Web
- Tente compartilhar o link do artigo
- Verifique se aparece preview com imagem, título e descrição

## Importante:

⚠️ **Cache das Redes Sociais**: As redes sociais fazem cache das meta tags. Se você atualizar um artigo, pode ser necessário:
1. Usar as ferramentas de debug acima para limpar o cache
2. Aguardar algumas horas para o cache expirar naturalmente

## Requisitos para funcionar corretamente:

1. **Imagem**: Deve ser uma URL absoluta (começando com `http://` ou `https://`)
2. **Título**: Máximo recomendado de 60 caracteres
3. **Descrição**: Máximo recomendado de 200 caracteres
4. **Imagem**: Tamanho recomendado 1200x630px (formato 1.91:1)

## Se não funcionar:

1. Verifique se o artigo tem `imagem_destaque` preenchido no Supabase
2. Verifique se o campo `resumo` está preenchido
3. Verifique se o campo `titulo` está preenchido
4. Use as ferramentas de debug acima para ver erros específicos
5. Verifique o console do navegador (F12) para ver se há erros JavaScript

## Nota Técnica:

As redes sociais fazem scraping do HTML estático antes do JavaScript executar. O script inline adicionado tenta atualizar as meta tags o mais rápido possível, mas para garantir 100% de funcionamento, seria necessário usar Server-Side Rendering (SSR) ou criar páginas HTML estáticas para cada post.
