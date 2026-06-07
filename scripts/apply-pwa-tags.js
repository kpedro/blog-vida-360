/**
 * Adiciona tags PWA e script de instalação nas páginas públicas do blog.
 * Uso: node scripts/apply-pwa-tags.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pages = [
  "index.html",
  "artigos.html",
  "post.html",
  "sobre.html",
  "contato.html",
  "produtos.html",
  "politica.html",
  "ebooks.html",
  "oportunidades.html",
  "protocolos.html",
  "quiz.html",
  "quiz-suplementacao.html",
];

const headBlock = `
    <!-- PWA -->
    <link rel="manifest" href="/manifest.webmanifest">
    <meta name="theme-color" content="#7f3f98">
    <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Vida 360º">
    <meta name="mobile-web-app-capable" content="yes">
    <link rel="stylesheet" href="assets/css/pwa-install.css">`;

const scriptTag = `    <script src="assets/js/pwa.js" defer></script>`;

for (const file of pages) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) {
    console.warn("Ignorado (não existe):", file);
    continue;
  }

  let html = fs.readFileSync(filePath, "utf8");
  let changed = false;

  if (!html.includes('href="/manifest.webmanifest"')) {
    const faviconNeedle = '<link rel="icon" type="image/png" href="assets/images/avatar-vida360.png">';
    if (html.includes(faviconNeedle)) {
      html = html.replace(faviconNeedle, faviconNeedle + headBlock);
      changed = true;
    } else {
      console.warn("Favicon não encontrado em:", file);
    }
  }

  if (!html.includes("assets/js/pwa.js")) {
    if (html.includes("</body>")) {
      html = html.replace("</body>", scriptTag + "\n</body>");
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, html, "utf8");
    console.log("Atualizado:", file);
  } else {
    console.log("Sem alterações:", file);
  }
}
