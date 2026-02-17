/**
 * API Vercel: retorna post.html com meta tags (og:image, og:title, og:description)
 * preenchidas com os dados do artigo no Supabase, para cada post.
 * Assim crawlers (Facebook, etc.) veem a imagem e o título do artigo, não do blog.
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qrjmvqedoypxmnvfdetg.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyam12cWVkb3lweG1udmZkZXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDc3MjYsImV4cCI6MjA3OTIyMzcyNn0.QjhD8GQsNiNX58EvVUJvf9seNYGR6ruLvpF1lHpSX8E';
const DEFAULT_IMAGE = 'https://blog-vida-360.vercel.app/assets/images/og-banner.png';

function loadTemplate() {
  const templatePath = path.join(__dirname, 'post-template.html');
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (e) {
    console.error('post-template.html não encontrado. Rode npm run build.', e);
    return null;
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchPost(slug) {
  const orFilter = '(status.eq.published,publicado.eq.true)';
  const url = `${SUPABASE_URL}/rest/v1/blog360_posts?slug=eq.${encodeURIComponent(slug)}&select=titulo,resumo,imagem_destaque,slug&or=${encodeURIComponent(orFilter)}&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data.length ? data[0] : null;
}

function applyMeta(html, meta) {
  let out = html;
  out = out.replace(/___OG_TITLE___/g, escapeHtml(meta.title));
  out = out.replace(/___OG_DESCRIPTION___/g, escapeHtml(meta.description));
  out = out.replace(/___OG_IMAGE___/g, meta.image);
  out = out.replace(/___OG_IMAGE_ALT___/g, escapeHtml(meta.title));
  out = out.replace(/___OG_URL___/g, meta.url);
  return out;
}

module.exports = async (req, res) => {
  const slug = (req.query && req.query.post) || '';
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://blog-vida-360.vercel.app';
  const postUrl = slug ? `${baseUrl}/post.html?post=${encodeURIComponent(slug)}` : baseUrl + '/post.html';

  let meta = {
    title: 'Vida 360º - Blog',
    description: 'Conteúdos exclusivos sobre saúde, bem-estar, produtividade, mentalidade e equilíbrio',
    image: DEFAULT_IMAGE,
    url: postUrl,
  };

  if (slug) {
    const post = await fetchPost(slug);
    if (post) {
      let img = post.imagem_destaque || post.image_url || '';
      if (img && !img.startsWith('http://') && !img.startsWith('https://')) {
        img = img.startsWith('/') ? baseUrl + img : baseUrl + '/' + img;
      }
      if (!img) img = DEFAULT_IMAGE;
      let desc = (post.resumo || post.excerpt || '').trim();
      if (desc.length > 200) desc = desc.substring(0, 197) + '...';
      if (!desc) desc = 'Leia este artigo no Blog Vida 360º';
      meta = {
        title: (post.titulo || post.title || 'Post').trim(),
        description: desc,
        image: img,
        url: postUrl,
      };
    }
  }

  const template = loadTemplate();
  if (!template) {
    res.status(500).send('Template não disponível. Execute npm run build.');
    return;
  }

  const html = applyMeta(template, meta);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate');
  res.status(200).send(html);
};
