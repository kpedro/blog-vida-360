/**
 * Gera api/post-template.html a partir de post.html com placeholders para meta tags.
 * Usado pela API dynamic-post para injetar og:image, og:title etc. por artigo.
 * Executado no build: npm run build
 */
const fs = require('fs');
const path = require('path');

const postPath = path.join(__dirname, '../post.html');
const outPath = path.join(__dirname, '../api/post-template.html');

let html = fs.readFileSync(postPath, 'utf8');

const defaults = {
  ogTitle: 'Vida 360º - Blog',
  ogDescription: 'Conteúdos exclusivos sobre saúde, bem-estar, produtividade, mentalidade e equilíbrio',
  ogImage: 'https://blog-vida-360.vercel.app/assets/images/og-banner.png',
  ogUrl: '',
  ogImageAlt: 'Vida 360º Blog',
};

// Substituir valores atuais por placeholders (para a API preencher)
html = html.replace(
  /<meta property="og:title" content="[^"]*"/,
  '<meta property="og:title" content="___OG_TITLE___"'
);
html = html.replace(
  /<meta property="og:description" content="[^"]*"/,
  '<meta property="og:description" content="___OG_DESCRIPTION___"'
);
html = html.replace(
  /<meta property="og:image" content="[^"]*"/,
  '<meta property="og:image" content="___OG_IMAGE___"'
);
html = html.replace(
  /<meta property="og:image:alt" content="[^"]*"/,
  '<meta property="og:image:alt" content="___OG_IMAGE_ALT___"'
);
html = html.replace(
  /<meta property="og:url" content="[^"]*"/,
  '<meta property="og:url" content="___OG_URL___"'
);
html = html.replace(
  /<meta name="twitter:title" content="[^"]*"/,
  '<meta name="twitter:title" content="___OG_TITLE___"'
);
html = html.replace(
  /<meta name="twitter:description" content="[^"]*"/,
  '<meta name="twitter:description" content="___OG_DESCRIPTION___"'
);
html = html.replace(
  /<meta name="twitter:image" content="[^"]*"/,
  '<meta name="twitter:image" content="___OG_IMAGE___"'
);
html = html.replace(
  /<meta name="twitter:image:alt" content="[^"]*"/,
  '<meta name="twitter:image:alt" content="___OG_IMAGE_ALT___"'
);
// Título da página
html = html.replace(
  /<title id="page-title">[^<]*<\/title>/,
  '<title id="page-title">___OG_TITLE___ - Vida 360º</title>'
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log('✅ api/post-template.html gerado com placeholders OG.');
console.log('   Placeholders: ___OG_TITLE___, ___OG_DESCRIPTION___, ___OG_IMAGE___, ___OG_URL___, ___OG_IMAGE_ALT___');
