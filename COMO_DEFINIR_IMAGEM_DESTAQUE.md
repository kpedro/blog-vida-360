# Como definir a imagem de destaque do artigo

A **imagem de destaque** é a foto que aparece no card do artigo na home e na página de artigos, e também quando alguém compartilha o link nas redes sociais (Facebook, WhatsApp, Twitter etc.).

## No painel admin

1. Acesse o **Painel Admin** do blog e faça login.
2. Clique em **Artigos** e depois em **Novo artigo** ou edite um artigo existente.
3. No formulário, à direita, procure o campo **"🖼️ Imagem de destaque (para o artigo e redes sociais)"**.
4. Cole a **URL completa** de uma imagem no campo, por exemplo:
   - `https://exemplo.com/minha-foto.jpg`
   - Ou uma URL de serviço de imagens (Imgur, Cloudinary, Supabase Storage, etc.).
5. Salve o artigo (botão **Publicar** ou **Salvar rascunho**).

## Onde conseguir a URL da imagem

- **Serviços de hospedagem de imagens:** Imgur, PostImages, Cloudinary — após enviar a imagem, copie o “link direto” da imagem.
- **Supabase Storage:** se o blog usar o Supabase para arquivos, faça upload da imagem e use a URL pública gerada.
- **Seu próprio site:** se a imagem estiver em uma pasta do projeto (ex.: `assets/images/meu-artigo.jpg`), use a URL completa no ar, ex.: `https://blog-vida-360.vercel.app/assets/images/meu-artigo.jpg`.

## Dicas

- **Tamanho sugerido:** 1200×630 pixels (proporção ~1,91:1), ideal para redes sociais.
- A URL deve começar com `http://` ou `https://`.
- Se deixar o campo vazio, o blog usará a imagem padrão do site no preview de compartilhamento.

## Para artigos já publicados

Se o artigo já existe e não tinha imagem:

1. Abra o artigo no editor (Artigos → clique no artigo).
2. Preencha o campo **Imagem de destaque** com a URL da imagem.
3. Salve.

Depois de salvar, o próximo compartilhamento do link do artigo deve mostrar a nova imagem no preview.
