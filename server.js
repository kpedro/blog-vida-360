// Servidor HTTP simples para desenvolvimento local
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Remover query string
  let filePath = req.url.split('?')[0];
  
  // Se for raiz, servir index.html
  if (filePath === '/') {
    filePath = '/index.html';
  }

  // Construir caminho completo (remover barra inicial se houver)
  const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  const fullPath = path.join(__dirname, normalizedPath);

  console.log(`  → Tentando servir: ${fullPath}`);

  // Verificar se arquivo existe
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`  ❌ Arquivo não encontrado: ${fullPath}`);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`<h1>404 - Arquivo não encontrado</h1><p>${fullPath}</p>`);
      return;
    }

    // Ler e servir arquivo
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        console.log(`  ❌ Erro ao ler arquivo: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Erro interno</h1>');
        return;
      }

      const ext = path.extname(fullPath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      console.log(`  ✅ Servindo: ${fullPath} (${contentType})`);
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Abra http://localhost:${PORT}/admin-dashboard.html no navegador\n`);
  console.log(`📊 Dashboard Admin: http://localhost:${PORT}/admin-dashboard.html`);
  console.log(`🔐 Login Admin: http://localhost:${PORT}/admin-login.html\n`);
});
